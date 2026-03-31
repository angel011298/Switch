/**
 * GET  /api/portal/[token]/tickets — Lista tickets del cliente
 * POST /api/portal/[token]/tickets — Crea un nuevo ticket de soporte
 *
 * FASE 49: Portal del Cliente — Autoservicio Avanzado
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function validateToken(token: string) {
  const portalToken = await prisma.customerPortalToken.findUnique({
    where: { token },
    include: {
      customer: { select: { id: true, legalName: true, rfc: true, tenantId: true } },
    },
  });
  if (!portalToken || portalToken.expiresAt < new Date()) return null;
  return portalToken;
}

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const pt = await validateToken(params.token);
  if (!pt) return NextResponse.json({ error: 'Enlace no válido' }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: {
      tenantId:   pt.customer.tenantId,
      customerId: pt.customer.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id:          true,
      title:       true,
      status:      true,
      priority:    true,
      createdAt:   true,
      updatedAt:   true,
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: 'asc' },
        select: {
          id:         true,
          authorName: true,
          body:       true,
          createdAt:  true,
          isInternal: true,
        },
      },
    },
  });

  return NextResponse.json({ tickets });
}

// ─── POST ───────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const pt = await validateToken(params.token);
  if (!pt) return NextResponse.json({ error: 'Enlace no válido' }, { status: 401 });

  let title: string, description: string;
  try {
    const body = await req.json();
    title       = String(body.title ?? '').trim();
    description = String(body.description ?? '').trim();
    if (!title) throw new Error();
  } catch {
    return NextResponse.json({ error: 'title requerido' }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId:    pt.customer.tenantId,
      customerId:  pt.customer.id,
      title,
      description,
      status:      'OPEN',
      priority:    'MEDIUM',
      messages: description ? {
        create: {
          authorName: pt.customer.legalName,
          body:       description,
          isInternal: false,
        },
      } : undefined,
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
