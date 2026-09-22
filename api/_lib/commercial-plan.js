import { readFileSync } from "node:fs";
import { contentSha256 } from "./release-integrity.js";

const plan = JSON.parse(readFileSync(
  new URL("../../private/production_state/GATE_2027_EE_COMMERCIAL_CATALOG_PLAN.json", import.meta.url),
  "utf8",
));

function requirePlan(condition, message) {
  if (!condition) throw new Error(`Commercial catalog plan invalid: ${message}`);
}

requirePlan(plan.catalog_plan_contract === "THEMITBRO_COMMERCIAL_CATALOG_PLAN_V1", "contract mismatch");
requirePlan(plan.program_id === "GATE_2027_EE", "program mismatch");
requirePlan(plan.currency === "INR", "currency mismatch");
requirePlan(
  plan.catalog_plan_content_sha256 === contentSha256(plan, "catalog_plan_content_sha256"),
  "self-hash mismatch",
);
requirePlan(Array.isArray(plan.offers) && plan.offers.length === 3, "three offers are required");

const offerIds = new Set();
for (const offer of plan.offers) {
  requirePlan(typeof offer.id === "string" && !offerIds.has(offer.id), "offer IDs must be unique");
  requirePlan(["individual", "bundle"].includes(offer.kind), `unsupported offer kind for ${offer.id}`);
  requirePlan(Number.isInteger(offer.paper_count) && offer.paper_count > 0, `invalid paper count for ${offer.id}`);
  requirePlan(Number.isInteger(offer.price_rupees) && offer.price_rupees > 0, `invalid price for ${offer.id}`);
  requirePlan(typeof offer.availability_rule === "string" && offer.availability_rule.trim(), `missing availability rule for ${offer.id}`);
  offerIds.add(offer.id);
}

const individual = plan.offers.find(offer => offer.kind === "individual");
requirePlan(individual?.paper_count === 1, "one-paper individual offer is required");
requirePlan(plan.offers.filter(offer => offer.kind === "individual").length === 1, "exactly one individual offer is required");
requirePlan(individual.id === "GATE_2027_EE_SINGLE_PAPER", "individual offer ID mismatch");
requirePlan(individual.price_rupees === 29, "individual price mismatch");
const bundles = plan.offers.filter(offer => offer.kind === "bundle");
requirePlan(bundles.length === 2, "exactly two bundle offers are required");
requirePlan(
  bundles.some(offer => offer.id === "GATE_2027_EE_PACK_20" && offer.paper_count === 20 && offer.price_rupees === 487),
  "20-paper offer mismatch",
);
requirePlan(
  bundles.some(offer => offer.id === "GATE_2027_EE_PACK_50" && offer.paper_count === 50 && offer.price_rupees === 937),
  "50-paper offer mismatch",
);
for (const bundle of bundles) {
  requirePlan(bundle.price_rupees < individual.price_rupees * bundle.paper_count, `${bundle.id} does not provide a bundle saving`);
}

for (const field of [
  "preorders_allowed",
  "future_content_payments_allowed",
  "bundle_checkout_implemented",
  "display_unproven_prior_prices",
  "sale_authorized",
  "storefront_activated",
]) {
  requirePlan(plan.controls?.[field] === false, `${field} must remain false at this stage`);
}
requirePlan(plan.controls?.payment_mode === null, "payment mode must remain unset");

export const COMMERCIAL_CATALOG_PLAN = Object.freeze(plan);
export const PLANNED_INDIVIDUAL_PRICE_RUPEES = individual.price_rupees;

export function publicOfferPlans({ contentReadySets, commerciallyReleasedSets }) {
  requirePlan(Number.isInteger(contentReadySets) && contentReadySets >= 0, "invalid content-ready count");
  requirePlan(Number.isInteger(commerciallyReleasedSets) && commerciallyReleasedSets >= 0, "invalid released count");
  requirePlan(commerciallyReleasedSets <= contentReadySets, "released count exceeds content-ready count");

  return plan.offers.map(offer => {
    const individualEquivalentRupees = individual.price_rupees * offer.paper_count;
    const savingsRupees = individualEquivalentRupees - offer.price_rupees;
    const inventoryReady = contentReadySets >= offer.paper_count;
    const status = offer.kind === "individual" && commerciallyReleasedSets > 0
      ? "available_via_listings"
      : inventoryReady ? "commercially_locked" : "inventory_locked";
    return {
      id: offer.id,
      kind: offer.kind,
      title: offer.title,
      paperCount: offer.paper_count,
      plannedPriceRupees: offer.price_rupees,
      effectivePriceRupees: Number((offer.price_rupees / offer.paper_count).toFixed(2)),
      individualEquivalentRupees,
      savingsRupees,
      savingsPercent: Number(((savingsRupees / individualEquivalentRupees) * 100).toFixed(2)),
      contentReadySets: Math.min(contentReadySets, offer.paper_count),
      commerciallyReleasedSets: Math.min(commerciallyReleasedSets, offer.paper_count),
      status,
      purchasable: false,
    };
  });
}
