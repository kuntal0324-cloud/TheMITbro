import { readFileSync } from "node:fs";
import { hasCommercialReleaseFields, validateReleaseIntegrity } from "./release-integrity.js";
import {
  PLANNED_INDIVIDUAL_PRICE_RUPEES,
  publicOfferPlans,
} from "./commercial-plan.js";

const PROGRAMS = Object.freeze([
  Object.freeze({
    examFamily: "GATE",
    examYear: 2027,
    paperCode: "EE",
    branch: "Electrical Engineering",
    setCount: 50,
  }),
]);

const registry = JSON.parse(readFileSync(
  new URL("../../private/releases/RELEASE_REGISTRY.json", import.meta.url),
  "utf8",
));
if (registry.registry_contract !== "THEMITBRO_RELEASE_REGISTRY_V1") {
  throw new Error("Release registry contract mismatch");
}
const RELEASES = Object.freeze(registry.products || {});
const upstreamCheckpoint = JSON.parse(readFileSync(
  new URL("../../private/production_state/GATE_2027_EE_UPSTREAM_CHECKPOINT.json", import.meta.url),
  "utf8",
));
if (upstreamCheckpoint.checkpoint_contract !== "GATE_2027_EE_UPSTREAM_CHECKPOINT_V4") {
  throw new Error("Upstream checkpoint contract mismatch");
}
const plannedIds = new Set(PROGRAMS.flatMap(program => (
  Array.from({ length: program.setCount }, (_, index) => (
    `${program.examFamily}_${program.examYear}_${program.paperCode}_SET_${String(index + 1).padStart(2, "0")}`
  ))
)));
for (const productId of Object.keys(RELEASES)) {
  if (!plannedIds.has(productId)) {
    throw new Error(`Release registry contains unknown product: ${productId}`);
  }
}

function plannedProduct(program, setNumber) {
  const number = String(setNumber).padStart(2, "0");
  const id = `${program.examFamily}_${program.examYear}_${program.paperCode}_SET_${number}`;
  const release = RELEASES[id] || {};
  return Object.freeze({
    id,
    title: `${program.examFamily} ${program.examYear} ${program.paperCode} — Mock Set ${number}`,
    ...program,
    setNumber,
    plannedPriceRupees: PLANNED_INDIVIDUAL_PRICE_RUPEES,
    priceRupees: release.priceRupees ?? null,
    status: release.status ?? "under_review",
    releaseManifest: release.releaseManifest ?? null,
    privateFile: release.privateFile ?? null,
  });
}

// Add a future branch as a separate program. Its paper code, syllabus,
// blueprint, corpus and release registry entries remain isolated from EE.
export const PRODUCTS = Object.freeze(Object.fromEntries(
  PROGRAMS.flatMap(program => (
    Array.from({ length: program.setCount }, (_, index) => plannedProduct(program, index + 1))
  )).map(product => [product.id, product]),
));

export function getProduct(id) {
  return PRODUCTS[id] || null;
}

export function isPurchasable(product) {
  return hasCommercialReleaseFields(product) && validateReleaseIntegrity(product).valid;
}

export function publicCatalog() {
  return Object.values(PRODUCTS).map(({ privateFile, releaseManifest, ...product }) => ({
    ...product,
    purchasable: isPurchasable({ ...product, privateFile, releaseManifest }),
  }));
}

export function publicCommercialOffers() {
  const commerciallyReleasedSets = Object.values(PRODUCTS).filter(isPurchasable).length;
  return publicOfferPlans({
    contentReadySets: upstreamCheckpoint.program_totals.complete_65_question_sets,
    commerciallyReleasedSets,
  });
}

export const ACTIVE_PROGRAM = PROGRAMS[0];
export const ACTIVE_PROGRAMS = PROGRAMS;
export const RELEASE_REGISTRY = registry;
