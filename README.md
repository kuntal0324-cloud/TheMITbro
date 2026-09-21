# TheMITbro Website — GATE 2027 EE recovery build

Static storefront + Vercel serverless API + Razorpay checkout. The only active content scope is GATE 2027 Electrical Engineering. All 50 planned sets are `under_review`; payment and download are deliberately blocked.

A paper may enter `private/releases` only after a matching immutable release manifest and named human signoff exist. Quarantined legacy files are not reachable from the catalog or API.

See `SECURITY_AND_LAUNCH.md` before public launch.

Current upstream position (2026-09-20): 87 unique candidates are individually human-certified, paper-eligible and admitted to Corpus V1. Set 01 has passed whole-paper QA at 65/65, and its exact RC1 question, solution and combined learner-pack checksums have received named-human release authorization. The immutable candidate and separate authorization record are staged under `private/release_candidates/`. They are deliberately not under `private/releases/`: no price, sale authorization or storefront activation has been approved. One complete release-authorized set and zero commercially released sets exist; all 50 catalog products remain blocked. See `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`.

## Repository boundaries
- Website: commerce and delivery only; branch-neutral product keys support future GATE paper codes.
- Question Bank: original content and review/release manifests.
- Formatter v2.0: validation, paper generation and publishing.
