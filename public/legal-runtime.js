const containers = document.querySelectorAll("[data-business-details]");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function row(label, value, { email = false } = {}) {
  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  paragraph.append(strong);
  if (email) {
    const anchor = document.createElement("a");
    anchor.href = `mailto:${value}`;
    anchor.textContent = value;
    paragraph.append(anchor);
  } else {
    paragraph.append(document.createTextNode(value));
  }
  return paragraph;
}

function renderBusinessDetails(details, paymentMode) {
  const values = {
    legalSellerName: text(details?.legalSellerName),
    tradingName: text(details?.tradingName),
    principalGeographicAddress: text(details?.principalGeographicAddress),
    customerCareEmail: text(details?.customerCareEmail),
    customerCarePhone: text(details?.customerCarePhone),
    grievanceOfficerName: text(details?.grievanceOfficerName),
    grievanceEmail: text(details?.grievanceEmail),
    grievancePhone: text(details?.grievancePhone),
    businessTaxIdentifiers: text(details?.businessTaxIdentifiers),
  };
  if (Object.values(values).some(value => !value) || paymentMode !== "test") return;

  const notice = document.querySelector(".launch-notice");
  if (notice) {
    notice.textContent = "Controlled TEST mode only: one Set 01 listing may be exercised with Razorpay test credentials. No real payment or public production sale is authorized, and both bundles remain locked.";
  }

  for (const container of containers) {
    const fragment = document.createDocumentFragment();
    fragment.append(
      row("Legal seller", values.legalSellerName),
      row("Trading name", values.tradingName),
      row("Principal geographic address", values.principalGeographicAddress),
      row("Customer-care email", values.customerCareEmail, { email: true }),
      row("Customer-care telephone", values.customerCarePhone),
      row("Grievance officer", values.grievanceOfficerName),
      row("Grievance email", values.grievanceEmail, { email: true }),
      row("Grievance telephone", values.grievancePhone),
      row("Business/tax identifiers", values.businessTaxIdentifiers),
    );
    container.replaceChildren(fragment);
    container.classList.remove("pending");
    container.dataset.businessDetailsStatus = "verified";
  }
}

if (containers.length) {
  fetch("/api/catalog", { headers: { Accept: "application/json" } })
    .then(response => {
      if (!response.ok) throw new Error("Catalog unavailable");
      return response.json();
    })
    .then(data => renderBusinessDetails(data.commerce?.businessDetails, data.commerce?.paymentMode))
    .catch(() => {
      // The conservative server-rendered launch-blocker copy remains visible.
    });
}
