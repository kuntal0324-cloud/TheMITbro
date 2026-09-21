import crypto from "crypto";
import { getProduct, isPurchasable } from "./_lib/catalog.js";
import { createDownloadToken } from "./_lib/download-token.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","private, no-store");
 if(req.method!=="POST") return res.status(405).json({success:false,message:"Method Not Allowed"});
 try{
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature,paperId}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!paperId) return res.status(400).json({success:false,message:"Missing payment details"});
  const product=getProduct(paperId);
  if(!isPurchasable(product)) return res.status(400).json({success:false,message:"Invalid or unreleased paper"});
  const keyId=process.env.RAZORPAY_KEY_ID, keySecret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!keySecret){
   console.error("Missing Razorpay environment variables");
   return res.status(500).json({success:false,message:"Payment service configuration is unavailable."});
  }
  if(!/^[0-9a-f]{64}$/i.test(razorpay_signature)) return res.status(400).json({success:false,message:"Payment verification failed"});
  const expected=crypto.createHmac("sha256",keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const a=Buffer.from(razorpay_signature,"hex"), b=Buffer.from(expected,"hex");
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(400).json({success:false,message:"Payment verification failed"});
  const {default:Razorpay}=await import("razorpay");
  const razorpay=new Razorpay({key_id:keyId,key_secret:keySecret});
  const [order,payment]=await Promise.all([razorpay.orders.fetch(razorpay_order_id),razorpay.payments.fetch(razorpay_payment_id)]);
  const amount=product.priceRupees*100;
  if(Number(order.amount)!==amount || order.currency!=="INR" || order.status!=="paid" || order.notes?.paperId!==paperId || payment.order_id!==razorpay_order_id || Number(payment.amount)!==amount || payment.currency!=="INR" || payment.status!=="captured") {
    return res.status(409).json({success:false,message:"Payment is not fully captured for this paper."});
  }
  const token=createDownloadToken({paperId,paymentId:razorpay_payment_id,ttlSeconds:600});
  return res.status(200).json({success:true,message:"Payment verified successfully",downloadUrl:`/api/download?paperId=${encodeURIComponent(paperId)}&token=${encodeURIComponent(token)}`});
 }catch(err){ console.error("verify-payment",err); return res.status(500).json({success:false,message:"Unable to verify payment"}); }
}
