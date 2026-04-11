'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getNom035Data() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const [surveys, totalEmployees] = await Promise.all([
    prisma.nom035Survey.findMany({
      where: { tenantId: session.tenantId },
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count({ where: { tenantId: session.tenantId, active: true } }),
  ]);
  return { surveys, totalEmployees };
}

export async function createNom035Survey(data: { period: string; guia?: string }) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.nom035Survey.create({
    data: {
      tenantId: session.tenantId,
      period: data.period,
      guia: data.guia ?? 'GUIA_II',
      status: 'DRAFT',
    },
  });
  revalidatePath('/sat/nom035');
}

export async function activateSurvey(id: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const closeAt = new Date();
  closeAt.setDate(closeAt.getDate() + 14); // Open for 14 days
  await prisma.nom035Survey.update({
    where: { id },
    data: { status: 'ACTIVE', openAt: new Date(), closeAt },
  });
  revalidatePath('/sat/nom035');
}

export async function closeSurvey(id: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.nom035Survey.update({
    where: { id },
    data: { status: 'CLOSED' },
  });
  revalidatePath('/sat/nom035');
}
