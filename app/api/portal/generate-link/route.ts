/**
 * POST /api/portal/generate-link
 * ================================
 * Genera o renueva el token del portal para un cliente.
 * Requiere sesión autenticada del ERP.
 * Body: { customerId: string, days?: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { customerId, days = 30 } = await req.json();
  if (!customerId) {
    return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, tenantId: true, legalName: true, email: true },
  });

  if (!customer || customer.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // Upsert: si ya existe un token para este cliente, renovarlo
  const existing = await prisma.customerPortalToken.findFirst({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });

  let token: string;

  if (existing) {
    const updated = await prisma.customerPortalToken.update({
      where: { id: existing.id },
      data: { expiresAt },
    });
    token = updated.token;
  } else {
    const created = await prisma.customerPortalToken.create({
      data: { customerId, expiresAt },
    });
    token = created.token;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cifra-mx.vercel.app';
  const portalUrl = `${appUrl}/portal/${token}`;

  return NextResponse.json({ portalUrl, token, expiresAt });
}
