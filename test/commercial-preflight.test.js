import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { contentSha256 } from "../api/_lib/release-integrity.js";

const preflight = JSON.parse(readFileSync(
  new URL("../private/production_state/GATE_2027_EE_SET_01_COMMERCIAL_PREFLIGHT.json", import.meta.url),
  "utf8",
));
const authorizationPath = new URL(
  "../private/release_candidates/GATE_2027_EE_SET_01_RC1/GATE_EE_SET_01_RC1_RELEASE_AUTHORIZATION_COMPLETED.json",
  import.meta.url,
);
const authorization = JSON.parse(readFileSync(authorizationPath, "utf8"));
const sha256 = value => createHash("sha256").update(value).digest("hex");

test("Set 01 commercial preflight is self-consistent and bound to exact authorization", () => {
  assert.equal(preflight.preflight_contract, "GATE_2027_COMMERCIAL_PREFLIGHT_V1");
  assert.equal(
    contentSha256(preflight, "preflight_content_sha256"),
    preflight.preflight_content_sha256,
  );
  assert.equal(preflight.product_id, authorization.paper_id);
  assert.equal(preflight.candidate_id, authorization.candidate_id);
  assert.equal(
    preflight.upstream.release_authorization_json_file_sha256,
    sha256(readFileSync(authorizationPath)),
  );
  assert.equal(
    preflight.upstream.release_authorization_content_sha256,
    authorization.authorization_content_sha256,
  );
  assert.equal(
    preflight.upstream.release_authorization_completed_pdf_sha256,
    authorization.completed_pdf.sha256,
  );
  assert.equal(
    preflight.upstream.learner_pack_sha256,
    authorization.authorized_artifacts.learner_pack_pdf.sha256,
  );
});

test("selected price is recorded while launch decisions remain explicitly blocked", () => {
  assert.equal(preflight.status, "READY_AWAITING_EXPLICIT_COMMERCIAL_DECISION");
  assert.equal(preflight.commercial_decision.price_rupees, 29);
  assert.equal(preflight.commercial_decision.sale_authorized, false);
  assert.equal(preflight.commercial_decision.storefront_activated, false);
  assert.equal(preflight.commercial_decision.payment_mode, null);
  assert.equal(preflight.commercial_decision.legal_and_refund_details_reviewed, false);
  assert.deepEqual(preflight.blockers, [
    "Sale has not been explicitly authorized.",
    "Storefront activation has not been explicitly authorized.",
    "Payment mode has not been selected.",
    "Legal and refund details have not been confirmed for launch.",
  ]);
});
