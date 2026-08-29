# TheMITbro Website — Production Storefront

Static storefront + Vercel serverless API + Razorpay checkout. Paid PDFs live under `private/paper`, never `public/paper`. Product availability/pricing is controlled by `api/_lib/catalog.js`.

See `SECURITY_AND_LAUNCH.md` before public launch.

## Repository boundaries
- Website: commerce and delivery only.
- Question Bank: original content and review/release manifests.
- Formatter v2.0: validation, paper generation and publishing.
