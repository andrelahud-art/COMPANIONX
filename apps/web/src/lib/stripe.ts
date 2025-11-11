import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Calculate platform fee (15% default)
 */
export function calculatePlatformFee(totalMXN: number): number {
  return Math.round(totalMXN * 0.15);
}

/**
 * Calculate companion payout after platform fee
 */
export function calculateCompanionPayout(totalMXN: number): number {
  const fee = calculatePlatformFee(totalMXN);
  return totalMXN - fee;
}
