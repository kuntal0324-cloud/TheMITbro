import { readFileSync } from "node:fs";
import { hasCommercialReleaseFields, validateReleaseIntegrity } from "./release-integrity.js";
import { assertPaymentEnvironment } from "./payment-mode.js";
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
  const payment = assertPaymentEnvironment();
  return Boolean(
    payment.valid &&
    hasCommercialReleaseFields(product) &&
    validateReleaseIntegrity(product, { paymentMode: payment.paymentMode }).valid
  );
}

export function publicCatalog() {
  const payment = assertPaymentEnvironment();
  return Object.values(PRODUCTS).map(({ privateFile, releaseManifest, ...product }) => {
    const integrity = payment.valid
      ? validateReleaseIntegrity(
        { ...product, privateFile, releaseManifest },
        { paymentMode: payment.paymentMode },
      )
      : { valid: false, manifest: null };
    return {
      ...product,
      purchasable: integrity.valid,
      paymentMode: integrity.valid
        ? integrity.manifest?.commercial_authorization?.payment_mode ?? null
        : null,
    };
  });
}

export function publicCommerceState() {
  const payment = assertPaymentEnvironment();
  if (!payment.valid) {
    return {
      activeProductId: null,
      paymentMode: null,
      testOnly: false,
      businessDetails: null,
    };
  }
  for (const product of Object.values(PRODUCTS)) {
    const integrity = validateReleaseIntegrity(product, { paymentMode: payment.paymentMode });
    if (!integrity.valid) continue;
    const seller = integrity.authorizationRecord?.seller_identity || {};
    return {
      activeProductId: product.id,
      paymentMode: integrity.manifest.commercial_authorization.payment_mode,
      testOnly: integrity.manifest.commercial_authorization.payment_mode === "test",
      businessDetails: {
        legalSellerName: seller.legal_seller_name,
        tradingName: seller.trading_name,
        principalGeographicAddress: seller.principal_geographic_address,
        customerCareEmail: seller.customer_care_email,
        customerCarePhone: seller.customer_care_phone,
        grievanceOfficerName: seller.grievance_officer_name,
        grievanceEmail: seller.grievance_email,
        grievancePhone: seller.grievance_phone,
        businessTaxIdentifiers: seller.business_tax_identifiers,
      },
    };
  }
  return {
    activeProductId: null,
    paymentMode: null,
    testOnly: false,
    businessDetails: null,
  };
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
