/**
 * POST /api/portal/[token]/pay
 * =====================================
 * Crea una sesión de Stripe Checkout para que el cliente
 * pague una factura directamente desde el portal.
 *
 * Body: { invoiceId: string }
 * Returns: { checkoutUrl: string }
 *
 * FASE 49: Portal del Cliente — Autoservicio Avanzado
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Pago online no configurado. Contacta al proveedor.' },
      { status: 503 }
    );
  }

  let invoiceId: string;
  try {
    const body = await req.json();
    invoiceId = body.invoiceId;
    if (!invoiceId) throw new Error('invoiceId requerido');
  } catch {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // Validar token del portal
  const portalToken = await prisma.customerPortalToken.findUnique({
    where: { token: params.token },
    include: { customer: { select: { id: true, legalName: true, rfc: true, tenantId: true } } },
  });

  if (!portalToken || portalToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Enlace no válido o expirado' }, { status: 401 });
  }

  const { customer } = portalToken;

  // Cargar factura y validar que pertenece al cliente
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: customer.tenantId,
      receptorRfc: customer.rfc,
    },
    select: {
      id: true,
      serie: true,
      folio: true,
      total: true,
      moneda: true,
      paidAt: true,
      items: { select: { descripcion: true }, take: 1 },
      tenant: { select: { name: true, legalName: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
  }

  if (invoice.paidAt) {
    return NextResponse.json({ error: 'Esta factura ya fue pagada' }, { status: 409 });
  }

  // Crear Stripe Checkout session — lazy import para no crashear si no hay key
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover' as any,
  });

  const folio = `${invoice.serie ?? 'A'}${invoice.folio}`;
  const concepto = invoice.items[0]?.descripcion ?? 'Servicios profesionales';
  const tenantName = invoice.tenant.legalName ?? invoice.tenant.name;
  const total = Math.round(Number(invoice.total) * 100); // centavos

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cifra-mx.vercel.app';
  const portalUrl = `${siteUrl}/portal/${params.token}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: invoice.moneda.toLowerCase(),
          product_data: {
            name: `Factura ${folio} — ${tenantName}`,
            description: concepto,
          },
          unit_amount: total,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${portalUrl}?paid=1&invoice=${invoiceId}`,
    cancel_url:  `${portalUrl}?cancelled=1`,
    metadata: {
      invoiceId:  invoice.id,
      tenantId:   customer.tenantId,
      customerId: customer.id,
      portalToken: params.token,
    },
    customer_email: undefined, // omit to let Stripe ask for it
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
