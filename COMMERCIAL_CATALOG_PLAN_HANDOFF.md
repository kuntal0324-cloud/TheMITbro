# Commercial catalog plan handoff

## Implemented in this snapshot

- Records the exact ₹29 / ₹487 / ₹937 pricing plan in a self-hashed machine-readable file.
- Shows truthful pack comparisons against ₹29 individual papers.
- Shows one content-ready Set 01 and zero commercially released sets.
- Keeps all individual and bundle buttons disabled.
- Rejects preorders and future-content payments by contract.
- Records ₹29 in Set 01's commercial preflight without granting sale or storefront authorization.
- Rebuilds privacy, terms, refund and contact pages for mobile and records missing business identity details as launch blockers.
- Adds automated coverage for plan integrity, calculations, locked inventory, policy pages and existing release-integrity behavior.

## Verification

Run:

```bash
npm ci
npm run check
```

Expected result: 22 tests pass and zero fail.

## State after merge

- Complete content sets: 1/50
- Commercially released sets: 0/50
- Individual planned price: ₹29
- 20-paper pack: ₹487, inventory locked
- 50-paper pack: ₹937, inventory locked
- Checkout: blocked
- Preorders: prohibited
- Payment mode: unset
- Seller/contact/legal launch details: incomplete

## Next owner inputs

Before any live listing is created, supply and verify the legal seller name, principal geographic address, customer-care phone, grievance officer details and applicable business/tax identifiers. Then review the policy text, select Razorpay test mode, and explicitly authorize only the exact Set 01 learner pack at ₹29 for a controlled test. Do not activate either pack yet.
