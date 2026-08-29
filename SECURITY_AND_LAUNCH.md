# Production security and launch checklist

## Fixed in this stage
- Paid PDFs are no longer stored under `public/`.
- Download links use short-lived HMAC tokens bound to the purchased `paperId` and Razorpay payment ID.
- Payment verification checks Razorpay signature, order metadata, amount/currency, payment/order relationship and captured status.
- Product price/availability has one server-side catalog.
- Unreleased JEE products are `coming_soon` and cannot be purchased.
- `node_modules/` is removed from source control.

## Required Vercel environment variables
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `DOWNLOAD_TOKEN_SECRET` (independent random secret, 32+ characters)

Enable automatic payment capture in the Razorpay account if you want immediate digital delivery; this build intentionally does not deliver a paid PDF until Razorpay reports the payment as captured.

## Before public domain launch
1. Run a real low-value controlled purchase after deploying.
2. Confirm a direct `/paper/GATE_EE_SET_B.pdf` request returns 404.
3. Confirm an expired/tampered `/api/download` token returns 403.
4. Confirm payment amount shown by Razorpay matches the catalog.
5. Replace legacy PDFs with M45-generated, human-reviewed production releases.
6. Review legal/tax/refund requirements applicable to your business before accepting public sales.
