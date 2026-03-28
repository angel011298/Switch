/**
 * GET /api/portal/[token]/invoices
 * =================================
 * Devuelve las facturas del cliente asociado al token.
 * Ruta pública — no requiere sesión del ERP.
 * Valida que el token exista y no haya expirado.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const portalToken = await prisma.customerPortalToken.findUnique({
    where: { token: params.token },
    include: {
      customer: {
        select: {
          id: true,
          legalName: true,
          rfc: true,
          email: true,
          tenantId: true,
        },
      },
    },
  });

  if (!portalToken) {
    return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 });
  }

  if (portalToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Enlace expirado' }, { status: 410 });
  }

  // Actualizar lastAccessAt
  await prisma.customerPortalToken.update({
    where: { id: portalToken.id },
    data: { lastAccessAt: new Date() },
  }).catch(() => {});

  const { customer } = portalToken;

  // Traer facturas del cliente
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: customer.tenantId,
      receptorRfc: customer.rfc,
    },
    orderBy: { fechaEmision: 'desc' },
    take: 100,
    select: {
      id: true,
      serie: true,
      folio: true,
      fechaEmision: true,
      status: true,
      total: true,
      moneda: true,
      uuid: true,
      items: { select: { descripcion: true }, take: 1 },
    },
  });

  // Traer datos del tenant emisor
  const tenant = await prisma.tenant.findUnique({
    where: { id: customer.tenantId },
    select: { name: true, legalName: true, rfc: true, logoUrl: true },
  });

  // Calcular totales
  const statusMap: Record<string, 'PAGADA' | 'PENDIENTE' | 'CANCELADA'> = {
    STAMPED: 'PAGADA',
    DRAFT: 'PENDIENTE',
    SEALED: 'PENDIENTE',
    CANCELLED: 'CANCELADA',
    ERROR: 'PENDIENTE',
  };

  const mapped = invoices.map((inv) => ({
    id: inv.id,
    folio: `${inv.serie ?? 'A'}${inv.folio}`,
    fecha: inv.fechaEmision,
    concepto: inv.items[0]?.descripcion ?? 'Servicios',
    total: Number(inv.total),
    moneda: inv.moneda,
    uuid: inv.uuid,
    status: statusMap[inv.status] ?? 'PENDIENTE',
  }));

  const totalFacturado = mapped.reduce((s, i) => s + i.total, 0);
  const totalPagado    = mapped.filter(i => i.status === 'PAGADA').reduce((s, i) => s + i.total, 0);
  const totalPendiente = mapped.filter(i => i.status === 'PENDIENTE').reduce((s, i) => s + i.total, 0);

  return NextResponse.json({
    customer: {
      legalName: customer.legalName,
      rfc: customer.rfc,
    },
    tenant: {
      name: tenant?.legalName ?? tenant?.name ?? '',
      rfc: tenant?.rfc ?? '',
      logoUrl: tenant?.logoUrl ?? null,
    },
    invoices: mapped,
    summary: { totalFacturado, totalPagado, totalPendiente },
    expiresAt: portalToken.expiresAt,
  });
}
