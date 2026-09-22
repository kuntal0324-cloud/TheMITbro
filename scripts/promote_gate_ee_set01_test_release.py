#!/usr/bin/env python3
"""Promote exact Set 01 RC1 into a controlled test listing after explicit authorization."""

from __future__ import annotations

import argparse
import shutil

from commercial_authorization_common import (
    AUTHORIZATION_JSON_PATH,
    CANDIDATE_ID,
    CURRENCY,
    LEARNER_PACK_PATH,
    PAYMENT_MODE,
    PREFLIGHT_CONTRACT,
    PREFLIGHT_PATH,
    PRICE_RUPEES,
    PRODUCT_ID,
    REGISTRY_PATH,
    RELEASE_CONTRACT,
    RELEASE_DIR,
    content_sha256,
    read_json,
    sha256_file,
    validate_authorization_record,
    write_json,
)

RELEASE_PDF_NAME = "GATE_2027_EE_SET_01.pdf"
RELEASE_MANIFEST_NAME = "GATE_2027_EE_SET_01.release.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--confirm-controlled-test-release",
        action="store_true",
        help="Required explicit confirmation; never authorizes live payments or bundles.",
    )
    args = parser.parse_args()
    if not args.confirm_controlled_test_release:
        raise SystemExit("Refusing promotion without --confirm-controlled-test-release")
    if not AUTHORIZATION_JSON_PATH.is_file():
        raise SystemExit("Completed commercial authorization JSON is absent.")
    authorization_record = read_json(AUTHORIZATION_JSON_PATH)
    errors = validate_authorization_record(authorization_record)
    if errors:
        raise SystemExit("Commercial authorization rejected:\n- " + "\n- ".join(errors))

    preflight = read_json(PREFLIGHT_PATH)
    if preflight.get("preflight_contract") != PREFLIGHT_CONTRACT:
        raise SystemExit("Commercial preflight contract mismatch.")
    if preflight.get("product_id") != PRODUCT_ID or preflight.get("candidate_id") != CANDIDATE_ID:
        raise SystemExit("Commercial preflight binding mismatch.")
    if preflight.get("upstream", {}).get("learner_pack_sha256") != sha256_file(LEARNER_PACK_PATH):
        raise SystemExit("Exact learner pack no longer matches the preflight.")

    decision = authorization_record["decision"]
    preflight["commercial_decision"] = {
        "currency": CURRENCY,
        "price_rupees": PRICE_RUPEES,
        "sale_authorized": True,
        "storefront_activated": True,
        "payment_mode": PAYMENT_MODE,
        "authorized_by": decision["authorized_by"],
        "authorization_date": decision["authorization_date"],
        "legal_and_refund_details_reviewed": True,
    }
    preflight["status"] = "COMMERCIAL_RELEASE_AUTHORIZED"
    preflight["blockers"] = []
    preflight["preflight_content_sha256"] = content_sha256(preflight, "preflight_content_sha256")

    released_pdf = RELEASE_DIR / RELEASE_PDF_NAME
    authorization_hash = authorization_record["authorization_content_sha256"]
    manifest = {
        "release_contract": RELEASE_CONTRACT,
        "product_id": PRODUCT_ID,
        "paper_id": PRODUCT_ID,
        "candidate_id": CANDIDATE_ID,
        "status": "RELEASED",
        "currency": CURRENCY,
        "price_rupees": PRICE_RUPEES,
        "commercial_preflight": {
            "file": PREFLIGHT_PATH.name,
            "content_sha256": preflight["preflight_content_sha256"],
        },
        "commercial_authorization_record": {
            "file": AUTHORIZATION_JSON_PATH.name,
            "content_sha256": authorization_hash,
        },
        "learner_pack": {
            "file": RELEASE_PDF_NAME,
            "sha256": sha256_file(LEARNER_PACK_PATH),
        },
        "upstream": {
            "candidate_content_sha256": preflight["upstream"]["candidate_content_sha256"],
            "release_authorization_content_sha256": preflight["upstream"]["release_authorization_content_sha256"],
        },
        "commercial_authorization": {
            "sale_authorized": True,
            "storefront_activated": True,
            "payment_mode": PAYMENT_MODE,
            "authorized_by": decision["authorized_by"],
            "authorization_date": decision["authorization_date"],
            "legal_and_refund_details_reviewed": True,
        },
    }
    manifest["release_content_sha256"] = content_sha256(manifest, "release_content_sha256")

    registry = read_json(REGISTRY_PATH)
    if registry.get("registry_contract") != "THEMITBRO_RELEASE_REGISTRY_V1":
        raise SystemExit("Release registry contract mismatch.")
    existing = registry.get("products", {}).get(PRODUCT_ID)
    entry = {
        "status": "released",
        "priceRupees": PRICE_RUPEES,
        "releaseManifest": RELEASE_MANIFEST_NAME,
        "privateFile": RELEASE_PDF_NAME,
    }
    if existing and existing != entry:
        raise SystemExit("A conflicting Set 01 registry entry already exists.")
    registry.setdefault("products", {})[PRODUCT_ID] = entry

    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(LEARNER_PACK_PATH, released_pdf)
    write_json(PREFLIGHT_PATH, preflight)
    write_json(RELEASE_DIR / RELEASE_MANIFEST_NAME, manifest)
    write_json(REGISTRY_PATH, registry)
    print("GATE EE SET 01 CONTROLLED TEST PROMOTION: PASSED")
    print("Exactly one individual paper is registry-released at INR 29 in test mode.")
    print("Live payments and 20/50-paper bundles remain BLOCKED.")


if __name__ == "__main__":
    main()
