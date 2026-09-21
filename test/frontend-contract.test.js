import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("storefront exposes all elements required by the catalog controller", () => {
  for (const id of [
    "offers",
    "products",
    "program-summary",
    "more",
    "published-count",
    "commerce-status",
    "commerce-reason",
    "payment-status",
    "development-modal",
    "modal-close",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }
  assert.doesNotMatch(html, /checkout\.razorpay\.com\/v1\/checkout\.js/);
  assert.match(html, /<script type="module" src="\/app\.js"><\/script>/);
  assert.match(html, /Planning information only—not an offer for sale/);
  assert.match(html, /No preorder or payment for unfinished papers is accepted/);
});

test("browser controller uses only public API routes", () => {
  assert.match(app, /checkout\.razorpay\.com\/v1\/checkout\.js/);
  assert.match(app, /function loadRazorpayCheckout\(\)/);
  assert.match(app, /\/api\/catalog/);
  assert.match(app, /\/api\/create-order/);
  assert.match(app, /\/api\/verify-payment/);
  assert.doesNotMatch(app, /private\/releases|releaseManifest|privateFile/);
});
