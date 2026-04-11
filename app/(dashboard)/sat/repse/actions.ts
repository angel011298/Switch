'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getRepseData() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const [registration, contracts] = await Promise.all([
    prisma.repseRegistration.findUnique({ where: { tenantId: session.tenantId } }),
    prisma.repseContract.findMany({
      where: { tenantId: session.tenantId },
      include: { icsoeReports: { orderBy: { period: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { registration, contracts };
}

export async function saveRepseRegistration(data: {
  numRepse: string; fechaRegistro: string; fechaVencimiento: string; actividades: string;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.repseRegistration.upsert({
    where: { tenantId: session.tenantId },
    create: {
      tenantId: session.tenantId,
      numRepse: data.numRepse,
      fechaRegistro: new Date(data.fechaRegistro),
      fechaVencimiento: new Date(data.fechaVencimiento),
      actividades: data.actividades,
      status: 'ACTIVE',
    },
    update: {
      numRepse: data.numRepse,
      fechaRegistro: new Date(data.fechaRegistro),
      fechaVencimiento: new Date(data.fechaVencimiento),
      actividades: data.actividades,
    },
  });
  revalidatePath('/sat/repse');
}

export async function createRepseContract(data: {
  clienteRfc: string; clienteNombre: string; objetoContrato: string;
  fechaInicio: string; numTrabajadores: number;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.repseContract.create({
    data: {
      tenantId: session.tenantId,
      clienteRfc: data.clienteRfc,
      clienteNombre: data.clienteNombre,
      objetoContrato: data.objetoContrato,
      fechaInicio: new Date(data.fechaInicio),
      numTrabajadores: data.numTrabajadores,
      status: 'ACTIVE',
    },
  });
  revalidatePath('/sat/repse');
}

export async function generateIcsoeReport(contractId: string, period: string, data: {
  numTrabajadores: number; totalNomina: number; totalImss: number; totalInfonavit: number;
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.repseIcsoeReport.upsert({
    where: { contractId_period: { contractId, period } },
    create: { contractId, period, ...data, status: 'DRAFT' },
    update: { ...data },
  });
  revalidatePath('/sat/repse');
}
