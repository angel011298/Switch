'use server';

/**
 * CIFRA — Dashboard Server Actions
 * ========================================
 * FASE 12: KPIs desde Prisma (Invoice, PosOrder, Customer, Employee).
 * Reemplaza las queries legacy de Supabase (ingresos_cfdi, gastos_xml, empleados).
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export interface DashboardStats {
  totalIngresos: number;
  totalGastos: number;
  utilidad: number;
  clientes: number;
  empleados: number;
  monthlyData: { month: string; ingresos: number; gastos: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return {
      totalIngresos: 0,
      totalGastos: 0,
      utilidad: 0,
      clientes: 0,
      empleados: 0,
      monthlyData: [],
    };
  }

  // Período: últimos 12 meses
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Ejecutar todas las queries en paralelo
  const [invoices, posOrders, expenseLines, clientes, empleados] =
    await Promise.all([
      // Ingresos: facturas CFDI timbradas
      prisma.invoice.findMany({
        where: {
          tenantId: session.tenantId,
          status: 'STAMPED',
          createdAt: { gte: oneYearAgo },
        },
        select: { total: true, createdAt: true },
      }),

      // Ingresos: ventas POS
      prisma.posOrder.findMany({
        where: {
          tenantId: session.tenantId,
          createdAt: { gte: oneYearAgo },
        },
        select: { total: true, createdAt: true },
      }),

      // Gastos: líneas de pólizas de egreso (cuentas tipo EXPENSE)
      prisma.journalLine.findMany({
        where: {
          journalEntry: {
            tenantId: session.tenantId,
            entryType: 'EGRESO',
            createdAt: { gte: oneYearAgo },
          },
          account: {
            accountType: { in: ['EXPENSE', 'CONTRA_REVENUE'] },
          },
        },
        select: { debit: true, journalEntry: { select: { createdAt: true } } },
      }),

      // Clientes activos
      prisma.customer.count({
        where: { tenantId: session.tenantId },
      }),

      // Empleados activos
      prisma.employee.count({
        where: { tenantId: session.tenantId, active: true },
      }),
    ]);

  // Calcular totales
  const totalIngresos = [
    ...invoices.map((x) => parseFloat(String(x.total || 0))),
    ...posOrders.map((x) => parseFloat(String(x.total || 0))),
  ].reduce((sum, x) => sum + x, 0);

  const totalGastos = expenseLines
    .map((x) => parseFloat(String(x.debit || 0)))
    .reduce((sum, x) => sum + x, 0);

  // Construir datos mensuales para el gráfico
  const monthlyData = buildMonthlyData(invoices, posOrders, expenseLines, oneYearAgo);

  return {
    totalIngresos: round2(totalIngresos),
    totalGastos: round2(totalGastos),
    utilidad: round2(totalIngresos - totalGastos),
    clientes,
    empleados,
    monthlyData,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildMonthlyData(
  invoices: { total: any; createdAt: Date }[],
  posOrders: { total: any; createdAt: Date }[],
  expenses: { debit: any; journalEntry: { createdAt: Date } }[],
  startDate: Date
) {
  // Inicializar 12 meses desde startDate
  const months: Record<string, { ingresos: number; gastos: number; label: string }> = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().substring(0, 7); // "2026-03"
    const label = d.toLocaleString('es-MX', { month: 'short', timeZone: 'America/Mexico_City' });
    months[key] = { ingresos: 0, gastos: 0, label };
  }

  // Acumular ingresos de Invoice
  invoices.forEach((inv) => {
    const key = inv.createdAt.toISOString().substring(0, 7);
    if (months[key]) {
      months[key].ingresos += parseFloat(String(inv.total || 0));
    }
  });

  // Acumular ingresos de PosOrder
  posOrders.forEach((po) => {
    const key = po.createdAt.toISOString().substring(0, 7);
    if (months[key]) {
      months[key].ingresos += parseFloat(String(po.total || 0));
    }
  });

  // Acumular gastos de JournalLine
  expenses.forEach((exp) => {
    const key = exp.journalEntry.createdAt.toISOString().substring(0, 7);
    if (months[key]) {
      months[key].gastos += parseFloat(String(exp.debit || 0));
    }
  });

  return Object.values(months).map((m) => ({
    month: m.label,
    ingresos: round2(m.ingresos),
    gastos: round2(m.gastos),
  }));
}

// ─── Widget: Alertas de Cumplimiento Fiscal ───────────────────────────────────

import type { FiscalObligation } from '@/lib/fiscal/calendar';
import { generateFiscalObligations } from '@/lib/fiscal/calendar';

export interface FiscalAlertsWidget {
  overdue: number;
  dueSoon: number;
  next3: Pick<FiscalObligation, 'id' | 'label' | 'dueDate' | 'daysLeft' | 'status' | 'authority' | 'period'>[];
}

export async function getFiscalAlertsWidget(): Promise<FiscalAlertsWidget> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return { overdue: 0, dueSoon: 0, next3: [] };

  const [tenant, empCount] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { taxRegime: { select: { satCode: true } } },
    }),
    prisma.employee.count({ where: { tenantId: session.tenantId, active: true } }),
  ]);

  const regimeCode = tenant?.taxRegime?.satCode ?? null;
  const obligations = generateFiscalObligations(regimeCode, empCount > 0, 60);

  const overdue  = obligations.filter(o => o.status === 'OVERDUE').length;
  const dueSoon  = obligations.filter(o => o.status === 'DUE_SOON').length;
  const next3    = obligations.slice(0, 3).map(o => ({
    id: o.id, label: o.label, dueDate: o.dueDate,
    daysLeft: o.daysLeft, status: o.status, authority: o.authority, period: o.period,
  }));

  return { overdue, dueSoon, next3 };
}
