'use server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCashFlowProjections(days: 30 | 60 | 90 = 30) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const until = new Date();
  until.setDate(until.getDate() + days);
  const [projections, invoices] = await Promise.all([
    prisma.cashFlowProjection.findMany({
      where: { tenantId: session.tenantId, date: { lte: until } },
      orderBy: { date: 'asc' },
    }),
    prisma.invoice.findMany({
      where: { tenantId: session.tenantId, status: { in: ['STAMPED', 'DRAFT'] } },
      select: { id: true, total: true, createdAt: true, status: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return {
    projections: projections.map(p => ({
      id: p.id, date: p.date.toISOString(), type: p.type, category: p.category,
      description: p.description, amount: Number(p.amount), isConfirmed: p.isConfirmed,
    })),
    invoices: invoices.map(i => ({
      id: i.id, total: Number(i.total), createdAt: i.createdAt.toISOString(), status: i.status,
    })),
  };
}

export async function addCashFlowEntry(data: {
  date: string;
  type: 'INGRESO' | 'EGRESO';
  category: string;
  description: string;
  amount: number;
  isConfirmed: boolean;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.cashFlowProjection.create({
    data: {
      tenantId: session.tenantId,
      ...data,
      date: new Date(data.date),
      amount: data.amount,
    },
  });
  revalidatePath('/finanzas/flujo');
}
