'use server';

/**
 * Switch OS — Stripe Billing Actions (FASE 22)
 * ==============================================
 * createCheckoutSession : genera URL de pago en Stripe Checkout
 * createPortalSession   : abre el Stripe Customer Portal para gestionar sub.
 * getCurrentSubscription: estado actual del plan del tenant
 */

import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import stripe from '@/lib/billing/stripe';
import { PLANS, getPlanBySlug, type PlanSlug } from '@/lib/billing/plans';
import prisma from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.switchos.mx';

// ─── Crear sesión de Checkout ─────────────────────────────────────────────────

export async function createCheckoutSession(
  planSlug: PlanSlug,
  billing: 'monthly' | 'annual'
): Promise<{ url: string }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const plan = getPlanBySlug(planSlug);
  if (!plan) throw new Error('Plan no encontrado');

  const priceId = billing === 'annual'
    ? plan.stripePriceAnnual
    : plan.stripePriceMonthly;

  if (!priceId) {
    throw new Error(`Price ID no configurado para el plan ${planSlug}/${billing}. Configura STRIPE_PRICE_* en variables de entorno.`);
  }

  // Obtener o crear el stripeCustomerId del tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { stripeCustomerId: true, name: true, rfc: true },
  });

  let customerId = tenant?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    session.email,
      name:     tenant?.name ?? session.name,
      metadata: { tenantId: session.tenantId, rfc: tenant?.rfc ?? '' },
    });
    customerId = customer.id;

    await prisma.tenant.update({
      where: { id: session.tenantId },
      data:  { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items:           [{ price: priceId, quantity: 1 }],
    metadata:             { tenantId: session.tenantId, planSlug, billing },
    success_url:          `${APP_URL}/billing/subscription?success=1&plan=${planSlug}`,
    cancel_url:           `${APP_URL}/billing/subscription?canceled=1`,
    subscription_data: {
      trial_period_days: 14,
      metadata:          { tenantId: session.tenantId },
    },
    locale: 'es',
  });

  if (!checkoutSession.url) throw new Error('No se pudo crear la sesión de checkout');
  return { url: checkoutSession.url };
}

// ─── Abrir Stripe Customer Portal ────────────────────────────────────────────

export async function createPortalSession(): Promise<{ url: string }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { stripeCustomerId: true },
  });

  if (!tenant?.stripeCustomerId) {
    throw new Error('No tienes una suscripción activa. Elige un plan primero.');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   tenant.stripeCustomerId,
    return_url: `${APP_URL}/billing/subscription`,
  });

  return { url: portalSession.url };
}

// ─── Obtener suscripción actual ───────────────────────────────────────────────

export async function getCurrentSubscription() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const [sub, tenant] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId: session.tenantId },
      select: {
        planId:                 true,
        status:                 true,
        validUntil:             true,
        trialEnds:              true,
        stripeSubscriptionId:   true,
        stripeCurrentPeriodEnd: true,
      },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { stripeCustomerId: true },
    }),
  ]);

  return {
    planId:                 sub?.planId ?? null,
    status:                 sub?.status ?? 'TRIAL',
    validUntil:             sub?.validUntil ?? null,
    trialEnds:              sub?.trialEnds ?? null,
    stripeSubscriptionId:   sub?.stripeSubscriptionId ?? null,
    stripeCurrentPeriodEnd: sub?.stripeCurrentPeriodEnd ?? null,
    hasStripe:              !!tenant?.stripeCustomerId,
    planDetails:            getPlanBySlug(sub?.planId ?? '') ?? null,
    allPlans:               PLANS,
  };
}

// ─── Legacy SPEI (compatibilidad con PendingPaymentsPanel) ───────────────────

import { revalidatePath } from 'next/cache';

export async function approvePaymentProof(
  proofId: string,
  days: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const proof = await prisma.paymentProof.findUnique({
      where: { id: proofId },
      select: { tenantId: true },
    });
    if (!proof) return { ok: false, error: 'Comprobante no encontrado' };

    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + days);

    await prisma.$transaction([
      prisma.paymentProof.update({
        where: { id: proofId },
        data:  { status: 'APPROVED' },
      }),
      prisma.subscription.upsert({
        where:  { tenantId: proof.tenantId },
        create: { tenantId: proof.tenantId, status: 'ACTIVE', validUntil: newValidUntil },
        update: { status: 'ACTIVE', validUntil: newValidUntil },
      }),
    ]);

    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Error al aprobar el pago' };
  }
}

export async function rejectPaymentProof(
  proofId: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.paymentProof.update({
      where: { id: proofId },
      data:  { status: 'REJECTED', rejectionNote: note },
    });
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Error al rechazar el pago' };
  }
}
