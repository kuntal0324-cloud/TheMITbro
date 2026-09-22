# Production security and launch checklist

## Fixed in this stage
- Quarantined all legacy A/B/C PDFs; none conforms to the official 65-question release contract.
- Removed JEE listings and limited the active catalog to GATE 2027 EE.
- Added 50 branch-neutral planned product records using exam/year/paper-code/set identity.
- Required `released` status, a release manifest, a private file and a positive server-side price before purchase.
- Added runtime SHA-256 validation of the commercial manifest, commercial preflight and actual learner pack; a registry edit alone cannot enable purchase.
- Added a release registry that is empty by default and keeps all 50 planned products blocked.
- Released PDFs are stored only under `private/releases`, never `public/`.
- Download links use short-lived HMAC tokens bound to the purchased `paperId` and Razorpay payment ID.
- Payment verification checks Razorpay signature, order metadata, amount/currency, payment/order relationship and captured status.
- Product price/availability has one server-side catalog.
- Every current product is `under_review` and cannot be purchased.
- Added checkout UI that remains disabled unless the server marks a product integrity-verified and purchasable.
- Added a self-hashed 1/20/50-paper pricing plan whose controls explicitly forbid preorders, future-content payments, sale and storefront activation.
- Added server-derived offer readiness: the 20- and 50-paper packs remain inventory-locked until the required number of exact papers exists.
- Replaced minimal policy pages with responsive, dated disclosures that distinguish current operation from future checkout behavior.
- Marked missing legal seller, address, telephone and grievance details as launch blockers instead of inventing them.
- Deferred the Razorpay checkout script until a user selects an integrity-verified purchasable listing; the current locked catalog does not contact the checkout script.
- Added pull-request CI for syntax, tests and dependency audit.
- Added a separate self-hashed commercial-authorization record bound to the exact RC1 learner pack and planned ₹29 price.
- Added an explicit `THEMITBRO_PAYMENT_MODE` lock and Razorpay test/live key-prefix check; missing or cross-mode credentials fail closed.
- Added a mobile-fillable owner authorization form, deterministic importer/validator and controlled-test promoter.
- Added conservative legal-page fallbacks that are replaced only by sanitized, integrity-verified seller details from the public catalog API.
- Added no-sniff, anti-framing, referrer and browser-permission response headers.
- `node_modules/` is removed from source control.

## Required Vercel environment variables
- `THEMITBRO_PAYMENT_MODE` (`test` for the next controlled preview)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `DOWNLOAD_TOKEN_SECRET` (independent random secret, 32+ characters)

Enable automatic payment capture in the Razorpay account if you want immediate digital delivery; this build intentionally does not deliver a paid PDF until Razorpay reports the payment as captured.

## Before public domain launch
1. Complete the mobile authorization form with truthful legal seller name, principal geographic address, customer-care phone, grievance contact and applicable business/tax identifiers.
2. Have the owner or qualified adviser review the terms, privacy, refund and contact pages for the actual business and jurisdiction.
3. Record the payment mode and named sale/storefront authorizations for the exact product; do not treat the catalog plan as authorization.
4. Import and validate the authorization record, then run the explicit controlled-test promotion command. This authorizes test mode only.
5. Configure only `THEMITBRO_PAYMENT_MODE=test` and matching `rzp_test_` credentials for the preview; a mismatched or missing mode remains locked.
6. Run a controlled ₹29 Razorpay test-mode purchase after deploying.
7. Confirm a direct `/paper/GATE_EE_SET_B.pdf` request returns 404.
8. Confirm an expired/tampered `/api/download` token returns 403.
9. Confirm the amount shown by Razorpay matches the server catalog, is visibly labelled TEST, and only the purchased 39-page learner pack is delivered.
10. Add only Formatter-generated, manifest-backed, human-reviewed production releases.
11. Keep both bundles disabled until their full inventory and entitlement/delivery implementation pass automated and end-to-end tests.

A live payment requires a new, separate live-release authorization and deployment review. The current controlled-test record must never be reinterpreted as live authorization.
