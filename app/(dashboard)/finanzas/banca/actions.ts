'use server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getBankConnections() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  return prisma.bankConnection.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBankTransactions(days: number = 30) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.bankTransaction.findMany({
    where: { tenantId: session.tenantId, date: { gte: since } },
    orderBy: { date: 'desc' },
    take: 100,
  });
}

export async function createBankConnection(data: { bank: string; alias: string; clabe?: string }) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.bankConnection.create({
    data: { tenantId: session.tenantId, ...data },
  });
  revalidatePath('/finanzas/banca');
}
