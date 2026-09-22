# Set 01 commercial-release preflight

## Current decision

GATE 2027 EE Set 01 RC1 is technically release-authorized and its planned individual price is recorded as ₹29, but it is not commercially released. Checkout, sale and storefront activation remain blocked.

The current self-hashed machine-readable checkpoint is `private/production_state/GATE_2027_EE_SET_01_COMMERCIAL_PREFLIGHT.json`.

## What is complete

- Official 65-question / 100-mark / 180-minute paper structure.
- 65/65 aggregate Formatter release qualification.
- 65/65 named-human whole-paper QA.
- Clean question, solution and combined learner-pack PDFs.
- Checksum-bound authorization of the exact RC1 learner artifacts.
- Private staging of the candidate; no learner PDF is public.
- Owner-selected planned individual price of ₹29, recorded after exact-artifact authorization.
- A separate self-hashed 1/20/50-paper catalog plan that cannot authorize commerce.

## Authorization workflow now implemented

The repository now provides a mobile-fillable, checksum-bound authorization packet plus deterministic import, validation and promotion scripts. Until that packet is truthfully completed and imported, the validator reports `PASSED (PENDING)` and every commercial route remains locked.

The next authorization is deliberately limited to Razorpay test mode and this exact ₹29 Set 01 RC1 learner pack. Live payment and both packs require future, separate gates.

## Explicit owner inputs still required

1. Truthful legal seller/trading name, principal address, customer-care email/phone, grievance officer/email/phone, and applicable public business/tax identifiers (never Aadhaar, personal PAN or bank details).
2. Confirmation that the displayed terms, privacy, refund and contact pages are accurate for the controlled test.
3. Named authorization to expose this exact learner pack at ₹29 in a clearly labelled controlled Razorpay test preview.
4. Explicit confirmation that live payments, public sale and both bundles remain blocked.

These are owner decisions. They must not be inferred from technical QA or generated automatically.

## Promotion sequence after the decisions

1. Complete `output/pdf/GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_MOBILE_FILLABLE.pdf` on mobile and save it as `GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.pdf`.
2. Import and validate it using the commands in `SET01_COMMERCIAL_AUTHORIZATION_HANDOFF.md`.
3. Run the explicit controlled-test promoter. It copies only the authorized learner pack, re-hashes the preflight, creates the manifest and updates the registry as one deterministic workflow.
4. Confirm the API reports exactly one purchasable product and exposes no private path or manifest.
5. Deploy to a Vercel preview and run a ₹29 Razorpay test-mode purchase.
6. Verify captured payment, signed download, correct 39-page PDF, token expiry and tamper rejection.
7. Record the controlled-test evidence. A separate live-release decision and authorization are still required before any real payment or public production listing.

## Non-negotiable rollback rule

If any candidate, authorization, manifest or learner-pack checksum changes, disable the registry entry immediately and repeat exact-artifact authorization. A file with a new checksum is a new release candidate, even if it looks identical.

The 20-paper and 50-paper packs are not part of this single-product promotion. They remain locked until every included paper is separately released and bundle entitlement/delivery logic is implemented and tested.
