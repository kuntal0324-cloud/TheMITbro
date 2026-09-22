#!/usr/bin/env python3
"""Shared contracts for the Set 01 controlled-test commercial gate."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_ID = "GATE_2027_EE_SET_01"
CANDIDATE_ID = "GATE_2027_EE_SET_01_RC1"
PRICE_RUPEES = 29
CURRENCY = "INR"
PAYMENT_MODE = "test"
AUTHORIZATION_CONTRACT = "GATE_2027_EE_SET01_COMMERCIAL_AUTHORIZATION_V1"
PREFLIGHT_CONTRACT = "GATE_2027_COMMERCIAL_PREFLIGHT_V1"
RELEASE_CONTRACT = "THEMITBRO_COMMERCIAL_RELEASE_V1"
ATTESTATION = (
    "I confirm that the seller, contact and grievance details in this form are accurate; "
    "I reviewed the public privacy, terms, refund and contact pages; and I authorize only "
    "a controlled Razorpay test-mode listing for the exact GATE 2027 EE Set 01 RC1 learner "
    "pack at INR 29. I do not authorize a live payment, public sale, preorder, or 20/50-paper bundle."
)

STATE_DIR = ROOT / "private" / "production_state"
CANDIDATE_DIR = ROOT / "private" / "release_candidates" / CANDIDATE_ID
RELEASE_DIR = ROOT / "private" / "releases"
PREFLIGHT_PATH = STATE_DIR / "GATE_2027_EE_SET_01_COMMERCIAL_PREFLIGHT.json"
AUTHORIZATION_JSON_PATH = STATE_DIR / "GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.json"
AUTHORIZATION_TEMPLATE_PATH = ROOT / "output" / "pdf" / "GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_MOBILE_FILLABLE.pdf"
AUTHORIZATION_COMPLETED_PDF_PATH = ROOT / "output" / "pdf" / "GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.pdf"
CANDIDATE_MANIFEST_PATH = CANDIDATE_DIR / "GATE_EE_SET_01_RC1.json"
EXACT_AUTHORIZATION_PATH = CANDIDATE_DIR / "GATE_EE_SET_01_RC1_RELEASE_AUTHORIZATION_COMPLETED.json"
LEARNER_PACK_PATH = CANDIDATE_DIR / "GATE_EE_SET_01_LEARNER_PACK_RC1.pdf"
REGISTRY_PATH = RELEASE_DIR / "RELEASE_REGISTRY.json"

SELLER_FIELDS = (
    "legal_seller_name",
    "trading_name",
    "principal_geographic_address",
    "customer_care_email",
    "customer_care_phone",
    "grievance_officer_name",
    "grievance_email",
    "grievance_phone",
    "business_tax_identifiers",
)
POLICY_FIELDS = (
    "privacy_reviewed",
    "terms_reviewed",
    "refund_reviewed",
    "contact_reviewed",
)
DECISION_CHECKBOX_FIELDS = (
    "sale_authorized_test",
    "storefront_activated_test",
    "no_live_payment_confirmed",
    "bundles_blocked_confirmed",
    "attestation_confirmed",
)
PDF_FIXED_FIELDS = (
    "product_id",
    "candidate_id",
    "currency",
    "price_rupees",
    "payment_mode",
    "candidate_content_sha256",
    "release_authorization_content_sha256",
    "learner_pack_sha256",
    "attestation_text",
)
PDF_REQUIRED_FIELDS = (
    *PDF_FIXED_FIELDS,
    *SELLER_FIELDS,
    *POLICY_FIELDS,
    "policy_review_date",
    *DECISION_CHECKBOX_FIELDS,
    "authorized_by",
    "role_or_authority",
    "authorization_date",
    "signature",
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def content_sha256(value: dict[str, Any], field: str) -> str:
    unsigned = dict(value)
    unsigned.pop(field, None)
    encoded = json.dumps(
        unsigned,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return sha256_bytes(encoded)


def load_release_basis() -> dict[str, str]:
    candidate = read_json(CANDIDATE_MANIFEST_PATH)
    exact_authorization = read_json(EXACT_AUTHORIZATION_PATH)
    preflight = read_json(PREFLIGHT_PATH)
    learner_hash = sha256_file(LEARNER_PACK_PATH)
    errors: list[str] = []
    if candidate.get("candidate_id") != CANDIDATE_ID or candidate.get("paper_id") != PRODUCT_ID:
        errors.append("candidate identity mismatch")
    if candidate.get("candidate_content_sha256") != preflight.get("upstream", {}).get("candidate_content_sha256"):
        errors.append("candidate content hash does not match commercial preflight")
    if exact_authorization.get("candidate_id") != CANDIDATE_ID:
        errors.append("exact-artifact authorization identity mismatch")
    if exact_authorization.get("authorization_content_sha256") != preflight.get("upstream", {}).get("release_authorization_content_sha256"):
        errors.append("exact-artifact authorization hash does not match commercial preflight")
    if learner_hash != preflight.get("upstream", {}).get("learner_pack_sha256"):
        errors.append("learner-pack hash does not match commercial preflight")
    if preflight.get("preflight_content_sha256") != content_sha256(preflight, "preflight_content_sha256"):
        errors.append("commercial preflight self-hash mismatch")
    if errors:
        raise ValueError("; ".join(errors))
    return {
        "candidate_content_sha256": candidate["candidate_content_sha256"],
        "release_authorization_content_sha256": exact_authorization["authorization_content_sha256"],
        "learner_pack_sha256": learner_hash,
    }


def is_iso_date(value: Any) -> bool:
    return isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value) is not None


def validate_authorization_record(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    try:
        basis = load_release_basis()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return [f"release basis is invalid: {exc}"]

    expected_hash = content_sha256(record, "authorization_content_sha256")
    if record.get("authorization_content_sha256") != expected_hash:
        errors.append("authorization record self-hash mismatch")
    if record.get("authorization_contract") != AUTHORIZATION_CONTRACT:
        errors.append("authorization contract mismatch")
    if record.get("product_id") != PRODUCT_ID or record.get("candidate_id") != CANDIDATE_ID:
        errors.append("authorization product/candidate binding mismatch")
    if record.get("status") != "AUTHORIZED_FOR_CONTROLLED_TEST_RELEASE":
        errors.append("authorization status is not controlled-test release")
    if record.get("test_release_authorized") is not True:
        errors.append("controlled test release is not authorized")
    if record.get("live_release_authorized") is not False:
        errors.append("live release must remain unauthorized")
    if record.get("bundle_sales_authorized") is not False:
        errors.append("bundle sales must remain unauthorized")

    if record.get("basis") != basis:
        errors.append("authorization basis does not match exact RC1 artifacts")
    terms = record.get("commercial_terms", {})
    if terms != {
        "currency": CURRENCY,
        "price_rupees": PRICE_RUPEES,
        "payment_mode": PAYMENT_MODE,
        "learner_pack_sha256": basis["learner_pack_sha256"],
    }:
        errors.append("authorization commercial terms mismatch")

    seller = record.get("seller_identity", {})
    for field in SELLER_FIELDS:
        if not isinstance(seller.get(field), str) or not seller[field].strip():
            errors.append(f"seller field is blank: {field}")
    for field in ("customer_care_email", "grievance_email"):
        value = seller.get(field, "")
        if isinstance(value, str) and value.strip() and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value.strip()):
            errors.append(f"seller field is not a valid email: {field}")
    for field in ("customer_care_phone", "grievance_phone"):
        value = seller.get(field, "")
        if isinstance(value, str) and value.strip() and len(re.sub(r"\D", "", value)) < 7:
            errors.append(f"seller field is not a valid telephone number: {field}")

    policy = record.get("policy_review", {})
    for field in POLICY_FIELDS:
        if policy.get(field) is not True:
            errors.append(f"policy review is incomplete: {field}")
    if not is_iso_date(policy.get("review_date")):
        errors.append("policy review date must use YYYY-MM-DD")

    decision = record.get("decision", {})
    expected_decision = {
        "sale_authorized": True,
        "storefront_activated": True,
        "payment_mode": PAYMENT_MODE,
        "legal_and_refund_details_reviewed": True,
    }
    for field, expected in expected_decision.items():
        if decision.get(field) != expected:
            errors.append(f"authorization decision mismatch: {field}")
    for field in ("authorized_by", "role_or_authority", "signature"):
        if not isinstance(decision.get(field), str) or not decision[field].strip():
            errors.append(f"authorization decision field is blank: {field}")
    if not is_iso_date(decision.get("authorization_date")):
        errors.append("authorization date must use YYYY-MM-DD")
    if record.get("attestation") != ATTESTATION or record.get("attestation_confirmed") is not True:
        errors.append("controlled-test attestation is missing or changed")
    return errors
