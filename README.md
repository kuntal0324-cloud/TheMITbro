# TheMITbro

Public website source for GATE preparation materials.

## Development

- Node.js 20+
- Install dependencies: `npm ci`
- Run validation: `npm run check`

## Release security

Learner PDFs and authorization records are stored in private Supabase Storage buckets. The server API reads them using a server-only service-role credential. Never commit release artifacts, credentials, authorization records, or local secure-release inputs.

See [PRIVATE_RELEASE_OPERATIONS.md](PRIVATE_RELEASE_OPERATIONS.md) for the private artifact upload and server environment procedure.

## Payment controls

The current release is test-mode only. Live Razorpay credentials must not be configured. Checkout remains unavailable until the private manifest, preflight, authorization record, completed authorization PDF, and learner PDF all pass checksum validation.
