# Batch 003 Website Upstream Checkpoint Handoff

Date: 2026-09-12

## Scope

This package records the merged upstream state after Question Bank PR #9 (`0a51ad6`) and Formatter PR #5 (`b695709`). Batch 003 contributes 20 named-human-certified General Aptitude questions, bringing Corpus V1 to 60 paper-eligible and admitted records.

This is an inventory checkpoint only. It does not install a commercial PDF, create a release manifest, set a price, change a catalog row to `released`, or enable payment/download. All 50 products remain `under_review` because no exact 65-question, 100-mark, 180-minute paper has passed every release gate.

## Required validation

```bash
npm ci
npm run check
npm audit --omit=dev --audit-level=moderate
git diff --check
```

Expected inventory assertions are 60 candidates, 60 Formatter passes, 60 named-human passes, 60 paper-eligible records, 60 admitted records, and 0/0 complete/released sets.
