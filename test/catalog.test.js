import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_PROGRAM, PRODUCTS, getProduct, isPurchasable, publicCatalog } from "../api/_lib/catalog.js";

test("GATE 2027 EE is the only active 50-set program", () => {
  assert.equal(ACTIVE_PROGRAM.paperCode, "EE");
  assert.equal(ACTIVE_PROGRAM.examYear, 2027);
  assert.equal(Object.keys(PRODUCTS).length, 50);
  assert.ok(Object.values(PRODUCTS).every(p => p.examFamily === "GATE" && p.paperCode === "EE"));
});

test("nothing can be purchased before a manifest-backed release", () => {
  assert.ok(Object.values(PRODUCTS).every(product => !isPurchasable(product)));
  assert.ok(Object.values(PRODUCTS).every(product => product.status === "under_review"));
});

test("public catalog never exposes private paths or manifests", () => {
  for (const product of publicCatalog()) {
    assert.equal("privateFile" in product, false);
    assert.equal("releaseManifest" in product, false);
    assert.equal(product.purchasable, false);
  }
});

test("release predicate requires every commercial gate", () => {
  const draft = getProduct("GATE_2027_EE_SET_01");
  assert.equal(isPurchasable({ ...draft, status: "released" }), false);
  assert.equal(isPurchasable({
    ...draft,
    status: "released",
    releaseManifest: "GATE_2027_EE_SET_01.release.json",
    privateFile: "GATE_2027_EE_SET_01.pdf",
    priceRupees: 500,
  }), true);
});
