# TheMITbro Website — GATE 2027 EE recovery build

Static storefront + Vercel serverless API + Razorpay checkout. The only active content scope is GATE 2027 Electrical Engineering. All 50 planned sets are `under_review`; payment and download are deliberately blocked.

A paper may enter `private/releases` only after a matching immutable release manifest and named human signoff exist. Quarantined legacy files are not reachable from the catalog or API.

See `SECURITY_AND_LAUNCH.md` before public launch.

Current upstream position (2026-09-08): 40 unique candidates are in the production program, 20 are human-certified and paper-eligible, and zero complete sets exist. The catalog therefore remains fully blocked. See `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`.

## Repository boundaries
- Website: commerce and delivery only; branch-neutral product keys support future GATE paper codes.
- Question Bank: original content and review/release manifests.
- Formatter v2.0: validation, paper generation and publishing.
