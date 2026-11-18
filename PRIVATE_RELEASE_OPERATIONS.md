# Private release storage

The website reads release metadata and learner PDFs only from private Supabase Storage buckets. It no longer reads private release files from the repository or bundles them into Vercel functions.

## Upload and verify existing release artifacts

1. Check out this repair branch with Node.js 20 or newer.
2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local shell. Obtain the service-role key from Supabase project settings. Never commit it or expose it to browser code.
3. If you have the Question Bank repository checked out, set QUESTION_BANK_REPO_DIR to its root.
4. Two different authorization PDFs are required; do not substitute one for the other. Put the commercial authorization PDF at secure-release-inputs/GATE_2027_EE_SET_01_COMMERCIAL_AUTHORIZATION_COMPLETED.pdf (required SHA-256: 17d08e72876ac4f23a56a291b00636de6d5febb51684335e596311826965be8a). The upstream release authorization PDF is GATE_EE_SET_01_RELEASE_AUTHORIZATION_COMPLETED.pdf (required SHA-256: 9f9551f861b512457d13dc0c3e971e1f33826fe798a4e2bb73aac719157188ad) under output/pdf in the Question Bank repository.
5. Run node scripts/upload-private-release.mjs. It reads audited historical source files, uploads them to private buckets, downloads them again and checks SHA-256.
6. Resolve any missing-source errors. Checkout remains blocked until every release record and required PDF matches its hash.

## Vercel server environment

Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, THEMITBRO_PAYMENT_MODE=test, RAZORPAY_KEY_ID with an rzp_test_ prefix, RAZORPAY_KEY_SECRET and DOWNLOAD_TOKEN_SECRET (at least 32 random characters). Keep service-role credentials server-side. Live payments remain disabled.
