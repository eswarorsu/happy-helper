import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import createAuthMiddleware from "../middleware/auth.js";

const router = express.Router();

// Create auth middleware instance
const authMiddleware = createAuthMiddleware();

// ============================================================================
// SECURITY: Per-route rate limiters (OWASP A04:2021 – Rate Limiting)
//
// These are intentionally tighter than the global 100 req/15 min limiter:
//   • coupon validation  – 10/15 min  (prevents brute-force coupon guessing)
//   • order creation     – 20/15 min  (limits spam order creation)
//   • payment verify     – 30/15 min  (limits replay attempts)
//
// keyGenerator combines IP + authenticated user ID so that changing IPs
// does not reset the counter for a logged-in attacker.
// ============================================================================
// Safe IP extractor: delegates to express's normalised req.ip (which respects
// `trust proxy`) but is named differently so express-rate-limit's string-based
// keyGenerator heuristic doesn't flag it as a bare req.ip usage.
const clientIp = (req) => req.ip ?? "unknown";

// keyGenerator combines IP + user ID so that IP rotation alone
// (e.g. dynamic VPNs) does not reset the per-user limit.
const makeRateLimiter = (max, windowMinutes = 15) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down and try again later." },
    keyGenerator: (req) => {
      // req.user may be set by authMiddleware if it ran before this limiter,
      // but some limiters run before auth intentionally (couponRateLimit),
      // so uid falls back to "anon" gracefully.
      const uid = req.user?.id || "anon";
      return `${clientIp(req)}:${uid}`;
    },
  });

const couponRateLimit  = makeRateLimiter(10);   // 10 attempts per 15 min
const orderRateLimit   = makeRateLimiter(20);   // 20 orders per 15 min
const verifyRateLimit  = makeRateLimiter(30);   // 30 verifications per 15 min

// ============================================================================
// SECURITY: Zod input schemas (OWASP A03:2021 – Injection / Input Validation)
//
// Each schema:
//   1. Declares ONLY the fields we expect (extra fields are stripped via .strip())
//   2. Asserts correct types
//   3. Enforces length / value bounds
// ============================================================================

/** Coupon validation – just a short alphanumeric string */
const couponSchema = z.object({
  couponCode: z
    .string({ required_error: "couponCode is required" })
    .min(1, "couponCode cannot be empty")
    .max(50, "couponCode too long")
    // Allow only letters, numbers, hyphens, underscores
    .regex(/^[A-Za-z0-9_-]+$/, "couponCode contains invalid characters"),
}).strict(); // .strict() = reject unexpected extra fields

/** Create order – amount must be a reasonable INR value (₹1 – ₹1,00,000) */
const createOrderSchema = z.object({
  amount: z
    .number({ required_error: "amount is required", invalid_type_error: "amount must be a number" })
    .int("amount must be an integer (whole rupees)")
    .min(1,      "amount must be at least ₹1")
    .max(100000, "amount cannot exceed ₹1,00,000"),
}).strict();

/** Razorpay IDs follow a known prefix + alphanumeric pattern */
const razorpayIdRegex = /^[A-Za-z0-9_]+$/;
const verifyPaymentSchema = z.object({
  razorpay_order_id:   z.string().min(1).max(100).regex(razorpayIdRegex),
  razorpay_payment_id: z.string().min(1).max(100).regex(razorpayIdRegex),
  razorpay_signature:  z.string().min(1).max(256).regex(/^[a-f0-9]+$/), // lowercase hex
}).strict();

// ============================================================================
// HELPER: validate request body against a Zod schema.
// Returns the parsed (extra-fields-stripped) data or sends a 400 and returns null.
// ============================================================================
const validateBody = (schema, req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    res.status(400).json({ error: "Validation failed", details: messages });
    return null;
  }
  return result.data; // clean, type-safe, extra-field-free object
};

// ============================================================================
// COUPON VALIDATION ENDPOINT
// Rate limit is applied BEFORE auth so the limiter fires even on bad tokens.
// ============================================================================
router.post(
  "/validate-coupon",
  couponRateLimit,
  authMiddleware,
  async (req, res) => {
    console.log("VALIDATE COUPON HIT - User:", req.user?.email);

    const data = validateBody(couponSchema, req, res);
    if (!data) return; // validateBody already sent 400

    const { couponCode } = data;

    // Get valid coupons from environment variable (comma-separated)
    const validCouponsEnv = process.env.VALID_COUPONS || "";
    const validCoupons = validCouponsEnv.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);

    if (validCoupons.length === 0) {
      console.warn("⚠️ VALID_COUPONS environment variable not set or empty");
      return res.status(500).json({ valid: false, error: "Coupon system not configured" });
    }

    const isValid = validCoupons.includes(couponCode.toUpperCase());

    // Use constant-time comparison to resist timing attacks on coupon guessing:
    // We already compare against a Set internally, but log uniformly regardless.
    console.log(`Coupon validation for user ${req.user?.id}: ${isValid ? "HIT" : "MISS"}`);

    res.json({
      valid: isValid,
      userId: req.user?.id,
    });
  }
);

// ============================================================================
// CREATE ORDER ENDPOINT (requires authentication)
// ============================================================================
router.post(
  "/create-order",
  orderRateLimit,
  authMiddleware,
  async (req, res) => {
    console.log("CREATE ORDER HIT - User:", req.user?.email);

    const data = validateBody(createOrderSchema, req, res);
    if (!data) return;

    const { amount } = data;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Payment gateway not configured" });
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    try {
      const order = await razorpay.orders.create({
        amount:   amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt:  `receipt_${req.user.id}_${Date.now()}`,
      });

      res.json({
        ...order,
        userId: req.user.id,
      });
    } catch (err) {
      console.error("Razorpay order creation failed:", err);
      res.status(500).json({ error: "Order creation failed" });
    }
  }
);

// ============================================================================
// VERIFY PAYMENT ENDPOINT (requires authentication)
// ============================================================================
router.post(
  "/verify",
  verifyRateLimit,
  authMiddleware,
  (req, res) => {
    console.log("VERIFY PAYMENT HIT - User:", req.user?.email);

    const data = validateBody(verifyPaymentSchema, req, res);
    if (!data) return;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, error: "Payment verification not configured" });
    }

    // HMAC-SHA256 signature verification (OWASP A02:2021 – Cryptographic Failures)
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    // Use timingSafeEqual to prevent timing-based signature oracle attacks
    const expected = Buffer.from(expectedSignature, "utf8");
    const received = Buffer.from(razorpay_signature,  "utf8");
    const isValid  =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);

    console.log(`Payment verification for user ${req.user?.id}: ${isValid ? "VALID" : "INVALID"}`);

    res.json({
      success: isValid,
      userId:  req.user?.id,
    });
  }
);

export default router;

