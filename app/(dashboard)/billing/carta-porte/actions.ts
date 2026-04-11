'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCartaPortes() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  return prisma.cartaPorte.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export type CartaPorteInput = {
  viaTransporte?: string;
  origenCp: string;
  origenDomicilio?: string;
  destinoCp: string;
  destinoDomicilio?: string;
  fechaSalidaLlegada: string;
  totalDistRec: number;
  rfcTransportista?: string;
  numPlacas?: string;
  configVehicular?: string;
  rfcOperador?: string;
  nombreOperador?: string;
  numLicencia?: string;
  mercancias: { clave: string; descripcion: string; cantidad: number; pesoKg: number; valorMercancia: number }[];
};

export async function createCartaPorte(data: CartaPorteInput) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  await prisma.cartaPorte.create({
    data: {
      tenantId: session.tenantId,
      viaTransporte: data.viaTransporte ?? '01',
      origenCp: data.origenCp,
      origenDomicilio: data.origenDomicilio,
      destinoCp: data.destinoCp,
      destinoDomicilio: data.destinoDomicilio,
      fechaSalidaLlegada: new Date(data.fechaSalidaLlegada),
      totalDistRec: data.totalDistRec,
      rfcTransportista: data.rfcTransportista,
      numPlacas: data.numPlacas,
      configVehicular: data.configVehicular,
      rfcOperador: data.rfcOperador,
      nombreOperador: data.nombreOperador,
      numLicencia: data.numLicencia,
      mercancias: JSON.stringify(data.mercancias),
      status: 'DRAFT',
    },
  });
  revalidatePath('/billing/carta-porte');
}

export async function timbrarCartaPorte(id: string) {
  // TODO: Integrate with PAC (Proveedor Autorizado de Certificación) for Carta Porte 3.0
  // Required: CSD (.cer + .key) del emisor + PAC API credentials
  // PAC options: Facturama, SW Sapien, Diverza, Quadrum, etc.
  throw new Error('El timbrado de Carta Porte requiere configurar un PAC en Configuración > CSD. Consulta soporte.');
}
