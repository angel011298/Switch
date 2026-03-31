/**
 * CIFRA — Webhook de Stripe
 * ================================
 * Maneja eventos del ciclo de vida de suscripciones.
 *
 * Eventos procesados:
 *   checkout.session.completed    → activa suscripción post-pago
 *   customer.subscription.updated → sincroniza plan y estado
 *   customer.subscription.deleted → marca como CANCELED
 *   invoice.payment_failed        → marca como PAST_DUE + notifica
 *
 * Seguridad: verifica firma HMAC con STRIPE_WEBHOOK_SECRET.
 * Idempotencia: upsert en Subscription — seguro ante reintentos.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/billing/stripe';
import { getPlanByPriceId } from '@/lib/billing/plans';
import prisma from '@/lib/prisma';

// Raw body es necesario para verificar la firma de Stripe
export const dynamic = 'force-dynamic';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toSubscriptionStatus(
  stripeStatus: Stripe.Subscription['status']
): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' {
  switch (stripeStatus) {
    case 'active':           return 'ACTIVE';
    case 'trialing':         return 'TRIAL';
    case 'past_due':         return 'PAST_DUE';
    case 'unpaid':           return 'SUSPENDED';
    case 'canceled':         return 'CANCELED';
    case 'incomplete':       return 'PAST_DUE';
    case 'incomplete_expired': return 'CANCELED';
    case 'paused':           return 'SUSPENDED';
    default:                 return 'SUSPENDED';
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string'
    ? sub.customer
    : sub.customer.id;

  // Buscar tenant por stripeCustomerId
  const tenant = await prisma.tenant.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!tenant) {
    console.warn(`[stripe-webhook] No se encontró tenant para customer ${customerId}`);
    return;
  }

  const firstItem = sub.items.data[0];
  const priceId   = firstItem?.price.id ?? null;
  const plan      = priceId ? getPlanByPriceId(priceId) : null;
  const status    = toSubscriptionStatus(sub.status);
  // current_period_end está en el item en Stripe API v20
  const rawPeriodEnd = firstItem?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : new Date(Date.now() + 30 * 24 * 3600 * 1000);

  // Upsert suscripción
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId:               tenant.id,
      planId:                 plan?.slug ?? 'standard',
      status,
      stripeSubscriptionId:   sub.id,
      stripePriceId:          priceId,
      stripeCurrentPeriodEnd: periodEnd,
      validUntil:             periodEnd,
    },
    update: {
      planId:                 plan?.slug ?? 'standard',
      status,
      stripeSubscriptionId:   sub.id,
      stripePriceId:          priceId,
      stripeCurrentPeriodEnd: periodEnd,
      validUntil:             periodEnd,
    },
  });

  // Actualizar módulos activos según el plan
  if (plan && (status === 'ACTIVE' || status === 'TRIAL')) {
    // Desactivar todos los módulos del tenant
    await prisma.tenantModule.updateMany({
      where: { tenantId: tenant.id },
      data:  { isActive: false },
    });

    // Activar solo los del plan
    for (const moduleKey of plan.modules) {
      await prisma.tenantModule.upsert({
        where:  { tenantId_moduleKey: { tenantId: tenant.id, moduleKey } },
        update: { isActive: true },
        create: { tenantId: tenant.id, moduleKey, isActive: true },
      });
    }
  }

  console.log(`[stripe-webhook] Sync OK | tenant=${tenant.id} | plan=${plan?.slug} | status=${status}`);
}

// ── Handler principal ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body      = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET no configurado');
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('[stripe-webhook] Firma inválida:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Checkout completado: asociar customerId al tenant ─────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId    = session.metadata?.tenantId;
        const invoiceId   = session.metadata?.invoiceId; // FASE 49: pago portal
        const customerId  = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;

        // ── FASE 49: Pago de factura desde portal ────────────────────────────
        if (invoiceId && session.payment_status === 'paid') {
          const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAt:                new Date(),
              stripePaymentIntentId: paymentIntentId,
            },
          }).catch((e) => console.warn('[stripe-webhook] No se pudo marcar factura pagada:', e));

          console.log(`[stripe-webhook] Factura ${invoiceId} marcada como pagada`);
          break; // no procesar como suscripción
        }

        if (tenantId && customerId) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data:  { stripeCustomerId: customerId },
          });
        }

        // Si tiene suscripción, sincronizar
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          );
          await syncSubscription(sub);
        }
        break;
      }

      // ── Suscripción creada o modificada ───────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }

      // ── Suscripción cancelada ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub); // status=CANCELED
        break;
      }

      // ── Pago fallido ──────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id ?? null;

        if (customerId) {
          const tenant = await prisma.tenant.findUnique({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          });

          if (tenant) {
            await prisma.subscription.updateMany({
              where: { tenantId: tenant.id },
              data:  { status: 'PAST_DUE' },
            });
          }
        }
        break;
      }

      default:
        // Ignorar eventos no manejados
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error(`[stripe-webhook] Error procesando ${event.type}:`, err);
    // Retornar 500 para que Stripe reintente
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}
