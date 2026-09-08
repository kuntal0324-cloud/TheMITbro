# Release integration contract

The website must not infer release readiness from a filename or a successful render.

For a catalog product to become `released`, all of these must identify the same paper ID and content SHA-256:

1. Exact GATE 2027 blueprint validation: 65 questions, 100 marks, 180 minutes; 10 GA questions / 15 marks and 55 selected-subject questions / 85 marks; Engineering Mathematics 13 marks and core EE 72 marks.
2. Question Bank release manifest with every question marked `PAPER_ELIGIBLE`.
3. Formatter qualification report with no `FAIL` or unresolved `REVIEW` item.
4. Duplicate/family/originality checks.
5. Learner-facing render check with no exposed source math markup.
6. Named human technical and visual signoff.
7. PDF checksum recorded in the release manifest.

Only then:

- copy the PDF into `private/releases`;
- add its `privateFile`, `releaseManifest` and integer `priceRupees` to the matching catalog row;
- set that row's status to `released`;
- run `npm run check` and a controlled payment/download test.

The same contract applies to future branches. Use a distinct paper code, syllabus map, blueprint, corpus and product IDs; never pool questions across branches by keyword alone.

## Current upstream checkpoint — 2026-09-08

The Question Bank currently contains 40 unique candidates across Batches 001 and 002. All 40 pass Formatter; 20 Batch 001 records are human-certified, paper-eligible and admitted, while all 20 Batch 002 records remain blocked pending named human final QA. No 65-question paper is complete, so all 50 catalog products correctly remain `under_review` and non-purchasable.

The machine-checked snapshot is `private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json`. It is a deployment guard, not release authorization; every future checkpoint change must arrive with its matching immutable Question Bank and Formatter evidence.
