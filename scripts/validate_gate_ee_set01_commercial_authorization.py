#!/usr/bin/env python3
"""Validate the Set 01 commercial authorization gate without enabling commerce."""

from __future__ import annotations

import argparse

from pypdf import PdfReader

from commercial_authorization_common import (
    AUTHORIZATION_JSON_PATH,
    AUTHORIZATION_TEMPLATE_PATH,
    PDF_REQUIRED_FIELDS,
    load_release_basis,
    read_json,
    validate_authorization_record,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--require-complete", action="store_true")
    args = parser.parse_args()
    try:
        load_release_basis()
    except Exception as exc:  # fail with a concise release-gate message
        raise SystemExit(f"Release basis validation failed: {exc}") from exc
    if not AUTHORIZATION_TEMPLATE_PATH.is_file():
        raise SystemExit(f"Authorization template missing: {AUTHORIZATION_TEMPLATE_PATH}")
    reader = PdfReader(str(AUTHORIZATION_TEMPLATE_PATH))
    fields = reader.get_fields() or {}
    missing = [name for name in PDF_REQUIRED_FIELDS if name not in fields]
    if missing:
        raise SystemExit("Authorization template fields missing: " + ", ".join(missing))
    if len(reader.pages) != 3:
        raise SystemExit(f"Authorization template must have 3 pages; found {len(reader.pages)}")

    if not AUTHORIZATION_JSON_PATH.is_file():
        if args.require_complete:
            raise SystemExit("Commercial authorization is PENDING: completed JSON record is absent.")
        print("GATE EE SET 01 COMMERCIAL AUTHORIZATION GATE: PASSED (PENDING)")
        print(f"Mobile-fillable template: {AUTHORIZATION_TEMPLATE_PATH}")
        print("No sale is authorized; storefront, live payments and both bundles remain BLOCKED.")
        return
    record = read_json(AUTHORIZATION_JSON_PATH)
    errors = validate_authorization_record(record)
    if errors:
        raise SystemExit("Commercial authorization validation failed:\n- " + "\n- ".join(errors))
    print("GATE EE SET 01 COMMERCIAL AUTHORIZATION GATE: PASSED (CONTROLLED TEST ONLY)")
    print("Exact Set 01 RC1 at INR 29 may be promoted to test mode.")
    print("Live payments and both bundles remain BLOCKED.")


if __name__ == "__main__":
    main()
