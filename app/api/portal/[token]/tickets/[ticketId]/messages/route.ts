/**
 * POST /api/portal/[token]/tickets/[ticketId]/messages
 * =====================================================
 * Agrega un mensaje del cliente a un ticket de soporte.
 *
 * FASE 49: Portal del Cliente — Autoservicio Avanzado
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string; ticketId: string } }
) {
  // Validar token
  const portalToken = await prisma.customerPortalToken.findUnique({
    where: { token: params.token },
    include: {
      customer: { select: { id: true, legalName: true, tenantId: true } },
    },
  });
  if (!portalToken || portalToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Enlace no válido' }, { status: 401 });
  }

  // Validar que el ticket pertenece a este cliente
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id:         params.ticketId,
      tenantId:   portalToken.customer.tenantId,
      customerId: portalToken.customer.id,
    },
    select: { id: true, status: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  }

  let body: string;
  try {
    const json = await req.json();
    body = String(json.body ?? '').trim();
    if (!body) throw new Error();
  } catch {
    return NextResponse.json({ error: 'body requerido' }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId:   ticket.id,
      authorName: portalToken.customer.legalName,
      body,
      isInternal: false,
    },
    select: { id: true, authorName: true, body: true, createdAt: true },
  });

  // Reabrir ticket si estaba cerrado
  if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'OPEN' },
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
