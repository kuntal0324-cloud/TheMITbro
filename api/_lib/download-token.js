import crypto from "crypto";
function secret() {
  const value = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error("DOWNLOAD_TOKEN_SECRET must be at least 32 characters");
  return value;
}
function b64url(value) { return Buffer.from(value).toString("base64url"); }
export function createDownloadToken({paperId,paymentId,ttlSeconds=600}) {
  const payload = { paperId, paymentId, exp: Math.floor(Date.now()/1000)+ttlSeconds };
  const encoded = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256",secret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}
export function verifyDownloadToken(token,paperId) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [encoded,sig] = token.split(".");
  const expected = crypto.createHmac("sha256",secret()).update(encoded).digest("base64url");
  const a=Buffer.from(sig||""), b=Buffer.from(expected);
  if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) return null;
  let payload; try { payload=JSON.parse(Buffer.from(encoded,"base64url").toString("utf8")); } catch { return null; }
  if (payload.paperId!==paperId || !payload.paymentId || !payload.exp || payload.exp < Math.floor(Date.now()/1000)) return null;
  return payload;
}
