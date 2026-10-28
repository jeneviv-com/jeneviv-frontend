/**
 * Jeneviv platform fee, shown to merchants and payers.
 *
 * Mirrors the backend schedule in src/lib/fees.ts. If that schedule changes,
 * change it here too so the wording and the maths stay in step.
 *
 *   up to N7,500  -> N75 flat
 *   above N7,500  -> 1% of the collection, never below N75
 *   capped at     -> N1,000
 */

export const PLATFORM_FEE_FLAT_NGN = 75;
export const PLATFORM_FEE_THRESHOLD_NGN = 7_500;
export const PLATFORM_FEE_PERCENT = 1;
export const PLATFORM_FEE_CAP_NGN = 1_000;

/** Platform fee for a collection amount in naira. */
export function platformFeeNgn(amount: number): number {
  if (amount <= PLATFORM_FEE_THRESHOLD_NGN) return PLATFORM_FEE_FLAT_NGN;
  const percent = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
  return Math.min(PLATFORM_FEE_CAP_NGN, Math.max(PLATFORM_FEE_FLAT_NGN, percent));
}

/** Short range for headline figures, e.g. "₦75 – ₦1,000". */
export const PLATFORM_FEE_RANGE_LABEL = `₦${PLATFORM_FEE_FLAT_NGN} – ₦${PLATFORM_FEE_CAP_NGN.toLocaleString("en-NG")}`;

/** One sentence for explanations, e.g. "₦75 up to ₦7,500, then 1%, capped at ₦1,000". */
export const PLATFORM_FEE_SUMMARY =
  `₦${PLATFORM_FEE_FLAT_NGN} up to ₦${PLATFORM_FEE_THRESHOLD_NGN.toLocaleString("en-NG")}, ` +
  `then ${PLATFORM_FEE_PERCENT}%, capped at ₦${PLATFORM_FEE_CAP_NGN.toLocaleString("en-NG")}`;