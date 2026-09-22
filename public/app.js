const root = document.getElementById("products");
const summary = document.getElementById("program-summary");
const more = document.getElementById("more");
const publishedCount = document.getElementById("published-count");
const commerceStatus = document.getElementById("commerce-status");
const commerceReason = document.getElementById("commerce-reason");
const paymentStatus = document.getElementById("payment-status");
const offersRoot = document.getElementById("offers");
const launchNotice = document.getElementById("launch-notice");
let razorpayLoader = null;

function setPaymentStatus(message = "", type = "") {
  paymentStatus.textContent = message;
  paymentStatus.className = `payment-status${type ? ` ${type}` : ""}`;
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: "The server returned an unreadable response." };
  }
  if (!response.ok || !data.success) {
    throw new Error(data.message || "The request could not be completed.");
  }
  return data;
}

function loadRazorpayCheckout() {
  if (typeof window.Razorpay === "function") return Promise.resolve();
  if (razorpayLoader) return razorpayLoader;

  razorpayLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.Razorpay === "function") resolve();
      else reject(new Error("Secure checkout did not initialize. Please try again."));
    };
    script.onerror = () => reject(new Error("Secure checkout is temporarily unavailable. Please try again."));
    document.head.append(script);
  }).catch(error => {
    razorpayLoader = null;
    throw error;
  });

  return razorpayLoader;
}

async function beginPurchase(product, button) {
  if (!product.purchasable || button.disabled) return;
  button.disabled = true;
  setPaymentStatus(`Preparing secure checkout for ${product.title}…`);

  try {
    await loadRazorpayCheckout();
    const order = await jsonRequest("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId: product.id }),
    });
    const testOnly = order.paymentMode === "test" && order.testOnly === true;
    const checkout = new window.Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: testOnly ? "TheMITbro · TEST MODE" : "TheMITbro",
      description: testOnly ? `[NO REAL PAYMENT] ${order.title}` : order.title,
      order_id: order.orderId,
      handler: async payment => {
        try {
          setPaymentStatus("Payment received. Verifying the captured payment…");
          const verified = await jsonRequest("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payment, paperId: product.id }),
          });
          setPaymentStatus(
            verified.testOnly
              ? "Test payment verified. Your signed test download is starting."
              : "Payment verified. Your signed download is starting.",
            "success",
          );
          window.location.assign(verified.downloadUrl);
        } catch (error) {
          setPaymentStatus(error.message, "error");
          button.disabled = false;
        }
      },
      modal: {
        ondismiss: () => {
          setPaymentStatus("Checkout closed. No download was issued.");
          button.disabled = false;
        },
      },
      theme: { color: "#185adb" },
    });
    checkout.on("payment.failed", response => {
      const message = response?.error?.description || "Payment failed. No download was issued.";
      setPaymentStatus(message, "error");
      button.disabled = false;
    });
    checkout.open();
  } catch (error) {
    setPaymentStatus(error.message, "error");
    button.disabled = false;
  }
}

function productCard(product) {
  const article = document.createElement("article");
  article.className = "card";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = `${product.paperCode} · SET ${String(product.setNumber).padStart(2, "0")}`;

  const heading = document.createElement("h3");
  heading.textContent = product.title;

  const details = document.createElement("p");
  details.textContent = "65 questions · 100 marks · 180 minutes";

  const price = document.createElement("p");
  price.className = "planned-price";
  price.textContent = product.purchasable
    ? `Released price · ₹${product.priceRupees.toLocaleString("en-IN")}`
    : `Planned individual price · ₹${product.plannedPriceRupees.toLocaleString("en-IN")}`;

  const button = document.createElement("button");
  button.className = "btn";
  button.type = "button";
  button.disabled = !product.purchasable;
  button.textContent = product.purchasable
    ? `${product.paymentMode === "test" ? "Test purchase" : "Purchase"} · ₹${product.priceRupees.toLocaleString("en-IN")}`
    : "Not on sale";
  if (product.purchasable) {
    button.addEventListener("click", () => beginPurchase(product, button));
  }

  article.append(tag, heading, details, price, button);
  return article;
}

function offerCard(offer) {
  const article = document.createElement("article");
  article.className = "card offer-card";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = offer.paperCount === 1 ? "PLANNED · SINGLE PAPER" : `PLANNED · ${offer.paperCount} PAPERS`;

  const heading = document.createElement("h3");
  heading.textContent = offer.title;

  const price = document.createElement("p");
  price.className = "offer-price";
  price.textContent = `₹${offer.plannedPriceRupees.toLocaleString("en-IN")}`;

  const unit = document.createElement("p");
  unit.textContent = `₹${offer.effectivePriceRupees.toFixed(2)} per paper`;

  const saving = document.createElement("p");
  saving.className = "saving";
  saving.textContent = offer.savingsRupees > 0
    ? `Save ₹${offer.savingsRupees.toLocaleString("en-IN")} (${offer.savingsPercent.toFixed(2)}%) compared with ${offer.paperCount} individual papers.`
    : "Each paper is purchased only after its exact release is approved.";

  const progress = document.createElement("p");
  progress.className = "inventory-progress";
  progress.textContent = `${offer.contentReadySets}/${offer.paperCount} complete papers ready · ${offer.commerciallyReleasedSets}/${offer.paperCount} commercially released`;

  const button = document.createElement("button");
  button.className = "btn";
  button.type = "button";
  button.disabled = true;
  button.textContent = offer.status === "inventory_locked"
    ? "Inventory locked"
    : offer.status === "available_via_listings"
      ? "Choose a released paper below"
      : "Commercial launch pending";

  article.append(tag, heading, price, unit, saving, progress, button);
  return article;
}

async function loadCatalog() {
  try {
    const data = await jsonRequest("/api/catalog");
    const products = data.products;
    const offers = data.offers;
    const commerce = data.commerce || {};
    const released = products.filter(product => product.purchasable).length;
    summary.textContent = `${products.length} planned · ${released} released · ${products.length - released} under review`;
    publishedCount.textContent = String(released);
    commerceStatus.textContent = released ? "Available" : "Blocked";
    commerceStatus.className = released ? "available" : "blocked";
    commerceReason.textContent = released
      ? commerce.testOnly ? "Controlled test mode only" : "Integrity-verified listings only"
      : "Commercial approval pending";
    if (released && commerce.testOnly) {
      launchNotice.textContent = "CONTROLLED TEST MODE ONLY. Razorpay test credentials are required; no real payment or public sale is authorized. The 20-paper and 50-paper packs remain locked.";
    }
    offersRoot.replaceChildren(...offers.map(offerCard));
    root.replaceChildren(...products.slice(0, 6).map(productCard));
    more.textContent = products.length > 6
      ? `Plus ${products.length - 6} additional planned sets. Unreleased listings remain locked.`
      : "";
  } catch {
    summary.textContent = "Catalog temporarily unavailable.";
    root.textContent = "Please try again later.";
    commerceReason.textContent = "Catalog unavailable";
    offersRoot.textContent = "Planned pricing is temporarily unavailable.";
  }
}

const modal = document.getElementById("development-modal");
try {
  if (!localStorage.getItem("tmb-development-notice-v2")) modal.hidden = false;
} catch {
  modal.hidden = false;
}
document.getElementById("modal-close").addEventListener("click", () => {
  try {
    localStorage.setItem("tmb-development-notice-v2", "seen");
  } catch {
    // Storage may be unavailable in private browsing; closing still works.
  }
  modal.hidden = true;
});

loadCatalog();
