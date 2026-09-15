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
  assert.equal(upstreamCheckpoint.checkpoint_contract, "GATE_2027_EE_UPSTREAM_CHECKPOINT_V2");
  assert.equal(upstreamCheckpoint.release_authorized, false);
  assert.equal(upstreamCheckpoint.program_totals.unique_candidates, 87);
  assert.equal(upstreamCheckpoint.program_totals.formatter_passed, 87);
  assert.equal(upstreamCheckpoint.program_totals.human_final_qa_passed, 87);
  assert.equal(upstreamCheckpoint.program_totals.paper_eligible, 87);
  assert.equal(upstreamCheckpoint.program_totals.corpus_admitted, 87);
  assert.equal(upstreamCheckpoint.program_totals.complete_65_question_sets, 0);
  assert.equal(upstreamCheckpoint.program_totals.released_sets, 0);
  assert.equal(upstreamCheckpoint.question_bank.batch_002.source_revision, 2);
  assert.equal(upstreamCheckpoint.question_bank.batch_002.math_render_contract, "XELATEX_LATIN_MODERN_MATH");
  assert.equal(upstreamCheckpoint.question_bank.batch_002.human_final_qa, "PASSED");
  assert.equal(upstreamCheckpoint.question_bank.batch_002.paper_eligible, 20);
  assert.equal(upstreamCheckpoint.question_bank.batch_002.corpus_admitted, 20);
  assert.equal(upstreamCheckpoint.question_bank.batch_003.human_final_qa, "PASSED");
  assert.equal(upstreamCheckpoint.question_bank.batch_003.paper_eligible, 20);
  assert.equal(upstreamCheckpoint.question_bank.batch_003.corpus_admitted, 20);
  assert.equal(upstreamCheckpoint.question_bank.batch_004.human_final_qa, "PASSED");
  assert.equal(upstreamCheckpoint.question_bank.batch_004.paper_eligible, 15);
  assert.equal(upstreamCheckpoint.question_bank.batch_004.corpus_admitted, 15);
  assert.equal(upstreamCheckpoint.question_bank.batch_005.human_final_qa, "PASSED");
  assert.equal(upstreamCheckpoint.question_bank.batch_005.paper_eligible, 12);
  assert.equal(upstreamCheckpoint.question_bank.batch_005.corpus_admitted, 12);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.questions, 65);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.marks, 100);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.duration_minutes, 180);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.complete_paper_human_qa, "PENDING");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.reviewer_metadata_reconfirmation, "REQUIRED");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.release_authorized, false);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.sale_authorized, false);
  assert.ok(Object.values(PRODUCTS).every(product => (
    product.status === upstreamCheckpoint.catalog_required_status &&
    !isPurchasable(product)
  )));
});

test("upstream checkpoint is bound to all five batch chains and Set 01 review artifacts", () => {
  const sha256 = /^[0-9a-f]{64}$/;
  const provenance = upstreamCheckpoint.upstream_provenance;
  const batch1 = upstreamCheckpoint.question_bank.batch_001;
  const batch2 = upstreamCheckpoint.question_bank.batch_002;
  const batch3 = upstreamCheckpoint.question_bank.batch_003;
  const batch4 = upstreamCheckpoint.question_bank.batch_004;
  const batch5 = upstreamCheckpoint.question_bank.batch_005;
  const set01 = upstreamCheckpoint.set_01_review_checkpoint;

  assert.equal(upstreamCheckpoint.as_of, "2026-09-14");
  assert.equal(provenance.question_bank_batch_004_005_human_qa_merge_pr, 10);
  assert.equal(provenance.question_bank_batch_004_005_human_qa_merge_commit_short, "d107a8c");
  assert.equal(provenance.question_bank_paper_eligibility_merge_pr, 11);
  assert.equal(provenance.question_bank_paper_eligibility_source_head_short, "85e4d71");
  assert.equal(provenance.formatter_main_merge_commit_short, "6f0f277");
  assert.equal(provenance.formatter_batch_004_005_merge_pr, 6);
  for (const field of [
    "question_bank_set01_review_package_sha256",
    "formatter_state_sync_package_sha256",
    "eight_day_progress_sha256",
    "family_registry_sha256",
  ]) assert.match(provenance[field], sha256, `${field} must be a SHA-256 digest`);

  for (const field of [
    "source_sha256",
    "formatter_evidence_sha256",
    "independent_ai_qa_sha256",
    "human_signoff_sha256",
    "completed_review_pdf_sha256",
    "paper_eligibility_certificate_sha256",
    "corpus_admission_manifest_sha256",
  ]) {
    for (const batch of [batch2, batch3, batch4, batch5]) {
      assert.match(batch[field], sha256, `${field} must be a SHA-256 digest`);
    }
  }

  for (const field of [
    "manifest_file_sha256",
    "manifest_content_sha256",
    "formatter_handoff_file_sha256",
    "formatter_handoff_content_sha256",
    "render_evidence_sha256",
    "question_pdf_sha256",
    "solution_pdf_sha256",
    "human_qa_template_pdf_sha256",
  ]) assert.match(set01[field], sha256, `${field} must be a SHA-256 digest`);

  const batches = [batch1, batch2, batch3, batch4, batch5];
  assert.equal(batches.reduce((total, batch) => total + batch.questions, 0), upstreamCheckpoint.program_totals.unique_candidates);
  assert.equal(batches.reduce((total, batch) => total + batch.formatter_passed, 0), upstreamCheckpoint.program_totals.formatter_passed);
  assert.equal(batches.reduce((total, batch) => total + batch.paper_eligible, 0), upstreamCheckpoint.program_totals.paper_eligible);
  assert.equal(batches.reduce((total, batch) => total + batch.corpus_admitted, 0), upstreamCheckpoint.program_totals.corpus_admitted);
});
