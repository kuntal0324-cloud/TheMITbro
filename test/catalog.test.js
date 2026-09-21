import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  ACTIVE_PROGRAM,
  ACTIVE_PROGRAMS,
  PRODUCTS,
  RELEASE_REGISTRY,
  getProduct,
  isPurchasable,
  publicCatalog,
} from "../api/_lib/catalog.js";
import { hasCommercialReleaseFields } from "../api/_lib/release-integrity.js";

const upstreamCheckpoint = JSON.parse(readFileSync(
  new URL("../private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json", import.meta.url),
  "utf8",
));
const candidateBase = new URL("../private/release_candidates/GATE_2027_EE_SET_01_RC1/", import.meta.url);
const releaseCandidate = JSON.parse(readFileSync(new URL("GATE_EE_SET_01_RC1.json", candidateBase), "utf8"));
const releaseAuthorization = JSON.parse(readFileSync(
  new URL("GATE_EE_SET_01_RC1_RELEASE_AUTHORIZATION_COMPLETED.json", candidateBase),
  "utf8",
));
const sha256 = value => createHash("sha256").update(value).digest("hex");

test("GATE 2027 EE is the only active 50-set program", () => {
  assert.equal(ACTIVE_PROGRAM.paperCode, "EE");
  assert.equal(ACTIVE_PROGRAM.examYear, 2027);
  assert.equal(ACTIVE_PROGRAMS.length, 1);
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

test("release predicate requires every commercial field and verified artifact", () => {
  const draft = getProduct("GATE_2027_EE_SET_01");
  assert.equal(isPurchasable({ ...draft, status: "released" }), false);
  const superficiallyReleased = {
    ...draft,
    status: "released",
    releaseManifest: "GATE_2027_EE_SET_01.release.json",
    privateFile: "GATE_2027_EE_SET_01.pdf",
    priceRupees: 500,
  };
  assert.equal(hasCommercialReleaseFields(superficiallyReleased), true);
  assert.equal(isPurchasable(superficiallyReleased), false);
  assert.deepEqual(RELEASE_REGISTRY.products, {});
});

test("release authorization is recorded while every commercial gate remains blocked", () => {
  assert.equal(upstreamCheckpoint.checkpoint_contract, "GATE_2027_EE_UPSTREAM_CHECKPOINT_V4");
  assert.equal(upstreamCheckpoint.release_authorized, true);
  assert.equal(upstreamCheckpoint.program_totals.unique_candidates, 87);
  assert.equal(upstreamCheckpoint.program_totals.formatter_passed, 87);
  assert.equal(upstreamCheckpoint.program_totals.human_final_qa_passed, 87);
  assert.equal(upstreamCheckpoint.program_totals.paper_eligible, 87);
  assert.equal(upstreamCheckpoint.program_totals.corpus_admitted, 87);
  assert.equal(upstreamCheckpoint.program_totals.complete_65_question_sets, 1);
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
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.complete_paper_human_qa, "PASSED_65_OF_65");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.reviewer_metadata_reconfirmation, "RESOLVED");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.formatter_release_qualification, "PASSED_65_OF_65");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.release_candidate, "RC1_VALIDATED_AND_STAGED_PRIVATE");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.exact_artifact_release_authorization, "PASSED");
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.release_authorized, true);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.price_set, false);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.storefront_activated, false);
  assert.equal(upstreamCheckpoint.set_01_review_checkpoint.sale_authorized, false);
  assert.ok(Object.values(PRODUCTS).every(product => (
    product.status === upstreamCheckpoint.catalog_required_status &&
    !isPurchasable(product)
  )));
});

