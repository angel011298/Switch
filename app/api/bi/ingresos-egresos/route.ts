import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET /api/bi/ingresos-egresos?months=6
export async function GET(req: Request) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const url = new URL(req.url);
  const months = Math.min(24, Math.max(1, parseInt(url.searchParams.get('months') ?? '6')));
  const tid = session.tenantId;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  // Get all INGRESO + EGRESO journal entries in range
  const entries = await prisma.journalEntry.findMany({
    where: {
      tenantId: tid,
      date: { gte: startDate },
      entryType: { in: ['INGRESO', 'EGRESO'] },
    },
    select: { date: true, entryType: true, totalDebit: true, totalCredit: true },
  });

  // Build month buckets
  const buckets: Record<string, { mes: string; ingresos: number; egresos: number }> = {};
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-MX', { month: 'short', year: '2-digit' });
    buckets[key] = { mes: label, ingresos: 0, egresos: 0 };
  }

  for (const e of entries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) continue;
    if (e.entryType === 'INGRESO') {
      buckets[key].ingresos += Number(e.totalCredit);
    } else {
      buckets[key].egresos += Number(e.totalDebit);
    }
  }

  return NextResponse.json(Object.values(buckets));
}
