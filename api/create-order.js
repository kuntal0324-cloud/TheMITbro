import Razorpay from "razorpay";
import { getProduct, isPurchasable } from "./_lib/catalog.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
  console.error("Missing Razorpay environment variables", {
    hasKeyId: Boolean(keyId),
    hasKeySecret: Boolean(keySecret)
  });

  return res.status(500).json({
    success: false,
    message: "Payment service configuration is unavailable.",
    hasKeyId: Boolean(keyId),
    hasKeySecret: Boolean(keySecret)
  });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const { paperId } = req.body || {};
    const product = getProduct(paperId);

    if (
      !isPurchasable(product)
    ) {
      return res.status(400).json({
        success: false,
        message: "Paper is not available for purchase."
      });
    }

    const order = await razorpay.orders.create({
      amount: product.priceRupees * 100,
      currency: "INR",
      receipt: `receipt_${paperId}_${Date.now()}`,
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
      title: product.title
    });

  } catch (err) {
    console.error("create-order error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order."
    });
  }
}
