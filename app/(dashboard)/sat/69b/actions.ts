'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function get69bCache() {
  await getSwitchSession();
  return prisma.rfc69bValidation.findMany({ orderBy: { checkedAt: 'desc' }, take: 100 });
}

export async function validate69B(rfc: string) {
  await getSwitchSession();
  const rfcClean = rfc.trim().toUpperCase().replace(/\s/g, '');

  // Check fresh cache (24h TTL)
  const cached = await prisma.rfc69bValidation.findUnique({ where: { rfc: rfcClean } });
  if (cached && cached.expiresAt > new Date()) return cached;

  // TODO: Real SAT 69-B integration
  // SAT API: https://siat.sat.gob.mx/app/qde/consultaRFC.jsf
  // Production: requires PAC authorization + SOAP/REST SAT endpoint
  // Current: returns CLEAN with notice (simulation for development)
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  const result = await prisma.rfc69bValidation.upsert({
    where: { rfc: rfcClean },
    create: {
      rfc: rfcClean,
      status: 'CLEAN',
      satMessage: `RFC ${rfcClean} — No localizado en listas definitivas o presuntos del artículo 69-B CFF. (Consulta simulada — integración real con SAT en proceso)`,
      checkedAt: new Date(),
      expiresAt: expires,
    },
    update: {
      status: 'CLEAN',
      satMessage: `RFC ${rfcClean} — No localizado en listas definitivas o presuntos del artículo 69-B CFF. (Consulta simulada — integración real con SAT en proceso)`,
      checkedAt: new Date(),
      expiresAt: expires,
    },
  });
  revalidatePath('/sat/69b');
  return result;
}
