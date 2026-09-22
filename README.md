# TheMITbro Website — GATE 2027 EE recovery build

Static storefront + Vercel serverless API + Razorpay checkout. The only active content scope is GATE 2027 Electrical Engineering. All 50 planned sets are `under_review`; payment and download are deliberately blocked. The public catalog displays a non-purchasable plan of ₹29 per individual paper, ₹487 for a future 20-paper pack and ₹937 for a future 50-paper pack.

A paper may enter `private/releases` only after a matching immutable release manifest and named human signoff exist. Quarantined legacy files are not reachable from the catalog or API.

See `SECURITY_AND_LAUNCH.md` before public launch.

Current upstream position (2026-09-21): 87 unique candidates are individually human-certified, paper-eligible and admitted to Corpus V1. Set 01 has passed whole-paper QA at 65/65, and its exact RC1 question, solution and combined learner-pack checksums have received named-human release authorization. The immutable candidate and latest supplied authorization record are staged under `private/release_candidates/`. They are deliberately not under `private/releases/`: the planned ₹29 price is recorded, but payment mode, sale authorization, legal review and storefront activation remain incomplete. One complete release-authorized set and zero commercially released sets exist; all 50 catalog products and both packs remain blocked. See `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`, `private/production_state/GATE_2027_EE_SET_01_COMMERCIAL_PREFLIGHT.json` and `COMMERCIAL_CATALOG_PLAN.md`.

Runtime purchase eligibility is fail-closed. A positive catalog status is insufficient: the server revalidates the commercial manifest, commercial preflight, separate owner authorization, exact learner-pack SHA-256, declared payment mode and matching Razorpay credential type before exposing a purchase or serving a download.

## Next gate: controlled test authorization

The repository includes a three-page mobile-fillable authorization form at `output/pdf/GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_MOBILE_FILLABLE.pdf`. It is deliberately limited to one ₹29 Set 01 test-mode listing. It cannot authorize a live payment, public production sale, preorder, or either bundle.

After the owner supplies truthful seller, address, phone, grievance and business/tax details and reviews all four policy pages:

```bash
python scripts/import_gate_ee_set01_commercial_authorization_pdf.py \
  output/pdf/GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.pdf
python scripts/validate_gate_ee_set01_commercial_authorization.py --require-complete
python scripts/promote_gate_ee_set01_test_release.py --confirm-controlled-test-release
THEMITBRO_PAYMENT_MODE=test RAZORPAY_KEY_ID=rzp_test_... \
  RAZORPAY_KEY_SECRET=... DOWNLOAD_TOKEN_SECRET=... npm run check
```

Do not commit the completed PDF because it contains owner/contact/signature information. Commit the generated completed JSON record, preflight, exact released learner pack, release manifest and registry update together. See `SET01_COMMERCIAL_AUTHORIZATION_HANDOFF.md` for the mobile workflow and test checklist.

## Repository boundaries
- Website: commerce and delivery only; branch-neutral product keys support future GATE paper codes.
- Question Bank: original content and review/release manifests.
- Formatter v2.0: validation, paper generation and publishing.
