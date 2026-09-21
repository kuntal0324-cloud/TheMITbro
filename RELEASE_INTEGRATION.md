# Release integration contract

The website must not infer release readiness from a filename or a successful render.

For a catalog product to become `released`, all of these must identify the same paper ID and content SHA-256:

1. Exact GATE 2027 blueprint validation: 65 questions, 100 marks, 180 minutes; 10 GA questions / 15 marks and 55 selected-subject questions / 85 marks; Engineering Mathematics 13 marks and core EE 72 marks.
2. Question Bank release manifest with every question marked `PAPER_ELIGIBLE`.
3. Formatter qualification report with no `FAIL` or unresolved `REVIEW` item.
4. Duplicate/family/originality checks.
5. Canonical LaTeX source and a learner-facing XeLaTeX render with standard mathematical notation, embedded math fonts and no exposed source markup.
6. Named human technical and visual signoff.
7. Clean learner-facing question, solution and combined-pack PDFs with no review-only markings or internal audit IDs.
8. Named-human authorization of those exact learner-artifact checksums.
9. Explicit price, payment-mode, sale, storefront and legal/refund decisions recorded in a self-hashed commercial preflight.
10. PDF checksums and the commercial-preflight hash recorded in an immutable release manifest.

Only then:

- copy the PDF into `private/releases`;
- add its `privateFile`, `releaseManifest` and integer `priceRupees` to the matching catalog row;
- set that row's status to `released`;
- run `npm run check` and a controlled payment/download test.

The same contract applies to future branches. Use a distinct paper code, syllabus map, blueprint, corpus and product IDs; never pool questions across branches by keyword alone.

## Current upstream checkpoint — 2026-09-21

The Question Bank contains 87 unique candidates across Batches 001–005. All 87 pass Formatter, named-human batch QA, paper-eligibility certification and Corpus V1 admission. Set 01 whole-paper QA records 65 PASS / 0 REVISE / 0 REJECT and resolves the historical reviewer-metadata inconsistency. Aggregate Formatter release evidence records the same 65 revisions as PASS. Clean RC1 question, solution and combined learner-pack PDFs are staged privately and their hashes are enforced by tests.

RC1's exact question, solution and learner-pack checksums now have named-human release authorization. The immutable candidate and completed authorization record are staged privately and cross-checked by tests.

Release authorization does not authorize sale. There is no approved price, sale authorization, promoted commercial release manifest or storefront activation. All 50 catalog products therefore remain `under_review` and non-purchasable.

The machine-checked snapshot is `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`. It is bound to Question Bank PRs #10/#11/#13/#15, Formatter PR #6, the supplied repository snapshots, all five immutable batch evidence chains, the completed whole-paper signoff, the exact RC1 artifact hashes and the latest supplied completed-authorization record. The newest Question Bank snapshot preserves the same reviewer fields and learner-artifact hashes but contains a newer completed-PDF serialization, so the website now binds its JSON, content and completed-PDF hashes. This checkpoint is a deployment guard and does not activate commerce.

The separate Set 01 commercial preflight remains `READY_AWAITING_EXPLICIT_COMMERCIAL_DECISION`. Runtime integrity checks will reject a release unless the preflight becomes `COMMERCIAL_RELEASE_AUTHORIZED`, its self-hash matches, every commercial decision is complete, and the manifest and learner PDF match it exactly.
