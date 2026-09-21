# Manifest-backed commercial releases only

No candidate file belongs here until its Question Bank manifest, Formatter evidence, whole-paper signoff and exact-artifact authorization all bind the same immutable learner pack.

Commercial promotion is a separate gate. It requires:

1. an explicit positive integer INR price;
2. named sale and storefront authorization;
3. a `THEMITBRO_COMMERCIAL_RELEASE_V1` manifest;
4. the exact authorized learner pack;
5. a matching entry in `RELEASE_REGISTRY.json`;
6. passing tests and a controlled Razorpay payment/download test.

The manifest must contain `product_id`, `paper_id`, `candidate_id`, `status: "RELEASED"`, `currency: "INR"`, `price_rupees`, `commercial_preflight.file`, `commercial_preflight.content_sha256`, `learner_pack.file`, `learner_pack.sha256`, upstream candidate and release-authorization content hashes, complete commercial-authorization fields and `release_content_sha256`. The self-hash is SHA-256 over canonical sorted-key JSON after removing `release_content_sha256`.

`api/_lib/release-integrity.js` fails closed when a registry entry, manifest, commercial-preflight decision, authorization field or learner-pack checksum is missing or inconsistent.
