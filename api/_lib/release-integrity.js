import{createHash}from"node:crypto";import{runtimePaymentMode}from"./payment-mode.js";import{readPrivateJson,readPrivateObject}from"./supabase-private.js";
const HASH=/^[0-9a-f]{64}$/,PREFIX="GATE_2027_EE_SET_01";
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==="object"?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const sha256=v=>createHash("sha256").update(v).digest("hex");
export function contentSha256(v,field="release_content_sha256"){const x={...v};delete x[field];return sha256(JSON.stringify(canonical(x)));}
function filename(v){return typeof v==="string"&&!!v.trim()&&!v.includes("/")&&!v.includes("\\")&&v!=="."&&v!=="..";}
export function hasCommercialReleaseFields(p){return!!(p&&p.status==="released"&&filename(p.releaseManifest)&&filename(p.privateFile)&&Number.isInteger(p.priceRupees)&&p.priceRupees>0&&p.storagePrefix===PREFIX);}
function checkAuthorization(r,m,e){
 if(r.authorization_contract!=="GATE_2027_EE_SET01_COMMERCIAL_AUTHORIZATION_V1"||r.authorization_content_sha256!==contentSha256(r,"authorization_content_sha256")||m.commercial_authorization_record?.content_sha256!==r.authorization_content_sha256)e.push("commercial authorization record integrity check failed");
 if(r.product_id!==m.product_id||r.candidate_id!==m.candidate_id||r.status!=="AUTHORIZED_FOR_CONTROLLED_TEST_RELEASE"||r.test_release_authorized!==true||r.live_release_authorized!==false||r.bundle_sales_authorized!==false)e.push("commercial authorization record scope is invalid");
 if(r.attestation_confirmed!==true||typeof r.attestation!=="string"||!r.attestation.trim())e.push("commercial authorization attestation is missing");
 const t=r.commercial_terms||{};if(t.currency!==m.currency||t.price_rupees!==m.price_rupees||t.payment_mode!=="test"||t.learner_pack_sha256!==m.learner_pack?.sha256)e.push("commercial authorization terms mismatch");
 const b=r.basis||{};for(const f of["candidate_content_sha256","release_authorization_content_sha256"])if(b[f]!==m.upstream?.[f])e.push("commercial authorization basis mismatch");if(b.learner_pack_sha256!==m.learner_pack?.sha256)e.push("commercial authorization learner hash mismatch");
 const s=r.seller_identity||{};for(const f of["legal_seller_name","trading_name","principal_geographic_address","customer_care_email","customer_care_phone","grievance_officer_name","grievance_email","grievance_phone","business_tax_identifiers"])if(typeof s[f]!=="string"||!s[f].trim())e.push("authorization seller field blank: "+f);
 const p=r.policy_review||{};if(p.privacy_reviewed!==true||p.terms_reviewed!==true||p.refund_reviewed!==true||p.contact_reviewed!==true||!/^\d{4}-\d{2}-\d{2}$/.test(p.review_date||""))e.push("authorization policy review incomplete");
 const d=r.decision||{},a=m.commercial_authorization||{};for(const f of["sale_authorized","storefront_activated","payment_mode","authorized_by","authorization_date","legal_and_refund_details_reviewed"])if(d[f]!==a[f])e.push("authorization decision mismatch: "+f);for(const f of["authorized_by","role_or_authority","authorization_date","signature"])if(typeof d[f]!=="string"||!d[f].trim())e.push("authorization decision field blank: "+f);
}
export async function validateReleaseIntegrity(product,options={}) {
 const mode=options.paymentMode===undefined?runtimePaymentMode():options.paymentMode,includePdf=options.includeLearnerPack!==false,e=[];
 if(!hasCommercialReleaseFields(product))return{valid:false,errors:["commercial release fields are incomplete"],manifest:null,learnerBytes:null};
 let m;try{m=await readPrivateJson(PREFIX+"/"+product.releaseManifest);}catch{return{valid:false,errors:["private release manifest missing or invalid"],manifest:null,learnerBytes:null};}
 if(!m||typeof m!=="object"||Array.isArray(m))return{valid:false,errors:["private release manifest schema invalid"],manifest:null,learnerBytes:null};
 if(m.release_contract!=="THEMITBRO_COMMERCIAL_RELEASE_V1")e.push("release manifest contract mismatch");
 if(m.product_id!==product.id||m.paper_id!==product.id)e.push("release product binding mismatch");
 if(m.status!=="RELEASED"||m.currency!=="INR"||m.price_rupees!==product.priceRupees)e.push("release status or price mismatch");
 if(m.learner_pack?.file!==product.privateFile||!HASH.test(m.learner_pack?.sha256||""))e.push("learner-pack reference invalid");
 if(m.release_content_sha256!==contentSha256(m))e.push("release manifest self-hash mismatch");
 const pr=m.commercial_preflight||{};let pre=null;
 if(!filename(pr.file)||!HASH.test(pr.content_sha256||""))e.push("preflight reference invalid");else try{pre=await readPrivateJson(PREFIX+"/"+pr.file);}catch{e.push("private preflight missing or invalid");}
 if(pre&& (typeof pre!=="object"||Array.isArray(pre))){e.push("preflight schema invalid");pre=null;}
 let record=null;
 if(pre){
  const ph=contentSha256(pre,"preflight_content_sha256");
  if(pre.preflight_contract!=="GATE_2027_COMMERCIAL_PREFLIGHT_V1"||pre.preflight_content_sha256!==ph||pr.content_sha256!==ph)e.push("preflight integrity check failed");
  if(pre.product_id!==product.id||pre.candidate_id!==m.candidate_id)e.push("preflight product binding mismatch");
  const req={official_blueprint:"PASS",formatter_release_qualification:"PASS_65_OF_65",whole_paper_human_qa:"PASS_65_OF_65",learner_artifact_validation:"PASS",exact_artifact_release_authorization:"PASS"};
  if(pre.status!=="COMMERCIAL_RELEASE_AUTHORIZED"||Object.entries(req).some(([k,v])=>pre.readiness?.[k]!==v))e.push("preflight not release-authorized");
  const d=pre.commercial_decision||{};
  if(d.currency!=="INR"||d.price_rupees!==product.priceRupees||d.sale_authorized!==true||d.storefront_activated!==true||d.payment_mode!=="test"||d.legal_and_refund_details_reviewed!==true||typeof d.authorized_by!=="string"||!d.authorized_by.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(d.authorization_date||""))e.push("preflight decision incomplete or not test-only");
  for(const f of["candidate_content_sha256","release_authorization_content_sha256"])if(!HASH.test(m.upstream?.[f]||"")||m.upstream[f]!==pre.upstream?.[f])e.push("upstream hash mismatch: "+f);
  if(m.learner_pack?.sha256!==pre.upstream?.learner_pack_sha256)e.push("learner hash differs from preflight");
  for(const f of["sale_authorized","storefront_activated","payment_mode","authorized_by","authorization_date","legal_and_refund_details_reviewed"])if(m.commercial_authorization?.[f]!==d[f])e.push("manifest authorization mismatch: "+f);
  const ar=m.commercial_authorization_record||{};
  if(!filename(ar.file)||!HASH.test(ar.content_sha256||""))e.push("authorization record reference invalid");else try{
   record=await readPrivateJson(PREFIX+"/"+ar.file);
   if(!record||typeof record!=="object"||Array.isArray(record)){e.push("authorization record schema invalid");record=null;}
   else{
    checkAuthorization(record,m,e);
    const pdf=record.source_completed_pdf||{};
    if(!filename(pdf.filename)||!HASH.test(pdf.sha256||""))e.push("completed commercial authorization PDF reference invalid");
    else try{const bytes=await readPrivateObject("release-authorization-private",PREFIX+"/"+pdf.filename);if(sha256(bytes)!==pdf.sha256)e.push("completed commercial authorization PDF checksum mismatch");}catch{e.push("completed commercial authorization PDF missing or unreadable");}
   }
  }catch{e.push("private authorization record missing or invalid");}
 }
 const a=m.commercial_authorization||{};
 if(a.sale_authorized!==true||a.storefront_activated!==true||a.payment_mode!=="test"||a.legal_and_refund_details_reviewed!==true||typeof a.authorized_by!=="string"||!a.authorized_by.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(a.authorization_date||""))e.push("commercial authorization incomplete or not test-only");
 if(mode!=="test"||mode!==a.payment_mode)e.push("runtime payment mode does not match test-only authorization");
 let learnerBytes=null;
 if(includePdf&&HASH.test(m.learner_pack?.sha256||""))try{learnerBytes=await readPrivateObject("gate-papers-private",PREFIX+"/"+product.privateFile);if(sha256(learnerBytes)!==m.learner_pack.sha256){e.push("released learner-pack checksum mismatch");learnerBytes=null;}}catch{e.push("private learner pack missing or unreadable");}
 return{valid:e.length===0,errors:e,manifest:m,authorizationRecord:record,learnerBytes};
}
