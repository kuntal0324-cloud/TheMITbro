import test from "node:test";
import assert from "node:assert/strict";
import {
  assertPaymentEnvironment,
  razorpayKeyMatchesMode,
  runtimePaymentMode,
} from "../api/_lib/payment-mode.js";

test("runtime payment mode accepts only explicit test or live values", () => {
  assert.equal(runtimePaymentMode({ THEMITBRO_PAYMENT_MODE: " TEST " }), "test");
  assert.equal(runtimePaymentMode({ THEMITBRO_PAYMENT_MODE: "live" }), "live");
  assert.equal(runtimePaymentMode({}), null);
  assert.equal(runtimePaymentMode({ THEMITBRO_PAYMENT_MODE: "production" }), null);
});

test("Razorpay key prefix must match the declared payment mode", () => {
  assert.equal(razorpayKeyMatchesMode("rzp_test_example", "test"), true);
  assert.equal(razorpayKeyMatchesMode("rzp_live_example", "live"), true);
  assert.equal(razorpayKeyMatchesMode("rzp_live_example", "test"), false);
  assert.equal(razorpayKeyMatchesMode("rzp_test_example", "live"), false);
});

test("payment environment rejects missing and cross-mode credentials", () => {
  assert.equal(assertPaymentEnvironment({ env: {} }).valid, false);
  assert.equal(assertPaymentEnvironment({
    env: {
      THEMITBRO_PAYMENT_MODE: "test",
      RAZORPAY_KEY_ID: "rzp_live_wrong",
      RAZORPAY_KEY_SECRET: "secret",
    },
  }).valid, false);
  assert.deepEqual(assertPaymentEnvironment({
    env: {
      THEMITBRO_PAYMENT_MODE: "test",
      RAZORPAY_KEY_ID: "rzp_test_example",
      RAZORPAY_KEY_SECRET: "secret",
    },
  }), {
    valid: true,
    paymentMode: "test",
    keyId: "rzp_test_example",
    keySecret: "secret",
  });
});
