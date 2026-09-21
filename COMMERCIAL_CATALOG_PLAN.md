# GATE 2027 EE commercial catalog plan

## Current stage

This repository records a pricing plan, not a commercial launch. One complete Set 01 learner pack is technically authorized, zero products are commercially released, and every checkout path remains fail-closed.

The self-hashed source of truth is `private/production_state/GATE_2027_EE_COMMERCIAL_CATALOG_PLAN.json`.

## Exact planned pricing

| Offer | Papers | Planned price | Price per paper | Individual equivalent | Saving |
| --- | ---: | ---: | ---: | ---: | ---: |
| Individual paper | 1 | ₹29 | ₹29.00 | ₹29 | ₹0 |
| 20-paper pack | 20 | ₹487 | ₹24.35 | ₹580 | ₹93 (16.03%) |
| 50-paper pack | 50 | ₹937 | ₹18.74 | ₹1,450 | ₹513 (35.38%) |

The pack comparison is against the exact number of individual papers at ₹29 each. ₹500 and ₹1,000 are not displayed as crossed-out prices because they are proposed reference points, not verified former selling prices.

## Availability rules

- An individual listing stays locked until its exact learner PDF, commercial preflight, manifest and registry entry pass runtime integrity verification.
- The 20-paper pack stays inventory-locked until at least 20 exact papers have independently passed commercial release.
- The 50-paper pack stays inventory-locked until all 50 exact papers have independently passed commercial release.
- No preorder, deposit or payment for future content is accepted.
- A pricing-plan file cannot authorize sale, choose a payment mode or activate a listing.
- Bundle checkout is not implemented at this stage; adding a displayed plan does not create a purchasable bundle.

## Recommended rollout while content is limited

1. Complete the seller, contact, grievance, refund and privacy details.
2. Explicitly authorize only Set 01 at ₹29 and use Razorpay test mode for an end-to-end controlled purchase.
3. Release subsequent papers individually as each exact artifact completes the same gates.
4. Activate the 20-paper pack only after 20 included papers are commercially released and bundle entitlements are implemented and tested.
5. Activate the 50-paper pack only after all 50 included papers are commercially released and the full bundle passes the same delivery and tamper tests.

This progressive approach gives learners something real to buy without pretending that unfinished inventory exists. A future upgrade-credit program could credit verified individual purchases toward a pack, but it must not be promised until customer identity, order history, entitlement accounting and anti-duplication tests exist.
