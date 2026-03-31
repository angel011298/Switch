/**
 * GET /api/reports/ejecutivo-mensual
 * =====================================
 * Genera el Reporte Ejecutivo Mensual en PDF.
 *
 * FASE 50: Reportes Avanzados
 *
 * Agrega datos de:
 *   - KPIs (facturación, POS, empleados, CRM)
 *   - Ingresos vs Egresos últimos 6 meses
 *   - Obligaciones fiscales del mes (ISR, IVA)
 *   - Top 5 productos POS
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import {
  EjecutivoDocument,
  type EjecutivoData,
  type EjecutivoIngreso,
  type EjecutivoProducto,
} from '@/lib/reports/pdf/ejecutivo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return NextResponse.json({ error: 'No auth' }, { status: 401 });
  }
  const tid = session.tenantId;

  const now       = new Date();
  const mesLabel  = now.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const start6m   = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    tenant,
    facAgg,
    facPrevAgg,
    posAgg,
    empleados,
    wonCol,
    payrollMes,
    invoicesFiscal,
    journalEntries,
    posOrders6m,
    topProd,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tid },
      select: { name: true, legalName: true, rfc: true, logoUrl: true },
    }),
    // Facturado este mes
    prisma.invoice.aggregate({
      where: { tenantId: tid, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: startMonth } },
      _sum: { total: true },
    }),
    // Facturado mes anterior
    prisma.invoice.aggregate({
      where: { tenantId: tid, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: startLastMonth, lte: endLastMonth } },
      _sum: { total: true },
    }),
    // POS este mes
    prisma.posOrder.aggregate({
      where: { tenantId: tid, createdAt: { gte: startMonth } },
      _sum: { total: true },
    }),
    // Empleados activos
    prisma.employee.count({ where: { tenantId: tid, active: true } }),
    // Deals ganados
    prisma.pipelineColumn.findFirst({ where: { tenantId: tid, isWon: true }, select: { id: true } }),
    // ISR/IMSS nómina este mes
    prisma.payrollRun.findMany({
      where: { tenantId: tid, status: 'CLOSED', startDate: { gte: startMonth } },
      select: { totalISR: true, totalIMSS: true },
    }),
    // IVA trasladado/acreditable este mes
    prisma.invoice.findMany({
      where: {
        tenantId: tid,
        status: 'STAMPED',
        tipoComprobante: { in: ['I', 'E'] },
        fechaEmision: { gte: startMonth },
      },
      select: { tipoComprobante: true, totalImpuestosTrasladados: true },
    }),
    // Journal entries últimos 6 meses para ingresos/egresos
    prisma.journalEntry.findMany({
      where: { tenantId: tid, date: { gte: start6m }, entryType: { in: ['INGRESO', 'EGRESO'] } },
      select: { date: true, entryType: true, totalCredit: true, totalDebit: true },
    }),
    // POS orders últimos 6 meses
    prisma.posOrder.findMany({
      where: { tenantId: tid, createdAt: { gte: start6m } },
      select: { createdAt: true, total: true },
    }),
    // Top 5 productos POS
    prisma.posOrderItem.groupBy({
      by: ['productId'],
      where: { order: { tenantId: tid, createdAt: { gte: startMonth } } },
      _sum: { subtotal: true, quantity: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 5,
    }),
  ]);

  // Deals ganados count
  let dealsGanados = 0;
  if (wonCol) {
    dealsGanados = await prisma.deal.count({ where: { tenantId: tid, columnId: wonCol.id } });
  }

  // MoM
  const facturadoMes      = Number(facAgg._sum.total ?? 0);
  const facturadoMesAnterior = Number(facPrevAgg._sum.total ?? 0);
  const momPct = facturadoMesAnterior > 0
    ? Math.round(((facturadoMes - facturadoMesAnterior) / facturadoMesAnterior) * 1000) / 10
    : 0;

  // Fiscal del mes
  const isrMes  = payrollMes.reduce((s, r) => s + Number(r.totalISR), 0);
  const imssMes = payrollMes.reduce((s, r) => s + Number(r.totalIMSS), 0);
  const ivaTrasl = invoicesFiscal
    .filter(i => i.tipoComprobante === 'I')
    .reduce((s, i) => s + Number(i.totalImpuestosTrasladados), 0);
  const ivaAcred = invoicesFiscal
    .filter(i => i.tipoComprobante === 'E')
    .reduce((s, i) => s + Number(i.totalImpuestosTrasladados), 0);

  // Ingresos/Egresos por mes
  const buckets: Record<string, { mes: string; ingresos: number; egresos: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lbl = d.toLocaleString('es-MX', { month: 'short', year: '2-digit' });
    buckets[key] = { mes: lbl, ingresos: 0, egresos: 0 };
  }
  for (const e of journalEntries) {
    const k = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[k]) continue;
    if (e.entryType === 'INGRESO') buckets[k].ingresos += Number(e.totalCredit);
    else                            buckets[k].egresos  += Number(e.totalDebit);
  }
  for (const o of posOrders6m) {
    const k = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[k]) buckets[k].ingresos += Number(o.total);
  }
  const ingresosMeses: EjecutivoIngreso[] = Object.values(buckets);

  // Top productos — enriquecer con nombre/sku
  const topProductIds = topProd.map(t => t.productId);
  const productsInfo  = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });
  const prodMap = Object.fromEntries(productsInfo.map(p => [p.id, p]));
  const topProductos: EjecutivoProducto[] = topProd.map(t => ({
    name:      prodMap[t.productId]?.name   ?? 'Producto',
    sku:       prodMap[t.productId]?.sku    ?? null,
    unitsSold: Number(t._sum.quantity ?? 0),
    revenue:   Number(t._sum.subtotal ?? 0),
  }));

  const docData: EjecutivoData = {
    tenantNombre: tenant?.legalName ?? tenant?.name ?? '',
    tenantRfc:    tenant?.rfc ?? '',
    tenantLogoUrl: tenant?.logoUrl ?? null,
    mes:          mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
    generadoEn:   now,
    kpis: {
      facturadoMes,
      facturadoMesAnterior,
      momPct,
      posVentasMes:     Number(posAgg._sum.total ?? 0),
      empleadosActivos: empleados,
      dealsGanados,
    },
    fiscal: {
      isr:      isrMes,
      imss:     imssMes,
      ivaTrasl,
      ivaAcred,
      ivaNeto:  Math.max(0, ivaTrasl - ivaAcred),
    },
    ingresosMeses,
    topProductos,
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(EjecutivoDocument, { data: docData }) as ReactElement<DocumentProps>
  );

  const filename = `ReporteEjecutivo_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}
