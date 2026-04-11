'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSatCredential() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  return prisma.satCredential.findUnique({ where: { tenantId: session.tenantId } });
}

export async function getSatDownloads(limit = 50) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  return prisma.satCfdiDownload.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { fechaTimbrado: 'desc' },
    take: limit,
  });
}

export async function saveSatCredential(data: { rfc: string; cerFileName: string }) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  await prisma.satCredential.upsert({
    where: { tenantId: session.tenantId },
    create: { tenantId: session.tenantId, rfc: data.rfc, cerFileName: data.cerFileName },
    update: { rfc: data.rfc, cerFileName: data.cerFileName, isValid: false },
  });
  revalidatePath('/sat/buzon');
}

export async function triggerSatDownload() {
  // TODO: Implement SAT Descarga Masiva CFDI
  // Endpoint: https://cfdidescargamasiva.clouda.sat.gob.mx/
  // Requires: e.firma (FIEL) authentication + RFC autorizado
  // PAC integration required for production
  throw new Error('Integración con el SAT en proceso. Contacta soporte para activar la descarga automática del buzón tributario.');
}
