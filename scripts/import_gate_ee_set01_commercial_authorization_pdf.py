#!/usr/bin/env python3
"""Import a completed mobile PDF into the immutable commercial authorization record."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from pypdf import PdfReader

from commercial_authorization_common import (
    ATTESTATION,
    AUTHORIZATION_COMPLETED_PDF_PATH,
    AUTHORIZATION_CONTRACT,
    AUTHORIZATION_JSON_PATH,
    CANDIDATE_ID,
    CURRENCY,
    DECISION_CHECKBOX_FIELDS,
    PAYMENT_MODE,
    PDF_REQUIRED_FIELDS,
    POLICY_FIELDS,
    PRICE_RUPEES,
    PRODUCT_ID,
    SELLER_FIELDS,
    content_sha256,
    load_release_basis,
    sha256_file,
    validate_authorization_record,
    write_json,
)


def field_value(field: dict[str, Any] | None) -> str:
    if not field:
        return ""
    value = field.get("/V", "")
    if value is None:
        return ""
    return str(value).strip()


def checked(field: dict[str, Any] | None) -> bool:
    return field_value(field).lower().lstrip("/") in {"yes", "on", "true", "1", "checked"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", nargs="?", type=Path, default=AUTHORIZATION_COMPLETED_PDF_PATH)
    parser.add_argument("--output", type=Path, default=AUTHORIZATION_JSON_PATH)
    args = parser.parse_args()
    pdf_path = args.pdf.resolve()
    if not pdf_path.is_file():
        raise SystemExit(f"Completed authorization PDF not found: {pdf_path}")

    reader = PdfReader(str(pdf_path))
    fields = reader.get_fields() or {}
    missing = [name for name in PDF_REQUIRED_FIELDS if name not in fields]
    if missing:
        raise SystemExit("Authorization PDF is missing required fields: " + ", ".join(missing))
    unchecked = [name for name in (*POLICY_FIELDS, *DECISION_CHECKBOX_FIELDS) if not checked(fields.get(name))]
    if unchecked:
        raise SystemExit("Required checkboxes are not selected: " + ", ".join(unchecked))

    basis = load_release_basis()
    expected_fixed = {
        "product_id": PRODUCT_ID,
        "candidate_id": CANDIDATE_ID,
        "currency": CURRENCY,
        "price_rupees": str(PRICE_RUPEES),
        "payment_mode": PAYMENT_MODE,
        "candidate_content_sha256": basis["candidate_content_sha256"],
        "release_authorization_content_sha256": basis["release_authorization_content_sha256"],
        "learner_pack_sha256": basis["learner_pack_sha256"],
        "attestation_text": ATTESTATION,
    }
    changed = [name for name, expected in expected_fixed.items() if field_value(fields.get(name)) != expected]
    if changed:
        raise SystemExit("Fixed authorization fields were changed: " + ", ".join(changed))

    seller = {name: field_value(fields.get(name)) for name in SELLER_FIELDS}
    record: dict[str, Any] = {
        "authorization_contract": AUTHORIZATION_CONTRACT,
        "product_id": PRODUCT_ID,
        "candidate_id": CANDIDATE_ID,
        "status": "AUTHORIZED_FOR_CONTROLLED_TEST_RELEASE",
        "test_release_authorized": True,
        "live_release_authorized": False,
        "bundle_sales_authorized": False,
        "basis": basis,
        "commercial_terms": {
            "currency": CURRENCY,
            "price_rupees": PRICE_RUPEES,
            "payment_mode": PAYMENT_MODE,
            "learner_pack_sha256": basis["learner_pack_sha256"],
        },
        "seller_identity": seller,
        "policy_review": {
            **{name: True for name in POLICY_FIELDS},
            "review_date": field_value(fields.get("policy_review_date")),
        },
        "decision": {
            "sale_authorized": True,
            "storefront_activated": True,
            "payment_mode": PAYMENT_MODE,
            "legal_and_refund_details_reviewed": True,
            "authorized_by": field_value(fields.get("authorized_by")),
            "role_or_authority": field_value(fields.get("role_or_authority")),
            "authorization_date": field_value(fields.get("authorization_date")),
            "signature": field_value(fields.get("signature")),
        },
        "attestation": ATTESTATION,
        "attestation_confirmed": True,
        "source_completed_pdf": {
            "filename": pdf_path.name,
            "sha256": sha256_file(pdf_path),
        },
    }
    record["authorization_content_sha256"] = content_sha256(record, "authorization_content_sha256")
    errors = validate_authorization_record(record)
    if errors:
        raise SystemExit("Authorization import rejected:\n- " + "\n- ".join(errors))
    write_json(args.output.resolve(), record)
    print("GATE EE SET 01 COMMERCIAL AUTHORIZATION IMPORT: PASSED")
    print(f"Controlled-test authorization record: {args.output.resolve()}")
    print("Live payments and both bundles remain BLOCKED.")


if __name__ == "__main__":
    main()
