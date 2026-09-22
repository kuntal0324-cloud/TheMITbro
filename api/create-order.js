import { randomBytes } from "node:crypto";
import { getProduct, isPurchasable } from "./_lib/catalog.js";
import { assertPaymentEnvironment } from "./_lib/payment-mode.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  try {
    const { paperId } = req.body || {};
    const product = getProduct(paperId);

    if (!isPurchasable(product)) {
      return res.status(400).json({
        success: false,
        message: "Paper is not available for purchase."
      });
    }

    const paymentEnvironment = assertPaymentEnvironment();
    if (!paymentEnvironment.valid) {
      console.error(paymentEnvironment.error);
      return res.status(500).json({
        success: false,
        message: "Payment service configuration is unavailable."
      });
    }
    const { keyId, keySecret, paymentMode } = paymentEnvironment;

    const { default: Razorpay } = await import("razorpay");
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
      amount: product.priceRupees * 100,
      currency: "INR",
      receipt: `tmb_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`,
      notes: {
        paperId
      }
    });

    return res.status(200).json({
      success: true,
      key: keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paperId,
      title: product.title,
      paymentMode,
      testOnly: paymentMode === "test"
    });

  } catch (err) {
    console.error("create-order error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order."
    });
  }
}
