import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

router.post("/create-order", async (req, res) => {
  console.log("CREATE ORDER HIT");

  const { amount } = req.body;

  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(500).json({ error: "ENV NOT LOADED" });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
});

router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  res.json({ success: expected === razorpay_signature });
});

export default router;
