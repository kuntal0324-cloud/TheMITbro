import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const SHA256 = /^[0-9a-f]{64}$/;

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]),
    );
  }
  return value;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function contentSha256(payload, field = "release_content_sha256") {
  const unsigned = { ...payload };
  delete unsigned[field];
  return sha256(JSON.stringify(canonicalValue(unsigned)));
}

function privatePath(root, directory, filename) {
  if (typeof filename !== "string" || !filename.trim() || path.isAbsolute(filename)) {
    return null;
  }
  const base = path.resolve(root, "private", directory);
  const resolved = path.resolve(base, filename);
  return resolved.startsWith(`${base}${path.sep}`) ? resolved : null;
}

function readJson(filename) {
  return JSON.parse(readFileSync(filename, "utf8"));
}

export function hasCommercialReleaseFields(product) {
  return Boolean(
    product &&
    product.status === "released" &&
    typeof product.releaseManifest === "string" &&
    product.releaseManifest.trim() &&
    typeof product.privateFile === "string" &&
    product.privateFile.trim() &&
    Number.isInteger(product.priceRupees) &&
    product.priceRupees > 0
  );
}

export function validateReleaseIntegrity(product, { root = process.cwd() } = {}) {
  const errors = [];
  if (!hasCommercialReleaseFields(product)) {
    return { valid: false, errors: ["commercial release fields are incomplete"], manifest: null };
  }

  const manifestPath = privatePath(root, "releases", product.releaseManifest);
  const learnerPath = privatePath(root, "releases", product.privateFile);
  if (!manifestPath) errors.push("release manifest path is unsafe");
  if (!learnerPath) errors.push("learner-pack path is unsafe");
  if (errors.length) return { valid: false, errors, manifest: null };

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch {
    return { valid: false, errors: ["release manifest is missing or invalid"], manifest: null };
  }

  if (manifest.release_contract !== "THEMITBRO_COMMERCIAL_RELEASE_V1") {
    errors.push("release manifest contract mismatch");
  }
  if (manifest.product_id !== product.id || manifest.paper_id !== product.id) {
    errors.push("release manifest product binding mismatch");
  }
  if (manifest.status !== "RELEASED") errors.push("release manifest status is not RELEASED");
  if (manifest.currency !== "INR" || manifest.price_rupees !== product.priceRupees) {
    errors.push("release manifest price/currency mismatch");
  }
  if (manifest.learner_pack?.file !== product.privateFile) {
    errors.push("release manifest learner-pack path mismatch");
  }
  if (!SHA256.test(manifest.learner_pack?.sha256 || "")) {
    errors.push("release manifest learner-pack checksum is invalid");
  }
  const preflightRef = manifest.commercial_preflight || {};
  const preflightPath = privatePath(root, "production_state", preflightRef.file);
  let preflight = null;
  if (!preflightPath || !SHA256.test(preflightRef.content_sha256 || "")) {
    errors.push("commercial preflight reference is invalid");
  } else {
    try {
      preflight = readJson(preflightPath);
    } catch {
      errors.push("commercial preflight is missing or invalid");
    }
  }

  if (preflight) {
    const computedPreflightHash = contentSha256(preflight, "preflight_content_sha256");
    if (
      preflight.preflight_contract !== "GATE_2027_COMMERCIAL_PREFLIGHT_V1" ||
      preflight.preflight_content_sha256 !== computedPreflightHash ||
      preflightRef.content_sha256 !== computedPreflightHash
    ) {
      errors.push("commercial preflight integrity check failed");
    }
    if (
      preflight.product_id !== product.id ||
      preflight.candidate_id !== manifest.candidate_id
    ) {
      errors.push("commercial preflight product binding mismatch");
    }
    const requiredReadiness = {
      official_blueprint: "PASS",
      formatter_release_qualification: "PASS_65_OF_65",
      whole_paper_human_qa: "PASS_65_OF_65",
      learner_artifact_validation: "PASS",
      exact_artifact_release_authorization: "PASS",
    };
    if (
      preflight.status !== "COMMERCIAL_RELEASE_AUTHORIZED" ||
      Object.entries(requiredReadiness).some(([field, value]) => (
        preflight.readiness?.[field] !== value
      ))
    ) {
      errors.push("commercial preflight is not release-authorized");
    }

    const decision = preflight.commercial_decision || {};
    if (
      decision.currency !== "INR" ||
      decision.price_rupees !== product.priceRupees ||
      decision.sale_authorized !== true ||
      decision.storefront_activated !== true ||
      !["test", "live"].includes(decision.payment_mode) ||
      decision.legal_and_refund_details_reviewed !== true ||
      typeof decision.authorized_by !== "string" ||
      !decision.authorized_by.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(decision.authorization_date || "")
    ) {
      errors.push("commercial preflight decision is incomplete");
    }

    for (const field of [
      "candidate_content_sha256",
      "release_authorization_content_sha256",
    ]) {
      if (
        !SHA256.test(manifest.upstream?.[field] || "") ||
        manifest.upstream[field] !== preflight.upstream?.[field]
      ) {
        errors.push(`release manifest ${field} does not match preflight`);
      }
    }
    if (manifest.learner_pack?.sha256 !== preflight.upstream?.learner_pack_sha256) {
      errors.push("release learner-pack checksum does not match preflight");
    }

    const authorization = manifest.commercial_authorization || {};
    for (const field of [
      "sale_authorized",
      "storefront_activated",
      "payment_mode",
      "authorized_by",
      "authorization_date",
      "legal_and_refund_details_reviewed",
    ]) {
      if (authorization[field] !== decision[field]) {
        errors.push(`commercial authorization ${field} does not match preflight`);
      }
    }
  }
  const authorization = manifest.commercial_authorization || {};
  if (
    authorization.sale_authorized !== true ||
    authorization.storefront_activated !== true ||
    !["test", "live"].includes(authorization.payment_mode) ||
    authorization.legal_and_refund_details_reviewed !== true ||
    typeof authorization.authorized_by !== "string" ||
    !authorization.authorized_by.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(authorization.authorization_date || "")
  ) {
    errors.push("commercial authorization is incomplete");
  }
  if (manifest.release_content_sha256 !== contentSha256(manifest)) {
    errors.push("release manifest self-hash mismatch");
  }

  let learnerBytes;
  try {
    learnerBytes = readFileSync(learnerPath);
  } catch {
    errors.push("released learner pack is missing");
  }
  if (learnerBytes && sha256(learnerBytes) !== manifest.learner_pack.sha256) {
    errors.push("released learner-pack checksum mismatch");
  }

  return { valid: errors.length === 0, errors, manifest };
}
