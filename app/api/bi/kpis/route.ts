import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET /api/bi/kpis?months=1
// Returns: { mrr, facturadoMes, facturadoMesAnterior, momPct, cobradoMes, posVentasMes, empleadosActivos, dealsAbiertos, dealsGanados }
export async function GET(req: Request) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });
  const tid = session.tenantId;

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    facturadoMesAgg,
    facturadoMesAnteriorAgg,
    posVentasMesAgg,
    empleadosActivos,
    dealsAbiertos,
    dealsGanados,
    wonColId,
    lostColId,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId: tid, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: startThisMonth } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { tenantId: tid, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: startLastMonth, lte: endLastMonth } },
      _sum: { total: true },
    }),
    prisma.posOrder.aggregate({
      where: { tenantId: tid, createdAt: { gte: startThisMonth } },
      _sum: { total: true },
    }),
    prisma.employee.count({ where: { tenantId: tid, active: true } }),
    // Deals count later (need wonCol/lostCol first — we do separate queries)
    Promise.resolve(0),
    Promise.resolve(0),
    prisma.pipelineColumn.findFirst({ where: { tenantId: tid, isWon: true }, select: { id: true } }),
    prisma.pipelineColumn.findFirst({ where: { tenantId: tid, isLost: true }, select: { id: true } }),
  ]);

  // Active deals (not won/lost)
  const [dealsAbiertosCount, dealsGanadosCount] = await Promise.all([
    prisma.deal.count({
      where: {
        tenantId: tid,
        columnId: {
          notIn: [wonColId?.id ?? '', lostColId?.id ?? ''].filter(Boolean),
        },
      },
    }),
    prisma.deal.count({
      where: { tenantId: tid, ...(wonColId ? { columnId: wonColId.id } : {}) },
    }),
  ]);

  const facturadoMes = Number(facturadoMesAgg._sum.total ?? 0);
  const facturadoMesAnterior = Number(facturadoMesAnteriorAgg._sum.total ?? 0);
  const momPct = facturadoMesAnterior > 0
    ? ((facturadoMes - facturadoMesAnterior) / facturadoMesAnterior) * 100
    : 0;

  return NextResponse.json({
    mrr: facturadoMes, // proxy: facturado este mes
    facturadoMes,
    facturadoMesAnterior,
    momPct: Math.round(momPct * 10) / 10,
    posVentasMes: Number(posVentasMesAgg._sum.total ?? 0),
    empleadosActivos,
    dealsAbiertos: dealsAbiertosCount,
    dealsGanados: dealsGanadosCount,
  });
}
