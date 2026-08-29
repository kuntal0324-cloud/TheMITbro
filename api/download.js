import fs from "fs";
import path from "path";
import { getProduct } from "./_lib/catalog.js";
import { verifyDownloadToken } from "./_lib/download-token.js";
export default function handler(req,res){
 if(req.method!=="GET") return res.status(405).json({success:false,message:"Method Not Allowed"});
 try{
  const {paperId,token}=req.query; const product=getProduct(paperId);
  if(!product || !product.privateFile) return res.status(404).json({success:false,message:"Paper not found"});
  if(!verifyDownloadToken(token,paperId)) return res.status(403).json({success:false,message:"Download link is invalid or expired"});
  const filePath=path.join(process.cwd(),"private","paper",product.privateFile);
  if(!fs.existsSync(filePath)) return res.status(404).json({success:false,message:"PDF file not found on server"});
  res.setHeader("Content-Type","application/pdf"); res.setHeader("Content-Disposition",`attachment; filename="${product.privateFile}"`); res.setHeader("Cache-Control","private, no-store");
  const stream=fs.createReadStream(filePath); stream.on("error",()=>res.status(500).end("Unable to download file.")); stream.pipe(res);
 }catch(err){ console.error("download",err); return res.status(500).json({success:false,message:"Unable to download file"}); }
}
