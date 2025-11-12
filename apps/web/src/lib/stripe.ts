import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | undefined;

function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  return stripeInstance;
}

// Export getter function and a stripe object for convenience
export const stripe = {
  get instance() {
    return getStripe();
  },
  // Proxy common methods to maintain backward compatibility
  get customers() {
    return getStripe().customers;
  },
  get paymentIntents() {
    return getStripe().paymentIntents;
  },
  get charges() {
    return getStripe().charges;
  },
  get refunds() {
    return getStripe().refunds;
  },
  get transfers() {
    return getStripe().transfers;
  },
  get accounts() {
    return getStripe().accounts;
  },
  get checkout() {
    return getStripe().checkout;
  },
};

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
