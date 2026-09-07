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
