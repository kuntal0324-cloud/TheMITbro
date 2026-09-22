import test from "node:test";
import assert from "node:assert/strict";
import catalogHandler from "../api/catalog.js";
import createOrderHandler from "../api/create-order.js";
import verifyPaymentHandler from "../api/verify-payment.js";
import downloadHandler from "../api/download.js";

function responseRecorder() {
  const state = { statusCode: 200, headers: {}, body: null };
  const response = {
    setHeader(name, value) {
      state.headers[name.toLowerCase()] = value;
      return this;
    },
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    },
  };
  return { response, state };
}

test("catalog API exposes locked planned offers without private release fields", () => {
  const { response, state } = responseRecorder();
  catalogHandler({ method: "GET" }, response);
  assert.equal(state.statusCode, 200);
  assert.equal(state.body.success, true);
  assert.equal(state.body.products.length, 50);
  assert.equal(state.body.offers.length, 3);
  assert.ok(state.body.products.every(product => product.purchasable === false));
  assert.ok(state.body.offers.every(offer => offer.purchasable === false));
  assert.ok(state.body.products.every(product => !("privateFile" in product) && !("releaseManifest" in product)));
  assert.deepEqual(state.body.commerce, {
    activeProductId: null,
    paymentMode: null,
    testOnly: false,
    businessDetails: null,
  });
  assert.doesNotMatch(JSON.stringify(state.body), /private\/|releaseManifest|authorizationRecord/);
});

test("order, verification and download routes reject Set 01 before provider access", async () => {
  const order = responseRecorder();
  await createOrderHandler({ method: "POST", body: { paperId: "GATE_2027_EE_SET_01" } }, order.response);
  assert.equal(order.state.statusCode, 400);
  assert.equal(order.state.body.message, "Paper is not available for purchase.");

  const verification = responseRecorder();
  await verifyPaymentHandler({
    method: "POST",
    body: {
      paperId: "GATE_2027_EE_SET_01",
      razorpay_order_id: "order_test",
      razorpay_payment_id: "pay_test",
      razorpay_signature: "0".repeat(64),
    },
  }, verification.response);
  assert.equal(verification.state.statusCode, 400);
  assert.equal(verification.state.body.message, "Invalid or unreleased paper");

  const download = responseRecorder();
  downloadHandler({
    method: "GET",
    query: { paperId: "GATE_2027_EE_SET_01", token: "not-a-token" },
  }, download.response);
  assert.equal(download.state.statusCode, 404);
  assert.equal(download.state.body.message, "Paper not found or not released");
});
