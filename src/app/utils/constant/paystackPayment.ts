// export const PAYSTACK_PUBLIC_KEY =
//   "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// Paystack configuration
export const PAYSTACK_PUBLIC_KEY =
  "pk_live_d2b967eddda456841f504b85549767fc33cc9fd4";
export const PAYSTACK_TEST_KEY =
  'pk_test_db0145199289f83c428d57cf70755142bb0b8b28"';

// GBP to NGN conversion (update periodically or fetch live)
export const GBP_TO_NGN_RATE = 2050;

export const convertGBPtoKobo = (gbpAmount: string): number => {
  const naira = parseFloat(gbpAmount) * GBP_TO_NGN_RATE;
  return Math.round(naira * 100); // Paystack uses kobo (lowest unit)
};
