# Set 01 RC1 authorization-sync handoff

## Purpose

This checkpoint imports the completed exact-artifact authorization for GATE 2027 EE Set 01 RC1 into the website's private production state.

It intentionally does **not** set a price, authorize sale, promote a PDF into `private/releases/`, enable checkout or activate the storefront.

## Bound artifacts

- Question PDF SHA-256: `5479e90058e363f3c67494753c3c860540177ef2e84713eb9bec13595c2f9491`
- Solution PDF SHA-256: `8ba106686bbb7b405de96dfb9ab6308bdf4e93b958882cafb67360a7fb4e1f19`
- Learner-pack PDF SHA-256: `f6526a7ed7a16e12339f12206a8ca4ec88c5177f159f9a276ef3f2ef4298be58`
- Candidate content SHA-256: `3c719fe424b564ca4843b334588046be3e3ba428ce62cf58b5c615dddad2346e`
- Authorization JSON file SHA-256: `68b4c5f41c3d832123dd18946c8d8ae55319fc1f5af6928f554f931b836402bd`
- Authorization content SHA-256: `5b3a1adebf05b47d78012fe90ca328d1a20073dfaa64cd37debeabc10bb130b9`
- Completed authorization PDF SHA-256: `9f9551f861b512457d13dc0c3e971e1f33826fe798a4e2bb73aac719157188ad`
- Post-authorization Question Bank package SHA-256: `fd1dca934d33f5797c3173f082ee2b8a837f7a921d90f229f9ac49520a44622f`

## Expected state

- Complete 65-question sets: 1
- Release-authorized sets: 1
- Commercially released sets: 0
- Purchasable catalog products: 0
- Price: not set
- Sale authorization: false
- Storefront activation: false

## Required validation

```bash
npm ci
npm run check
npm audit --omit=dev --audit-level=moderate
git diff --check
```

Do not add a product to `private/releases/RELEASE_REGISTRY.json` in this checkpoint. Commercial promotion must be a separate reviewed change after the owner supplies an explicit price and completes the sale, storefront, payment-mode and legal/refund decisions.
