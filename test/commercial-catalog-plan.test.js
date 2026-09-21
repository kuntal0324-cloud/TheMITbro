import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  COMMERCIAL_CATALOG_PLAN,
  PLANNED_INDIVIDUAL_PRICE_RUPEES,
} from "../api/_lib/commercial-plan.js";
import { contentSha256 } from "../api/_lib/release-integrity.js";

const source = JSON.parse(readFileSync(
  new URL("../private/production_state/GATE_2027_EE_COMMERCIAL_CATALOG_PLAN.json", import.meta.url),
  "utf8",
));

test("commercial catalog plan is self-hashed and exact", () => {
  assert.equal(source.catalog_plan_content_sha256, contentSha256(source, "catalog_plan_content_sha256"));
  assert.equal(COMMERCIAL_CATALOG_PLAN.catalog_plan_contract, "THEMITBRO_COMMERCIAL_CATALOG_PLAN_V1");
  assert.equal(PLANNED_INDIVIDUAL_PRICE_RUPEES, 29);
  assert.deepEqual(
    COMMERCIAL_CATALOG_PLAN.offers.map(({ paper_count, price_rupees }) => [paper_count, price_rupees]),
    [[1, 29], [20, 487], [50, 937]],
  );
});

test("planning record cannot authorize a sale or unfinished-content payment", () => {
  assert.deepEqual(COMMERCIAL_CATALOG_PLAN.controls, {
    preorders_allowed: false,
    future_content_payments_allowed: false,
    bundle_checkout_implemented: false,
    display_unproven_prior_prices: false,
    sale_authorized: false,
    storefront_activated: false,
    payment_mode: null,
  });
});
