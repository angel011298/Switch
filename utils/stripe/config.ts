import Stripe from 'stripe';

const getStripeInstance = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';
  return new Stripe(key, {
    // https://github.com/stripe/stripe-node#configuration
    // @ts-ignore
    apiVersion: null,
    appInfo: {
      name: 'Next.js Subscription Starter',
      version: '0.0.0',
      url: 'https://github.com/vercel/nextjs-subscription-payments'
    }
  });
};

// Lazy singleton — only initialized when first accessed (not at module load/build time)
let _stripe: Stripe | null = null;
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = getStripeInstance();
    return (_stripe as any)[prop];
  }
});
