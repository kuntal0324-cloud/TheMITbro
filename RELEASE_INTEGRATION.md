# Release integration contract

The website must not infer release readiness from a filename or a successful render.

For a catalog product to become `released`, all of these must identify the same paper ID and content SHA-256:

1. Exact GATE 2027 blueprint validation: 65 questions, 100 marks, 180 minutes; 10 GA questions / 15 marks and 55 selected-subject questions / 85 marks; Engineering Mathematics 13 marks and core EE 72 marks.
2. Question Bank release manifest with every question marked `PAPER_ELIGIBLE`.
3. Formatter qualification report with no `FAIL` or unresolved `REVIEW` item.
4. Duplicate/family/originality checks.
5. Canonical LaTeX source and a learner-facing XeLaTeX render with standard mathematical notation, embedded math fonts and no exposed source markup.
6. Named human technical and visual signoff.
7. PDF checksum recorded in the release manifest.

Only then:

- copy the PDF into `private/releases`;
- add its `privateFile`, `releaseManifest` and integer `priceRupees` to the matching catalog row;
- set that row's status to `released`;
- run `npm run check` and a controlled payment/download test.

The same contract applies to future branches. Use a distinct paper code, syllabus map, blueprint, corpus and product IDs; never pool questions across branches by keyword alone.

## Current upstream checkpoint — 2026-09-14

The Question Bank contains 87 unique candidates across Batches 001–005. All 87 pass Formatter, named-human batch QA, paper-eligibility certification and Corpus V1 admission. The Set 01 review checkpoint freezes 65 exact revisions and binds deterministic question, solution and fillable QA PDFs, but those complete-paper artifacts still await named-human technical and visual QA, reviewer-metadata reconfirmation and a separate release certificate. All 50 catalog products therefore remain `under_review` and non-purchasable.

The machine-checked snapshot is `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`. It is bound to Question Bank PRs #10/#11, Formatter PR #6, all five immutable batch evidence chains and the exact Set 01 review-package/artifact hashes. The supplied files do not expose the Question Bank PR #11 merge-commit identifier, so the checkpoint records the verified source-head and package/evidence hashes rather than inventing a commit. It is a deployment guard, not release authorization.
