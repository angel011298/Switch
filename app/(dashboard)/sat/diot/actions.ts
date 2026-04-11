'use server';

/**
 * CIFRA — DIOT Automática (Declaración Informativa de Operaciones con Terceros)
 * ==============================================================================
 * Genera la DIOT mensual a partir de CFDIs de egresos (compras a proveedores).
 * Formato: TXT plano para subir al portal del SAT (opción DIOT en DeclaraSAT).
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDiotRecords(period?: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (period) where.period = period;
  return prisma.diotRecord.findMany({
    where,
    orderBy: [{ period: 'desc' }, { montoTotalPagos: 'desc' }],
  });
}

export async function generateDiot(period: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const { tenantId } = session;

  // Parse period "2026-03" → date range
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Aggregate CFDIs recibidos (egresos del tenant) grouped by RFC emisor
  const cfdisRecibidos = await prisma.cfdiRecibido.findMany({
    where: {
      tenantId,
      fecha: { gte: startDate, lt: endDate },
    },
  });

  // Group by RFC emisor
  const grouped = new Map<string, { nombre: string; monto: number; iva: number }>();
  for (const cfdi of cfdisRecibidos) {
    const key = cfdi.rfcEmisor;
    const existing = grouped.get(key) ?? { nombre: cfdi.nombreEmisor ?? key, monto: 0, iva: 0 };
    existing.monto += Number(cfdi.subtotal ?? 0);
    existing.iva += Number(cfdi.totalIva ?? 0);
    grouped.set(key, existing);
  }

  // Also check XmlBatch imports for expenses
  const xmlExpenses = await prisma.pettyCashExpense.findMany({
    where: {
      fund: { tenantId },
      status: 'APROBADO',
      xmlValidated: true,
      providerRfc: { not: null },
    },
    select: { providerRfc: true, amount: true, ivaAmount: true },
  });
  for (const exp of xmlExpenses) {
    if (!exp.providerRfc) continue;
    const key = exp.providerRfc;
    const existing = grouped.get(key) ?? { nombre: key, monto: 0, iva: 0 };
    existing.monto += Number(exp.amount);
    existing.iva += Number(exp.ivaAmount ?? 0);
    grouped.set(key, existing);
  }

  // Upsert DiotRecord for each provider
  const upsertOps = Array.from(grouped.entries()).map(([rfc, data]) =>
    prisma.diotRecord.upsert({
      where: { tenantId_period_rfcProveedor: { tenantId, period, rfcProveedor: rfc } },
      create: {
        tenantId, period,
        rfcProveedor: rfc,
        nombreProveedor: data.nombre,
        montoTotalPagos: data.monto,
        ivaAcreditable: data.iva,
        status: 'READY',
      },
      update: {
        nombreProveedor: data.nombre,
        montoTotalPagos: data.monto,
        ivaAcreditable: data.iva,
        status: 'READY',
      },
    })
  );

  await Promise.all(upsertOps);
  revalidatePath('/sat/diot');
  return { providers: grouped.size, period };
}

export async function exportDiotTxt(period: string): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  const records = await prisma.diotRecord.findMany({
    where: { tenantId: session.tenantId, period, status: 'READY' },
  });

  if (!records.length) throw new Error('No hay registros DIOT para el periodo. Genera primero la DIOT.');

  // Format: pipe-delimited per SAT DIOT spec
  const lines = records.map(r => [
    r.tipoProveedor,           // 04=Nacional
    r.tipoOperacion,           // 85
    r.rfcProveedor,
    '',                        // País (vacío para nacionales)
    '',                        // Nacionalidad (vacío para nacionales)
    r.montoTotalPagos.toFixed(2),
    '0.00',                    // Pagos en efectivo
    '0.00',                    // Pagos con cheque nominativo
    '0.00',                    // Transferencias electrónicas
    r.montoTotalPagos.toFixed(2), // Otras formas de pago
    r.ivaAcreditable.toFixed(2),  // IVA pagado no acreditable/no deducible: 0
    r.ivaAcreditable.toFixed(2),  // IVA acreditable
    r.ivaNoAcreditable.toFixed(2),
    r.ivaRetenido.toFixed(2),
    r.ivaImportacion.toFixed(2),
  ].join('|'));

  return lines.join('\n');
}
