import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import CorteDeCajaClient from './CorteDeCajaClient';

export const dynamic = 'force-dynamic';

export default async function CortePage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return <div className="p-8 text-neutral-500">No autenticado</div>;
  const tenantId = session.tenantId;

  // Today only
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await prisma.posOrder.findMany({
    where: { tenantId, createdAt: { gte: today }, status: 'CLOSED' },
    select: {
      paymentMethod: true,
      total: true,
      amountPaid: true,
      changeDue: true,
    },
  });

  const byMethod: Record<string, { count: number; total: number }> = {};
  let grandTotal = 0;

  for (const o of orders) {
    const m = o.paymentMethod;
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
    byMethod[m].count++;
    byMethod[m].total += Number(o.total);
    grandTotal += Number(o.total);
  }

  const efectivoTotal = byMethod['01']?.total ?? 0;

  return (
    <CorteDeCajaClient
      grandTotal={grandTotal}
      efectivoTotal={efectivoTotal}
      byMethod={byMethod}
      ordersCount={orders.length}
      date={today.toISOString()}
    />
  );
}
