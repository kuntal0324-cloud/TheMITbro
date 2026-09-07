import crypto from "crypto";
import Razorpay from "razorpay";
import { getProduct, isPurchasable } from "./_lib/catalog.js";
import { createDownloadToken } from "./_lib/download-token.js";
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({success:false,message:"Method Not Allowed"});
 try{
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature,paperId}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!paperId) return res.status(400).json({success:false,message:"Missing payment details"});
  const product=getProduct(paperId);
  if(!isPurchasable(product)) return res.status(400).json({success:false,message:"Invalid or unreleased paper"});
  const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const a=Buffer.from(razorpay_signature), b=Buffer.from(expected);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(400).json({success:false,message:"Payment verification failed"});
  const [order,payment]=await Promise.all([razorpay.orders.fetch(razorpay_order_id),razorpay.payments.fetch(razorpay_payment_id)]);
  const amount=product.priceRupees*100;
  if(order.amount!==amount || order.currency!=="INR" || order.notes?.paperId!==paperId || payment.order_id!==razorpay_order_id || payment.amount!==amount || payment.currency!=="INR" || payment.status!=="captured") {
    return res.status(409).json({success:false,message:"Payment is not fully captured for this paper."});
  }
  const token=createDownloadToken({paperId,paymentId:razorpay_payment_id,ttlSeconds:600});
  return res.status(200).json({success:true,message:"Payment verified successfully",downloadUrl:`/api/download?paperId=${encodeURIComponent(paperId)}&token=${encodeURIComponent(token)}`});
 }catch(err){ console.error("verify-payment",err); return res.status(500).json({success:false,message:"Unable to verify payment"}); }
}