test("upstream checkpoint is bound to all five batch chains and Set 01 review artifacts", () => {
  const sha256Pattern = /^[0-9a-f]{64}$/;
  const provenance = upstreamCheckpoint.upstream_provenance;
  const batch1 = upstreamCheckpoint.question_bank.batch_001;
  const batch2 = upstreamCheckpoint.question_bank.batch_002;
  const batch3 = upstreamCheckpoint.question_bank.batch_003;
  const batch4 = upstreamCheckpoint.question_bank.batch_004;
  const batch5 = upstreamCheckpoint.question_bank.batch_005;
  const set01 = upstreamCheckpoint.set_01_review_checkpoint;

  assert.equal(upstreamCheckpoint.as_of, "2026-09-21");
  assert.equal(
    provenance.question_bank_current_snapshot_sha256,
    "fd1dca934d33f5797c3173f082ee2b8a837f7a921d90f229f9ac49520a44622f",
  );
  assert.equal(
    provenance.question_bank_supplied_snapshot_sha256,
    "04b9a826a43e75f91aadb6efa1b2e179b1f29cf4a6430a97f36e0be5f2e1eea3",
  );
  assert.equal(provenance.question_bank_batch_004_005_human_qa_merge_pr, 10);
  assert.equal(provenance.question_bank_batch_004_005_human_qa_merge_commit_short, "d107a8c");
  assert.equal(provenance.question_bank_paper_eligibility_merge_pr, 11);
  assert.equal(provenance.question_bank_paper_eligibility_source_head_short, "85e4d71");
  assert.equal(provenance.question_bank_set01_human_qa_merge_pr, 13);
  assert.equal(provenance.question_bank_set01_release_authorization_merge_pr, 15);
  assert.equal(provenance.question_bank_set01_release_authorization_merge_commit_short, "55c00e2");
  assert.equal(provenance.formatter_main_merge_commit_short, "6f0f277");
  assert.equal(provenance.formatter_batch_004_005_merge_pr, 6);
  for (const field of [
    "question_bank_set01_review_package_sha256",
    "formatter_state_sync_package_sha256",
    "eight_day_progress_sha256",
    "family_registry_sha256",
    "question_bank_rc1_candidate_source_snapshot_sha256",
    "formatter_current_snapshot_sha256",
    "release_authorization_json_file_sha256",
    "release_authorization_content_sha256",
    "release_authorization_completed_pdf_sha256",
  ]) assert.match(provenance[field], sha256Pattern, `${field} must be a SHA-256 digest`);

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
      assert.match(batch[field], sha256Pattern, `${field} must be a SHA-256 digest`);
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
    "completed_human_qa_json_sha256",
    "completed_human_qa_content_sha256",
    "completed_human_qa_pdf_sha256",
    "formatter_release_evidence_file_sha256",
    "formatter_release_evidence_content_sha256",
    "release_candidate_manifest_file_sha256",
    "release_candidate_content_sha256",
    "release_question_pdf_sha256",
    "release_solution_pdf_sha256",
    "release_learner_pack_pdf_sha256",
    "release_authorization_template_pdf_sha256",
    "release_authorization_json_file_sha256",
    "release_authorization_content_sha256",
    "release_authorization_completed_pdf_sha256",
  ]) assert.match(set01[field], sha256Pattern, `${field} must be a SHA-256 digest`);

  const batches = [batch1, batch2, batch3, batch4, batch5];
  assert.equal(batches.reduce((total, batch) => total + batch.questions, 0), upstreamCheckpoint.program_totals.unique_candidates);
  assert.equal(batches.reduce((total, batch) => total + batch.formatter_passed, 0), upstreamCheckpoint.program_totals.formatter_passed);
  assert.equal(batches.reduce((total, batch) => total + batch.paper_eligible, 0), upstreamCheckpoint.program_totals.paper_eligible);
  assert.equal(batches.reduce((total, batch) => total + batch.corpus_admitted, 0), upstreamCheckpoint.program_totals.corpus_admitted);
});

test("frozen RC1 artifacts are separately authorized but remain non-purchasable", () => {
  const set01 = upstreamCheckpoint.set_01_review_checkpoint;
  assert.equal(releaseCandidate.candidate_id, "GATE_2027_EE_SET_01_RC1");
  assert.equal(releaseCandidate.status, "RELEASE_CANDIDATE_AWAITING_EXACT_ARTIFACT_AUTHORIZATION");
  assert.equal(releaseCandidate.candidate_content_sha256, set01.release_candidate_content_sha256);
  assert.equal(releaseAuthorization.candidate_id, releaseCandidate.candidate_id);
  assert.equal(releaseAuthorization.candidate_content_sha256, releaseCandidate.candidate_content_sha256);
  assert.equal(releaseAuthorization.status, "EXACT_ARTIFACT_RELEASE_AUTHORIZED");
  assert.equal(releaseAuthorization.release_authorized, true);
  assert.equal(releaseAuthorization.price_set, false);
  assert.equal(releaseAuthorization.storefront_activated, false);
  assert.equal(releaseAuthorization.sale_authorized, false);
  assert.equal(
    sha256(readFileSync(new URL("GATE_EE_SET_01_RC1.json", candidateBase))),
    set01.release_candidate_manifest_file_sha256,
  );
  assert.equal(
    sha256(readFileSync(new URL("GATE_EE_SET_01_RC1_RELEASE_AUTHORIZATION_COMPLETED.json", candidateBase))),
    set01.release_authorization_json_file_sha256,
  );
  assert.equal(releaseAuthorization.authorization_content_sha256, set01.release_authorization_content_sha256);
  assert.equal(releaseAuthorization.completed_pdf.sha256, set01.release_authorization_completed_pdf_sha256);
  for (const [label, filename, checkpointField] of [
    ["question_pdf", "GATE_EE_SET_01_QUESTION_PAPER_RC1.pdf", "release_question_pdf_sha256"],
    ["solution_pdf", "GATE_EE_SET_01_SOLUTIONS_RC1.pdf", "release_solution_pdf_sha256"],
    ["learner_pack_pdf", "GATE_EE_SET_01_LEARNER_PACK_RC1.pdf", "release_learner_pack_pdf_sha256"],
  ]) {
    const digest = sha256(readFileSync(new URL(filename, candidateBase)));
    assert.equal(digest, releaseCandidate.artifacts[label].sha256);
    assert.equal(digest, releaseAuthorization.authorized_artifacts[label].sha256);
    assert.equal(digest, set01[checkpointField]);
  }
  const product = getProduct("GATE_2027_EE_SET_01");
  assert.equal(product.status, "under_review");
  assert.equal(product.releaseManifest, null);
  assert.equal(product.privateFile, null);
  assert.equal(product.priceRupees, null);
  assert.equal(isPurchasable(product), false);
});
