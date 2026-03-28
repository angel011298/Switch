import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET /api/bi/cobranza-aging
// Returns aging buckets: { bucket: '0-30', count, monto }[]
export async function GET() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });
  const tid = session.tenantId;

  const now = new Date();

  // Get all STAMPED invoices (unpaid, tipo I)
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: tid, status: 'STAMPED', tipoComprobante: 'I' },
    select: { fechaEmision: true, total: true },
  });

  const buckets = [
    { label: 'Corriente',  min: 0,   max: 30  },
    { label: '31-60 días', min: 31,  max: 60  },
    { label: '61-90 días', min: 61,  max: 90  },
    { label: '+90 días',   min: 91,  max: Infinity },
  ];

  const result = buckets.map(b => ({ bucket: b.label, count: 0, monto: 0 }));

  for (const inv of invoices) {
    const daysDiff = Math.floor((now.getTime() - inv.fechaEmision.getTime()) / (1000 * 60 * 60 * 24));
    const idx = buckets.findIndex(b => daysDiff >= b.min && daysDiff <= b.max);
    if (idx >= 0) {
      result[idx].count++;
      result[idx].monto += Number(inv.total);
    }
  }

  return NextResponse.json(result);
}
