import express from "express";
import crypto from "crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import createAuthMiddleware from "../middleware/auth.js";

const router = express.Router();

// Create auth middleware instance
const authMiddleware = createAuthMiddleware();

// ============================================================================
// SECURITY: Per-route rate limiters (OWASP A04:2021 – Rate Limiting)
// ============================================================================
const clientIp = (req) => req.ip ?? "unknown";

const makeRateLimiter = (max, windowMinutes = 15) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down and try again later." },
    keyGenerator: (req) => {
      const uid = req.user?.id || "anon";
      return `${clientIp(req)}:${uid}`;
    },
  });

const couponRateLimit  = makeRateLimiter(10);   // 10 attempts per 15 min
const orderRateLimit   = makeRateLimiter(20);   // 20 orders per 15 min
const verifyRateLimit  = makeRateLimiter(30);   // 30 verifications per 15 min

// ============================================================================
// SECURITY: Zod input schemas (OWASP A03:2021 – Injection / Input Validation)
// ============================================================================

/** Coupon validation – just a short alphanumeric string */
const couponSchema = z.object({
  couponCode: z
    .string({ required_error: "couponCode is required" })
    .min(1, "couponCode cannot be empty")
    .max(50, "couponCode too long")
    .regex(/^[A-Za-z0-9_-]+$/, "couponCode contains invalid characters"),
}).strict();

/** Create order – amount must be a reasonable INR value (₹1 – ₹1,00,000) */
const createOrderSchema = z.object({
  amount: z
    .number({ required_error: "amount is required", invalid_type_error: "amount must be a number" })
    .int("amount must be an integer (whole rupees)")
    .min(1,      "amount must be at least ₹1")
    .max(100000, "amount cannot exceed ₹1,00,000"),
}).strict();

/** Cashfree IDs follow an alphanumeric pattern */
const cashfreeIdRegex = /^[A-Za-z0-9_-]+$/;
const verifyPaymentSchema = z.object({
  order_id: z.string().min(1).max(100).regex(cashfreeIdRegex),
}).strict();

const validateBody = (schema, req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    res.status(400).json({ error: "Validation failed", details: messages });
    return null;
  }
  return result.data;
};

// ============================================================================
// COUPON VALIDATION ENDPOINT
// ============================================================================
router.post(
  "/validate-coupon",
  couponRateLimit,
  authMiddleware,
  async (req, res) => {
    console.log("VALIDATE COUPON HIT - User:", req.user?.email);
    const data = validateBody(couponSchema, req, res);
    if (!data) return;
    const { couponCode } = data;
    const validCouponsEnv = process.env.VALID_COUPONS || "";
    const validCoupons = validCouponsEnv.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    if (validCoupons.length === 0) {
      console.warn("⚠️ VALID_COUPONS environment variable not set or empty");
      return res.status(500).json({ valid: false, error: "Coupon system not configured" });
    }
    const isValid = validCoupons.includes(couponCode.toUpperCase());
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

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(500).json({ error: "Payment gateway not configured" });
    }

    try {
      const orderData = {
        order_amount: amount,
        order_currency: "INR",
        order_id: `ord_${Date.now()}_${req.user.id.split('-')[0]}`,
        customer_details: {
          customer_id: req.user.id,
          customer_email: req.user.email || "customer@example.com",
          customer_phone: "+919876543210"
        }
      };

      if (process.env.ALLOWED_ORIGIN && process.env.ALLOWED_ORIGIN.startsWith('https')) {
        orderData.order_meta = {
          return_url: `${process.env.ALLOWED_ORIGIN}/payment?order_id={order_id}`
        };
      }

      const response = await fetch(`${process.env.CASHFREE_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": process.env.CASHFREE_VERSION || "2023-08-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Cashfree order creation error:", JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || "Failed to create order");
      }

      const order = await response.json();

      res.json({
        ...order,
        userId: req.user.id,
      });
    } catch (err) {
      console.error("Cashfree order creation failed:", err);
      res.status(500).json({ error: err.message || "Order creation failed" });
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
  async (req, res) => {
    console.log("VERIFY PAYMENT HIT - User:", req.user?.email);
    const data = validateBody(verifyPaymentSchema, req, res);
    if (!data) return;
    const { order_id } = data;

    try {
      const response = await fetch(`${process.env.CASHFREE_BASE_URL}/orders/${order_id}`, {
        method: "GET",
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": process.env.CASHFREE_VERSION || "2023-08-01",
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to verify order with Cashfree");
      }

      const order = await response.json();
      const isValid = order.order_status === "PAID";
      console.log(`Payment verification for user ${req.user?.id}: ${isValid ? "VALID" : "INVALID"}`);
      res.json({
        success: isValid,
        order_status: order.order_status,
        userId: req.user?.id,
      });
    } catch (err) {
      console.error("Cashfree verification failed:", err);
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  }
);

export default router;
