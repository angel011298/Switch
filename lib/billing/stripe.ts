/**
 * Switch OS — Cliente Stripe (singleton)
 * =========================================
 * Instancia única de Stripe para toda la app.
 * Versión de API: 2024-04-10 (latest estable)
 */

import Stripe from 'stripe';

// Singleton para evitar múltiples instancias en hot-reload de Next.js
const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe;
}

export default stripe;
