/**
 * GET /api/bi/fiscal?months=6
 * ==============================
 * ISR acumulado mensual + IVA trasladado vs acreditable.
 *
 * FASE 50: Reportes Avanzados
 *
 * ISR: suma PayrollRun.totalISR por mes (corridas cerradas)
 * IVA trasladado: suma Invoice.totalImpuestosTrasladados tipo 'I' por mes
 * IVA acreditable: suma Invoice.totalImpuestosTrasladados tipo 'E' por mes
 *   (notas de crédito / comprobantes de egreso registrados)
 */

import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const url = new URL(req.url);
  const months = Math.min(24, Math.max(1, parseInt(url.searchParams.get('months') ?? '6')));
  const tid = session.tenantId;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  // Queries en paralelo
  const [payrollRuns, invoicesIngreso, invoicesEgreso] = await Promise.all([
    // ISR de corridas de nómina cerradas
    prisma.payrollRun.findMany({
      where: {
        tenantId: tid,
        status: 'CLOSED',
        startDate: { gte: startDate },
      },
      select: { startDate: true, totalISR: true, totalIMSS: true },
    }),
    // IVA trasladado (facturas de ingreso)
    prisma.invoice.findMany({
      where: {
        tenantId: tid,
        status: 'STAMPED',
        tipoComprobante: 'I',
        fechaEmision: { gte: startDate },
      },
      select: { fechaEmision: true, totalImpuestosTrasladados: true, totalImpuestosRetenidos: true },
    }),
    // IVA acreditable (comprobantes de egreso — notas de crédito, etc.)
    prisma.invoice.findMany({
      where: {
        tenantId: tid,
        status: 'STAMPED',
        tipoComprobante: 'E',
        fechaEmision: { gte: startDate },
      },
      select: { fechaEmision: true, totalImpuestosTrasladados: true },
    }),
  ]);

  // Construir buckets mensuales
  type MonthBucket = {
    mes: string;
    isr: number;
    imss: number;
    ivaTrasl: number;
    ivaAcred: true extends false ? never : number;
    ivaNeto: number;
  };

  const buckets: Record<string, {
    mes: string;
    isr: number;
    imss: number;
    ivaTrasl: number;
    ivaAcred: number;
    ivaNeto: number;
  }> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-MX', { month: 'short', year: '2-digit' });
    buckets[key] = { mes: label, isr: 0, imss: 0, ivaTrasl: 0, ivaAcred: 0, ivaNeto: 0 };
  }

  // Acumular ISR/IMSS
  for (const run of payrollRuns) {
    const key = `${run.startDate.getFullYear()}-${String(run.startDate.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].isr  += Number(run.totalISR);
      buckets[key].imss += Number(run.totalIMSS);
    }
  }

  // Acumular IVA trasladado
  for (const inv of invoicesIngreso) {
    const key = `${inv.fechaEmision.getFullYear()}-${String(inv.fechaEmision.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].ivaTrasl += Number(inv.totalImpuestosTrasladados);
    }
  }

  // Acumular IVA acreditable
  for (const inv of invoicesEgreso) {
    const key = `${inv.fechaEmision.getFullYear()}-${String(inv.fechaEmision.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].ivaAcred += Number(inv.totalImpuestosTrasladados);
    }
  }

  // Calcular IVA neto a pagar (trasladado - acreditable)
  for (const b of Object.values(buckets)) {
    b.ivaNeto = Math.max(0, b.ivaTrasl - b.ivaAcred);
  }

  // Totales acumulados
  const rows = Object.values(buckets);
  const totalIsr    = rows.reduce((s, r) => s + r.isr, 0);
  const totalImss   = rows.reduce((s, r) => s + r.imss, 0);
  const totalIvaTrasl = rows.reduce((s, r) => s + r.ivaTrasl, 0);
  const totalIvaAcred = rows.reduce((s, r) => s + r.ivaAcred, 0);
  const totalIvaNeto  = rows.reduce((s, r) => s + r.ivaNeto, 0);

  return NextResponse.json({
    rows,
    totales: { totalIsr, totalImss, totalIvaTrasl, totalIvaAcred, totalIvaNeto },
  });
}
