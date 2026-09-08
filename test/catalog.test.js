import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACTIVE_PROGRAM, PRODUCTS, getProduct, isPurchasable, publicCatalog } from "../api/_lib/catalog.js";

const upstreamCheckpoint = JSON.parse(readFileSync(
  new URL("../private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json", import.meta.url),
  "utf8",
));

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

test("catalog remains blocked at the current upstream production checkpoint", () => {
  assert.equal(upstreamCheckpoint.release_authorized, false);
  assert.equal(upstreamCheckpoint.program_totals.unique_candidates, 40);
  assert.equal(upstreamCheckpoint.program_totals.formatter_passed, 40);
  assert.equal(upstreamCheckpoint.program_totals.paper_eligible, 20);
  assert.equal(upstreamCheckpoint.program_totals.complete_65_question_sets, 0);
  assert.equal(upstreamCheckpoint.program_totals.released_sets, 0);
  assert.ok(Object.values(PRODUCTS).every(product => (
    product.status === upstreamCheckpoint.catalog_required_status &&
    !isPurchasable(product)
  )));
});
