# TheMITbro Website — GATE 2027 EE recovery build

Static storefront + Vercel serverless API + Razorpay checkout. The only active content scope is GATE 2027 Electrical Engineering. All 50 planned sets are `under_review`; payment and download are deliberately blocked.

A paper may enter `private/releases` only after a matching immutable release manifest and named human signoff exist. Quarantined legacy files are not reachable from the catalog or API.

See `SECURITY_AND_LAUNCH.md` before public launch.

Current upstream review position (2026-09-14): 87 unique candidates are in the production program, and all 87 are individually human-certified, paper-eligible and admitted to Corpus V1. An exact 65-question / 100-mark / 180-minute Set 01 review manifest and checksum-bound review PDFs now exist, but the complete rendered paper has not passed named-human whole-paper QA or separate release certification. Zero complete/released sets exist and the catalog remains fully blocked. See `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`.

## Repository boundaries
- Website: commerce and delivery only; branch-neutral product keys support future GATE paper codes.
- Question Bank: original content and review/release manifests.
- Formatter v2.0: validation, paper generation and publishing.
