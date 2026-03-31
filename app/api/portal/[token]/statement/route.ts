/**
 * GET /api/portal/[token]/statement
 * =====================================
 * Genera y devuelve el estado de cuenta en PDF para el cliente
 * autenticado via token del portal. No requiere sesión del ERP.
 *
 * FASE 49: Portal del Cliente — Autoservicio Avanzado
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import prisma from '@/lib/prisma';
import {
  EstadoCuentaDocument,
  type EstadoCuentaData,
  type EstadoCuentaRow,
} from '@/lib/reports/pdf/estado-cuenta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  // Validar token
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

  if (!portalToken || portalToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Enlace no válido o expirado' }, { status: 401 });
  }

  const { customer } = portalToken;

  // Traer facturas y datos del tenant
  const [invoices, tenant] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId: customer.tenantId, receptorRfc: customer.rfc },
      orderBy: { fechaEmision: 'desc' },
      take: 200,
      select: {
        id: true,
        serie: true,
        folio: true,
        fechaEmision: true,
        status: true,
        total: true,
        moneda: true,
        paidAt: true,
        items: { select: { descripcion: true }, take: 1 },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: customer.tenantId },
      select: { name: true, legalName: true, rfc: true, logoUrl: true },
    }),
  ]);

  // Mapear filas
  const filas: EstadoCuentaRow[] = invoices.map((inv) => {
    const isPaid = inv.status === 'STAMPED' && (inv.paidAt !== null || inv.status !== 'STAMPED') ? 'PAGADA' :
                   inv.status === 'CANCELLED' ? 'CANCELADA' :
                   inv.paidAt ? 'PAGADA' : 'PENDIENTE';
    return {
      folio: `${inv.serie ?? 'A'}${inv.folio}`,
      fecha: inv.fechaEmision,
      concepto: inv.items[0]?.descripcion ?? 'Servicios',
      importe: Number(inv.total),
      status: isPaid as any,
    };
  });

  const totalFacturado = filas.reduce((s, r) => s + r.importe, 0);
  const totalCobrado   = filas.filter(r => r.status === 'PAGADA').reduce((s, r) => s + r.importe, 0);
  const totalPendiente = filas.filter(r => r.status === 'PENDIENTE').reduce((s, r) => s + r.importe, 0);

  const docData: EstadoCuentaData = {
    tenantNombre:   tenant?.legalName ?? tenant?.name ?? '',
    tenantRfc:      tenant?.rfc ?? '',
    tenantLogoUrl:  tenant?.logoUrl ?? null,
    clienteNombre:  customer.legalName,
    clienteRfc:     customer.rfc,
    clienteEmail:   customer.email,
    fechaDesde:     invoices.length > 0 ? invoices[invoices.length - 1].fechaEmision : new Date(),
    fechaHasta:     new Date(),
    generadoEn:     new Date(),
    filas,
    totalFacturado,
    totalCobrado,
    totalPendiente,
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(EstadoCuentaDocument, { data: docData }) as ReactElement<DocumentProps>
  );

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="EstadoCuenta_${customer.rfc}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
