const root = document.getElementById("products");
const summary = document.getElementById("program-summary");
const more = document.getElementById("more");
const publishedCount = document.getElementById("published-count");
const commerceStatus = document.getElementById("commerce-status");
const commerceReason = document.getElementById("commerce-reason");
const paymentStatus = document.getElementById("payment-status");

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

async function beginPurchase(product, button) {
  if (!product.purchasable || button.disabled) return;
  button.disabled = true;
  setPaymentStatus(`Preparing secure checkout for ${product.title}…`);

  try {
    if (typeof window.Razorpay !== "function") {
      throw new Error("Secure checkout is temporarily unavailable. Please try again.");
    }
    const order = await jsonRequest("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId: product.id }),
    });
    const checkout = new window.Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: "TheMITbro",
      description: order.title,
      order_id: order.orderId,
      handler: async payment => {
        try {
          setPaymentStatus("Payment received. Verifying the captured payment…");
          const verified = await jsonRequest("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payment, paperId: product.id }),
          });
          setPaymentStatus("Payment verified. Your signed download is starting.", "success");
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

  const button = document.createElement("button");
  button.className = "btn";
  button.type = "button";
  button.disabled = !product.purchasable;
  button.textContent = product.purchasable
    ? `Purchase · ₹${product.priceRupees.toLocaleString("en-IN")}`
    : "Under review";
  if (product.purchasable) {
    button.addEventListener("click", () => beginPurchase(product, button));
  }

  article.append(tag, heading, details, button);
  return article;
}

async function loadCatalog() {
  try {
    const data = await jsonRequest("/api/catalog");
    const products = data.products;
    const released = products.filter(product => product.purchasable).length;
    summary.textContent = `${products.length} planned · ${released} released · ${products.length - released} under review`;
    publishedCount.textContent = String(released);
    commerceStatus.textContent = released ? "Available" : "Blocked";
    commerceStatus.className = released ? "available" : "blocked";
    commerceReason.textContent = released ? "Integrity-verified listings only" : "Commercial approval pending";
    root.replaceChildren(...products.slice(0, 6).map(productCard));
    more.textContent = products.length > 6
      ? `Plus ${products.length - 6} additional planned sets. Unreleased listings remain locked.`
      : "";
  } catch {
    summary.textContent = "Catalog temporarily unavailable.";
    root.textContent = "Please try again later.";
    commerceReason.textContent = "Catalog unavailable";
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
