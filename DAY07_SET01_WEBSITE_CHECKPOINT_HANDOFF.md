# Day 7 Set 01 Website Checkpoint Handoff

## Scope

This update synchronizes the private website production checkpoint with 87 individually certified/admitted GATE 2027 EE records and the review-only Set 01 artifact chain.

It does **not** install a commercial paper, create a release manifest, set a price, change a catalog row to `released`, or enable payment/download. All 50 products remain `under_review` because the complete Set 01 paper still awaits named-human technical/visual QA, reviewer-metadata reconfirmation and separate release certification.

## Integration order

1. Merge the matching Question Bank Set 01 review-checkpoint package first.
2. Apply this website package on a fresh branch from current `main`.
3. Run the checks below and open a website checkpoint PR.
4. Merge only while every product remains non-purchasable.

## Required validation

```bash
npm ci
npm run check
npm audit --omit=dev --audit-level=moderate
git diff --check
```

Expected assertions: 87 candidates, 87 Formatter passes, 87 named-human batch passes, 87 paper-eligible/admitted records, one 65-question review checkpoint awaiting whole-paper QA, and 0/0 complete/released sets.

The private checkpoint is content-hash bound. No missing merge-commit identifier has been fabricated; the supplied Question Bank source-head, packaged checkpoint SHA-256 and immutable evidence hashes are recorded explicitly.
