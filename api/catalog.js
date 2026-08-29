import { publicCatalog } from "./_lib/catalog.js";
export default function handler(req,res){
 if(req.method!=="GET") return res.status(405).json({success:false,message:"Method Not Allowed"});
 res.setHeader("Cache-Control","public, max-age=60, s-maxage=300");
 return res.status(200).json({success:true,products:publicCatalog()});
}
