const PAYMENT_MODES = new Set(["test", "live"]);

export function runtimePaymentMode(env = process.env) {
  const value = typeof env.THEMITBRO_PAYMENT_MODE === "string"
    ? env.THEMITBRO_PAYMENT_MODE.trim().toLowerCase()
    : "";
  return PAYMENT_MODES.has(value) ? value : null;
}

export function razorpayKeyMatchesMode(keyId, paymentMode) {
  if (typeof keyId !== "string" || !PAYMENT_MODES.has(paymentMode)) return false;
  const expectedPrefix = paymentMode === "test" ? "rzp_test_" : "rzp_live_";
  return keyId.startsWith(expectedPrefix) && keyId.length > expectedPrefix.length;
}

export function assertPaymentEnvironment({ env = process.env } = {}) {
  const paymentMode = runtimePaymentMode(env);
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!paymentMode) {
    return { valid: false, paymentMode: null, error: "Payment mode is not configured." };
  }
  if (!keyId || !keySecret) {
    return { valid: false, paymentMode, error: "Payment service configuration is unavailable." };
  }
  if (!razorpayKeyMatchesMode(keyId, paymentMode)) {
    return {
      valid: false,
      paymentMode,
      error: "Razorpay credentials do not match the authorized payment mode.",
    };
  }
  return { valid: true, paymentMode, keyId, keySecret };
}

export const AUTHORIZED_PAYMENT_MODES = Object.freeze([...PAYMENT_MODES]);
