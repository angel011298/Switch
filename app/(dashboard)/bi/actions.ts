'use server';

/**
 * CIFRA — BI & Analytics Server Actions
 * ===========================================
 * FASE 18: KPIs reales desde Prisma.
 *
 * - Revenue: Invoice STAMPED + POS orders
 * - Top productos: por unidades vendidas en POS
 * - Tendencia mensual: últimos 6 meses
 * - CRM funnel: deals por etapa
 * - Clientes: total + nuevos del mes
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface BiKpis {
  // Ingresos
  revenueTotal: number;         // Ingresos por facturación (STAMPED invoices)
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueMoM: number;           // % cambio mes a mes

  // POS
  posTotal: number;             // Total ventas POS de todos los tiempos
  posThisMonth: number;
  posOrdersThisMonth: number;

  // Clientes
  customersTotal: number;
  customersNewThisMonth: number;

  // Pipeline
  pipelineValue: number;
  wonValue: number;
}

export interface MonthlyData {
  mes: string;
  facturas: number;
  pos: number;
  total: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenue: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  color: string;
}

// ─── FUNCIONES ───────────────────────────────────────────────────────────────

export async function getBiKpis(): Promise<BiKpis> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return emptyKpis();

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    revenueTotalAgg,
    revenueThisMonthAgg,
    revenueLastMonthAgg,
    posTotalAgg,
    posThisMonthAgg,
    posOrdersThisMonthCount,
    customersTotal,
    customersNewThisMonth,
    pipelineAgg,
    wonCol,
  ] = await Promise.all([
    // Revenue total (facturas emitidas timbradas)
    prisma.invoice.aggregate({
      where: { tenantId: session.tenantId, status: 'STAMPED', tipoComprobante: 'I' },
      _sum: { total: true },
    }),
    // Revenue este mes
    prisma.invoice.aggregate({
      where: { tenantId: session.tenantId, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: startThisMonth } },
      _sum: { total: true },
    }),
    // Revenue mes anterior
    prisma.invoice.aggregate({
      where: { tenantId: session.tenantId, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: startLastMonth, lte: endLastMonth } },
      _sum: { total: true },
    }),
    // POS total
    prisma.posOrder.aggregate({
      where: { tenantId: session.tenantId },
      _sum: { total: true },
    }),
    // POS este mes
    prisma.posOrder.aggregate({
      where: { tenantId: session.tenantId, createdAt: { gte: startThisMonth } },
      _sum: { total: true },
    }),
    // Tickets POS este mes
    prisma.posOrder.count({
      where: { tenantId: session.tenantId, createdAt: { gte: startThisMonth } },
    }),
    // Clientes total
    prisma.customer.count({ where: { tenantId: session.tenantId, isActive: true } }),
    // Clientes nuevos este mes
    prisma.customer.count({ where: { tenantId: session.tenantId, createdAt: { gte: startThisMonth } } }),
    // Pipeline activo
    prisma.deal.aggregate({
      where: { tenantId: session.tenantId, wonAt: null, lostAt: null },
      _sum: { value: true },
    }),
    // Columna "Ganado"
    prisma.pipelineColumn.findFirst({ where: { tenantId: session.tenantId, isWon: true }, select: { id: true } }),
  ]);

  const wonAgg = wonCol
    ? await prisma.deal.aggregate({ where: { tenantId: session.tenantId, columnId: wonCol.id }, _sum: { value: true } })
    : null;

  const revTM = Number(revenueThisMonthAgg._sum.total ?? 0);
  const revLM = Number(revenueLastMonthAgg._sum.total ?? 0);
  const revMoM = revLM > 0 ? ((revTM - revLM) / revLM) * 100 : 0;

  return {
    revenueTotal:          round2(Number(revenueTotalAgg._sum.total ?? 0)),
    revenueThisMonth:      round2(revTM),
    revenueLastMonth:      round2(revLM),
    revenueMoM:            round2(revMoM),
    posTotal:              round2(Number(posTotalAgg._sum.total ?? 0)),
    posThisMonth:          round2(Number(posThisMonthAgg._sum.total ?? 0)),
    posOrdersThisMonth:    posOrdersThisMonthCount,
    customersTotal,
    customersNewThisMonth,
    pipelineValue:         round2(Number(pipelineAgg._sum.value ?? 0)),
    wonValue:              round2(Number(wonAgg?._sum.value ?? 0)),
  };
}

export async function getMonthlyRevenue(months = 6): Promise<MonthlyData[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const result: MonthlyData[] = [];
  const now = new Date();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [invAgg, posAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId: session.tenantId, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: start, lte: end } },
        _sum: { total: true },
      }),
      prisma.posOrder.aggregate({
        where: { tenantId: session.tenantId, createdAt: { gte: start, lte: end } },
        _sum: { total: true },
      }),
    ]);

    const facturas = round2(Number(invAgg._sum.total ?? 0));
    const pos      = round2(Number(posAgg._sum.total ?? 0));

    result.push({
      mes: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      facturas,
      pos,
      total: round2(facturas + pos),
    });
  }

  return result;
}

export async function getTopProducts(limit = 8): Promise<TopProduct[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  // Agrupar PosOrderItem por producto
  const items = await prisma.posOrderItem.groupBy({
    by: ['productId'],
    where: {
      order: { tenantId: session.tenantId },
      productId: { not: undefined },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  if (items.length === 0) return [];

  const productIds = items.map((i) => i.productId as string).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const prodMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const pid  = item.productId as string;
    const prod = prodMap.get(pid);
    const sums = item._sum as { quantity?: number | null; total?: unknown } | undefined;
    return {
      productId: pid,
      name:      prod?.name ?? 'Producto eliminado',
      sku:       prod?.sku  ?? null,
      unitsSold: Number(sums?.quantity ?? 0),
      revenue:   round2(Number(sums?.total ?? 0)),
    };
  });
}

export async function getPipelineFunnel(): Promise<FunnelStage[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const columns = await prisma.pipelineColumn.findMany({
    where:   { tenantId: session.tenantId },
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { deals: true } },
      deals:  { select: { value: true } },
    },
  });

  return columns.map((col) => ({
    stage: col.name,
    count: col._count.deals,
    value: round2(col.deals.reduce((s, d) => s + Number(d.value), 0)),
    color: col.color,
  }));
}

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

function emptyKpis(): BiKpis {
  return {
    revenueTotal: 0, revenueThisMonth: 0, revenueLastMonth: 0, revenueMoM: 0,
    posTotal: 0, posThisMonth: 0, posOrdersThisMonth: 0,
    customersTotal: 0, customersNewThisMonth: 0,
    pipelineValue: 0, wonValue: 0,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
