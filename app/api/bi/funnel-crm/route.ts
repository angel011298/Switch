import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET /api/bi/funnel-crm
export async function GET() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });
  const tid = session.tenantId;

  const columns = await prisma.pipelineColumn.findMany({
    where: { tenantId: tid },
    orderBy: { position: 'asc' },
    include: {
      deals: { select: { value: true } },
    },
  });

  return NextResponse.json(columns.map(col => ({
    stage: col.name,
    count: col.deals.length,
    value: col.deals.reduce((s, d) => s + Number(d.value), 0),
    color: col.color,
    isWon: col.isWon,
    isLost: col.isLost,
  })));
}
