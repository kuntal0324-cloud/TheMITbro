import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  contentSha256,
  sha256,
  validateReleaseIntegrity,
} from "../api/_lib/release-integrity.js";

function writeJson(filename, value) {
  writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "themitbro-release-"));
  const releaseRoot = path.join(root, "private", "releases");
  const stateRoot = path.join(root, "private", "production_state");
  mkdirSync(releaseRoot, { recursive: true });
  mkdirSync(stateRoot, { recursive: true });

  const product = {
    id: "GATE_2027_EE_SET_01",
    status: "released",
    priceRupees: 99,
    releaseManifest: "GATE_2027_EE_SET_01.release.json",
    privateFile: "GATE_2027_EE_SET_01.pdf",
  };
  const learnerBytes = Buffer.from("test learner pack");
  writeFileSync(path.join(releaseRoot, product.privateFile), learnerBytes);

  const decision = {
    currency: "INR",
    price_rupees: product.priceRupees,
    sale_authorized: true,
    storefront_activated: true,
    payment_mode: "test",
    authorized_by: "Release owner",
    authorization_date: "2026-09-21",
    legal_and_refund_details_reviewed: true,
  };
  const preflight = {
    preflight_contract: "GATE_2027_COMMERCIAL_PREFLIGHT_V1",
    product_id: product.id,
    candidate_id: "GATE_2027_EE_SET_01_RC1",
    upstream: {
      candidate_content_sha256: "a".repeat(64),
      release_authorization_content_sha256: "b".repeat(64),
      learner_pack_sha256: sha256(learnerBytes),
    },
    readiness: {
      official_blueprint: "PASS",
      formatter_release_qualification: "PASS_65_OF_65",
      whole_paper_human_qa: "PASS_65_OF_65",
      learner_artifact_validation: "PASS",
      exact_artifact_release_authorization: "PASS",
    },
    commercial_decision: decision,
    status: "COMMERCIAL_RELEASE_AUTHORIZED",
  };
  preflight.preflight_content_sha256 = contentSha256(preflight, "preflight_content_sha256");
  const preflightFile = "GATE_2027_EE_SET_01_COMMERCIAL_PREFLIGHT.json";
  writeJson(path.join(stateRoot, preflightFile), preflight);

  const manifest = {
    release_contract: "THEMITBRO_COMMERCIAL_RELEASE_V1",
    product_id: product.id,
    paper_id: product.id,
    candidate_id: preflight.candidate_id,
    status: "RELEASED",
    currency: "INR",
    price_rupees: product.priceRupees,
    commercial_preflight: {
      file: preflightFile,
      content_sha256: preflight.preflight_content_sha256,
    },
    learner_pack: {
      file: product.privateFile,
      sha256: sha256(learnerBytes),
    },
    upstream: preflight.upstream,
    commercial_authorization: { ...decision },
  };
  manifest.release_content_sha256 = contentSha256(manifest);
  writeJson(path.join(releaseRoot, product.releaseManifest), manifest);
  return { root, product, manifest, learnerBytes };
}

test("complete manifest, preflight and learner pack pass together", t => {
  const value = fixture();
  t.after(() => rmSync(value.root, { recursive: true, force: true }));
  const result = validateReleaseIntegrity(value.product, { root: value.root });
  assert.equal(result.valid, true, result.errors.join("; "));
});

test("learner-pack tampering fails closed", t => {
  const value = fixture();
  t.after(() => rmSync(value.root, { recursive: true, force: true }));
  writeFileSync(
    path.join(value.root, "private", "releases", value.product.privateFile),
    Buffer.concat([value.learnerBytes, Buffer.from(" tampered")]),
  );
  const result = validateReleaseIntegrity(value.product, { root: value.root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("released learner-pack checksum mismatch"));
});

test("manifest and learner paths cannot escape private release storage", () => {
  const product = {
    id: "GATE_2027_EE_SET_01",
    status: "released",
    priceRupees: 99,
    releaseManifest: "../../package.json",
    privateFile: "../../public/index.html",
  };
  const result = validateReleaseIntegrity(product);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("release manifest path is unsafe"));
  assert.ok(result.errors.includes("learner-pack path is unsafe"));
});
