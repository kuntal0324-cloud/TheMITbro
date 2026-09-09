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
  assert.equal(upstreamCheckpoint.program_totals.human_final_qa_passed, 40);
  assert.equal(upstreamCheckpoint.program_totals.paper_eligible, 40);
  assert.equal(upstreamCheckpoint.program_totals.corpus_admitted, 40);
  assert.equal(upstreamCheckpoint.program_totals.complete_65_question_sets, 0);
  assert.equal(upstreamCheckpoint.program_totals.released_sets, 0);
  assert.equal(upstreamCheckpoint.question_bank.batch_002.source_revision, 2);
  assert.equal(upstreamCheckpoint.question_bank.batch_002.math_render_contract, "XELATEX_LATIN_MODERN_MATH");
  assert.equal(upstreamCheckpoint.question_bank.batch_002.human_final_qa, "PASSED");
  assert.equal(upstreamCheckpoint.question_bank.batch_002.paper_eligible, 20);
  assert.equal(upstreamCheckpoint.question_bank.batch_002.corpus_admitted, 20);
  assert.ok(Object.values(PRODUCTS).every(product => (
    product.status === upstreamCheckpoint.catalog_required_status &&
    !isPurchasable(product)
  )));
});

test("upstream checkpoint is bound to the merged Batch 002 evidence chain", () => {
  const sha256 = /^[0-9a-f]{64}$/;
  const provenance = upstreamCheckpoint.upstream_provenance;
  const batch1 = upstreamCheckpoint.question_bank.batch_001;
  const batch2 = upstreamCheckpoint.question_bank.batch_002;

  assert.equal(upstreamCheckpoint.as_of, "2026-09-09");
  assert.equal(provenance.question_bank_main_merge_commit_short, "4609bee");
  assert.equal(provenance.question_bank_merge_pr, 7);
  assert.match(provenance.eight_day_progress_sha256, sha256);
  assert.match(provenance.family_registry_sha256, sha256);

  for (const field of [
    "source_sha256",
    "formatter_evidence_sha256",
    "independent_ai_qa_sha256",
    "human_signoff_sha256",
    "completed_review_pdf_sha256",
    "paper_eligibility_certificate_sha256",
    "corpus_admission_manifest_sha256",
  ]) {
    assert.match(batch2[field], sha256, `${field} must be a SHA-256 digest`);
  }

  assert.equal(batch1.questions + batch2.questions, upstreamCheckpoint.program_totals.unique_candidates);
  assert.equal(batch1.formatter_passed + batch2.formatter_passed, upstreamCheckpoint.program_totals.formatter_passed);
  assert.equal(batch1.paper_eligible + batch2.paper_eligible, upstreamCheckpoint.program_totals.paper_eligible);
  assert.equal(batch1.corpus_admitted + batch2.corpus_admitted, upstreamCheckpoint.program_totals.corpus_admitted);
});
