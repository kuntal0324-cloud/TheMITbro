export const PRODUCTS = Object.freeze({
  GATE_EE_SET_A: { id: "GATE_EE_SET_A", title: "GATE EE — Free Sample Set A", exam: "GATE EE", priceRupees: 0, status: "available", publicPath: "/paper/GATE_EE_SET_A.pdf" },
  GATE_EE_SET_B: { id: "GATE_EE_SET_B", title: "GATE EE — Mock Set B", exam: "GATE EE", priceRupees: 500, status: "available", privateFile: "GATE_EE_SET_B.pdf" },
  GATE_EE_SET_C: { id: "GATE_EE_SET_C", title: "GATE EE — Mock Set C", exam: "GATE EE", priceRupees: 500, status: "available", privateFile: "GATE_EE_SET_C.pdf" },
  JEE_MATHS_PREM_1: { id: "JEE_MATHS_PREM_1", title: "JEE Mathematics — Mock Set 1", exam: "JEE Mathematics", priceRupees: 500, status: "coming_soon" },
  JEE_MATHS_PREM_2: { id: "JEE_MATHS_PREM_2", title: "JEE Mathematics — Mock Set 2", exam: "JEE Mathematics", priceRupees: 500, status: "coming_soon" },
  JEE_PHYSICS_PREM_1: { id: "JEE_PHYSICS_PREM_1", title: "JEE Physics — Mock Set 1", exam: "JEE Physics", priceRupees: 500, status: "coming_soon" },
  JEE_PHYSICS_PREM_2: { id: "JEE_PHYSICS_PREM_2", title: "JEE Physics — Mock Set 2", exam: "JEE Physics", priceRupees: 500, status: "coming_soon" },
});
export function getProduct(id) { return PRODUCTS[id] || null; }
export function publicCatalog() { return Object.values(PRODUCTS).map(({privateFile,...p}) => p); }
