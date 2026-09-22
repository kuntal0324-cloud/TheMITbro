# Set 01 controlled-test authorization handoff

## Current state

- Exact Set 01 RC1 learner artifacts: authorized for release.
- Planned individual price: ₹29.
- Commercial authorization: pending owner inputs.
- Checkout, real payments and public sale: blocked.
- 20-paper and 50-paper bundles: blocked.

This stage prepares one controlled Razorpay **test-mode** listing. It does not activate a live sale.

## Complete the form on a phone

1. Download `output/pdf/GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_MOBILE_FILLABLE.pdf`.
2. Open it in a PDF app that supports AcroForm fields (for example, Adobe Acrobat Reader).
3. Enter truthful seller, address, customer-care, grievance and public business/tax details. Do not use placeholders. Never enter Aadhaar, personal PAN, bank details or another private identifier; use `Not applicable` when no public identifier applies.
4. Review the deployed Privacy, Terms, Refund and Contact pages, then tick all four review boxes.
5. Tick all four controlled-test decisions. They explicitly keep live payments and both bundles blocked.
6. Enter the authorizer name, role, ISO dates (`YYYY-MM-DD`) and typed signature; accept the fixed attestation.
7. Save without printing or flattening as `GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.pdf` in `output/pdf/`.

The completed PDF is gitignored because it contains signature and internal contact details. Keep it securely as audit evidence.

## Import, verify and promote

```bash
python -m pip install -r requirements-pdf.txt
python scripts/import_gate_ee_set01_commercial_authorization_pdf.py \
  output/pdf/GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.pdf
python scripts/validate_gate_ee_set01_commercial_authorization.py --require-complete
python scripts/promote_gate_ee_set01_test_release.py --confirm-controlled-test-release
npm ci
THEMITBRO_PAYMENT_MODE=test \
RAZORPAY_KEY_ID=rzp_test_REPLACE_ME \
RAZORPAY_KEY_SECRET=REPLACE_ME \
DOWNLOAD_TOKEN_SECRET=REPLACE_WITH_32_PLUS_RANDOM_CHARACTERS \
npm run check
git diff --check
git status --short
```

The importer rejects missing fields, unticked decisions, changed fixed hashes, invalid dates, malformed emails/phones and any changed test-only scope. The promoter refuses to run without both the valid completed record and the explicit confirmation flag.

## Preview deployment checks

Configure these only in the Vercel **Preview** environment:

- `THEMITBRO_PAYMENT_MODE=test`
- a matching `RAZORPAY_KEY_ID` beginning with `rzp_test_`
- its test secret
- an independent random `DOWNLOAD_TOKEN_SECRET` of at least 32 characters

Then verify:

1. `/api/catalog` exposes exactly one purchasable item, ₹29, `paymentMode: "test"`, and no private paths/manifests.
2. The page clearly says controlled test mode; the bundles stay locked.
3. The policy/contact pages show the verified public seller/grievance details.
4. Razorpay displays a TEST transaction for ₹29—never a real debit.
5. Successful capture returns only the exact 39-page Set 01 RC1 learner pack.
6. A changed price, hash, payment mode, key prefix, authorization record or learner PDF fails closed.
7. An expired/tampered download token is rejected.

Do not put `rzp_live_` credentials in this preview. Do not merge a live activation on the strength of this test-only authorization.
