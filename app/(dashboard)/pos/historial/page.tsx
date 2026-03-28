import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import PosHistorialClient from './PosHistorialClient';

export const dynamic = 'force-dynamic';

async function getOrderHistory(tenantId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.posOrder.findMany({
    where: { tenantId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      ticketCode: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      totalTax: true,
      discount: true,
      total: true,
      amountPaid: true,
      changeDue: true,
      isInvoiced: true,
      createdAt: true,
      closedAt: true,
    },
  });

  return orders.map(o => ({
    id: o.id,
    ticketCode: o.ticketCode,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    subtotal: Number(o.subtotal),
    totalTax: Number(o.totalTax),
    discount: Number(o.discount),
    total: Number(o.total),
    amountPaid: Number(o.amountPaid),
    changeDue: Number(o.changeDue),
    isInvoiced: o.isInvoiced,
    createdAt: o.createdAt.toISOString(),
    closedAt: o.closedAt?.toISOString() ?? null,
  }));
}

export default async function PosHistorialPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return <div className="p-8 text-neutral-500">No autenticado</div>;

  const orders = await getOrderHistory(session.tenantId, 7);

  return <PosHistorialClient initialOrders={orders} />;
}
