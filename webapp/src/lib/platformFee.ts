/**
 * Platform fee configuration and labels
 * 
 * Jeneviv charges a platform fee on top of the gateway (Paystack) processing fee.
 * The platform fee is charged to the payer as part of the total transaction cost.
 */

/**
 * Platform fee range displayed to merchants
 */
export const PLATFORM_FEE_RANGE_LABEL = "1.4% + ₦100";

/**
 * Summary description of the platform fee structure
 */
export const PLATFORM_FEE_SUMMARY = "Charged to payer on top of gateway fees";

/**
 * Calculate platform fee for a given amount
 * @param amount - Transaction amount in kobo (smallest currency unit)
 * @returns Platform fee in kobo
 */
export function calculatePlatformFee(amount: number): number {
  // 1.4% of amount + ₦100 (10000 kobo)
  return Math.round(amount * 0.014) + 10000;
}
