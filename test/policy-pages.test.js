import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageNames = ["privacy", "terms", "refund", "contact"];
const pages = Object.fromEntries(pageNames.map(name => [
  name,
  readFileSync(new URL(`../public/${name}.html`, import.meta.url), "utf8"),
]));
const legalRuntime = readFileSync(new URL("../public/legal-runtime.js", import.meta.url), "utf8");

test("policy pages are responsive, dated and connected", () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/, name);
    assert.match(html, /<link rel="stylesheet" href="\/legal\.css">/, name);
    assert.match(html, /Last updated: 21 September 2026/, name);
    assert.match(html, /mailto:themitbro\.support@gmail\.com/, name);
    assert.match(html, /checkout is disabled/i, name);
    assert.match(html, /data-business-details/, name);
    assert.match(html, /<script type="module" src="\/legal-runtime\.js"><\/script>/, name);
  }
});

test("verified business details can replace conservative fallback copy", () => {
  assert.match(legalRuntime, /\/api\/catalog/);
  assert.match(legalRuntime, /data\.commerce\?\.businessDetails/);
  assert.match(legalRuntime, /paymentMode !== "test"/);
  assert.match(legalRuntime, /Controlled TEST mode only/);
  assert.doesNotMatch(legalRuntime, /innerHTML/);
});

test("policy copy does not overstate payment-data handling", () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /we never store (?:your )?(?:card|banking|payment)/i, name);
  }
  assert.match(pages.privacy, /full card numbers, CVVs, UPI PINs/);
  assert.match(pages.privacy, /order and payment identifiers/);
});

test("commercial identity gaps are explicit launch blockers", () => {
  assert.match(pages.contact, /Legal seller or business name/);
  assert.match(pages.contact, /Principal geographic business address/);
  assert.match(pages.contact, /Customer-care telephone number/);
  assert.match(pages.contact, /Grievance officer name, title and contact details/);
  assert.match(pages.contact, /commercial-launch blockers/);
});
