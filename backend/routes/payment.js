import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import createAuthMiddleware from "../middleware/auth.js";

const router = express.Router();

// Create auth middleware instance
const authMiddleware = createAuthMiddleware();

// ============================================================================
// COUPON VALIDATION ENDPOINT (SEC-001 FIX)
// Coupons are now stored server-side in environment variable
// ============================================================================
router.post("/validate-coupon", authMiddleware, async (req, res) => {
  console.log("VALIDATE COUPON HIT - User:", req.user?.email);

  const { couponCode } = req.body;

  if (!couponCode || typeof couponCode !== "string") {
    return res.status(400).json({ valid: false, error: "Coupon code required" });
  }

  // Get valid coupons from environment variable (comma-separated)
  const validCouponsEnv = process.env.VALID_COUPONS || "";
  const validCoupons = validCouponsEnv.split(",").map(c => c.trim().toUpperCase()).filter(Boolean);

  if (validCoupons.length === 0) {
    console.warn("⚠️ VALID_COUPONS environment variable not set or empty");
    return res.status(500).json({ valid: false, error: "Coupon system not configured" });
  }

  const isValid = validCoupons.includes(couponCode.toUpperCase().trim());

  console.log(`Coupon "${couponCode}" validation result: ${isValid}`);

  res.json({
    valid: isValid,
    userId: req.user?.id // Return user ID for audit logging
  });
});

// ============================================================================
// CREATE ORDER ENDPOINT (SEC-002 FIX - Now requires authentication)
// ============================================================================
router.post("/create-order", authMiddleware, async (req, res) => {
  console.log("CREATE ORDER HIT - User:", req.user?.email);

  const { amount } = req.body;

  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(500).json({ error: "Payment gateway not configured" });
  }

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Valid amount required" });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`
    });

    res.json({
      ...order,
      userId: req.user.id // Include user ID for frontend reference
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ============================================================================
// VERIFY PAYMENT ENDPOINT (SEC-002 FIX - Now requires authentication)
// ============================================================================
router.post("/verify", authMiddleware, (req, res) => {
  console.log("VERIFY PAYMENT HIT - User:", req.user?.email);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: "Missing payment details" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ success: false, error: "Payment verification not configured" });
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  console.log(`Payment verification result: ${isValid}`);

  res.json({
    success: isValid,
    userId: req.user?.id
  });
});

export default router;
