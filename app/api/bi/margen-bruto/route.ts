/**
 * GET /api/bi/margen-bruto?months=6
 * ====================================
 * Costo de ventas y margen bruto mensual desde ventas POS.
 *
 * FASE 50: Reportes Avanzados
 *
 * Revenue   = sum(PosOrderItem.subtotal) por mes
 * COGS      = sum(PosOrderItem.quantity * Product.cost) para items con costo
 * Margen    = Revenue - COGS
 * Margen%   = (Margen / Revenue) * 100
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

  // Traer items de POS con costo del producto
  const items = await prisma.posOrderItem.findMany({
    where: {
      order: {
        tenantId: tid,
        createdAt: { gte: startDate },
      },
    },
    select: {
      quantity:  true,
      subtotal:  true,
      order:     { select: { createdAt: true } },
      product:   { select: { cost: true } },
    },
  });

  // Construir buckets
  const buckets: Record<string, {
    mes: string;
    revenue: number;
    cogs: number;
    margen: number;
    margenPct: number;
    hasCost: boolean;
  }> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-MX', { month: 'short', year: '2-digit' });
    buckets[key] = { mes: label, revenue: 0, cogs: 0, margen: 0, margenPct: 0, hasCost: false };
  }

  for (const item of items) {
    const d = item.order.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) continue;

    const sub  = Number(item.subtotal);
    const cost = item.product.cost != null ? Number(item.product.cost) : null;
    const qty  = Number(item.quantity);

    buckets[key].revenue += sub;
    if (cost != null) {
      buckets[key].cogs    += qty * cost;
      buckets[key].hasCost  = true;
    }
  }

  // Calcular margen
  for (const b of Object.values(buckets)) {
    b.margen    = b.revenue - b.cogs;
    b.margenPct = b.revenue > 0 ? Math.round((b.margen / b.revenue) * 1000) / 10 : 0;
  }

  const rows = Object.values(buckets);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCogs    = rows.reduce((s, r) => s + r.cogs, 0);
  const totalMargen  = totalRevenue - totalCogs;
  const totalMargenPct = totalRevenue > 0
    ? Math.round((totalMargen / totalRevenue) * 1000) / 10
    : 0;
  const hasCostData  = rows.some(r => r.hasCost);

  return NextResponse.json({
    rows,
    totales: { totalRevenue, totalCogs, totalMargen, totalMargenPct, hasCostData },
  });
}
