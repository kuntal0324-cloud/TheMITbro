# Set 01 commercial-release preflight

## Current decision

GATE 2027 EE Set 01 RC1 is technically release-authorized but is not commercially released. Checkout, sale and storefront activation remain blocked.

The current self-hashed machine-readable checkpoint is `private/production_state/GATE_2027_EE_SET_01_COMMERCIAL_PREFLIGHT.json`.

## What is complete

- Official 65-question / 100-mark / 180-minute paper structure.
- 65/65 aggregate Formatter release qualification.
- 65/65 named-human whole-paper QA.
- Clean question, solution and combined learner-pack PDFs.
- Checksum-bound authorization of the exact RC1 learner artifacts.
- Private staging of the candidate; no learner PDF is public.

## Explicit decisions still required

1. Positive integer selling price in INR.
2. Razorpay mode for the controlled launch test: test mode first, then live mode only after success.
3. Named authorization to sell this exact learner pack at that price.
4. Named authorization to activate the storefront listing.
5. Confirmation that the displayed business, contact, terms, privacy and refund details are accurate for launch.

These are owner decisions. They must not be inferred from technical QA or generated automatically.

## Promotion sequence after the decisions

1. Copy only `GATE_EE_SET_01_LEARNER_PACK_RC1.pdf` into `private/releases/`.
2. Complete and re-hash the commercial preflight, then create a `THEMITBRO_COMMERCIAL_RELEASE_V1` manifest bound to that preflight, the authorized candidate and learner-pack checksum.
3. Add the corresponding entry to `private/releases/RELEASE_REGISTRY.json`.
4. Confirm the API reports exactly one purchasable product and exposes no private path or manifest.
5. Deploy to a Vercel preview and run a low-value Razorpay test-mode purchase.
6. Verify captured payment, signed download, correct 39-page PDF, token expiry and tamper rejection.
7. Only after the controlled test passes may the production listing be activated.

## Non-negotiable rollback rule

If any candidate, authorization, manifest or learner-pack checksum changes, disable the registry entry immediately and repeat exact-artifact authorization. A file with a new checksum is a new release candidate, even if it looks identical.
