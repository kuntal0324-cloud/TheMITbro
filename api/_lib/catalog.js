const PROGRAM = Object.freeze({
  examFamily: "GATE",
  examYear: 2027,
  paperCode: "EE",
  branch: "Electrical Engineering",
  setCount: 50,
});

function plannedProduct(setNumber) {
  const number = String(setNumber).padStart(2, "0");
  return Object.freeze({
    id: `GATE_2027_EE_SET_${number}`,
    title: `GATE 2027 EE — Mock Set ${number}`,
    ...PROGRAM,
    setNumber,
    priceRupees: null,
    status: "under_review",
    releaseManifest: null,
    privateFile: null,
  });
}

// This shape is branch-neutral: add another program by constructing products
// with a different paperCode/branch. GATE 2027 EE is the only active scope.
export const PRODUCTS = Object.freeze(Object.fromEntries(
  Array.from({ length: PROGRAM.setCount }, (_, index) => plannedProduct(index + 1))
    .map(product => [product.id, product]),
));

export function getProduct(id) {
  return PRODUCTS[id] || null;
}

export function isPurchasable(product) {
  return Boolean(
    product &&
    product.status === "released" &&
    product.releaseManifest &&
    product.privateFile &&
    Number.isInteger(product.priceRupees) &&
    product.priceRupees > 0
  );
}

export function publicCatalog() {
  return Object.values(PRODUCTS).map(({ privateFile, releaseManifest, ...product }) => ({
    ...product,
    purchasable: isPurchasable({ ...product, privateFile, releaseManifest }),
  }));
}

export const ACTIVE_PROGRAM = PROGRAM;
