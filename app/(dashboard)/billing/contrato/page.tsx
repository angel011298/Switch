import { getSwitchSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ContratoClient from './ContratoClient';
import prisma from '@/lib/prisma';
import { PersonType } from '@prisma/client';

export const metadata = {
  title: 'Contrato de Licenciamiento | CIFRA',
};

export default async function ContratoPage() {
  const session = await getSwitchSession();
  if (!session?.userId) redirect('/login');
  if (!session.tenantId) redirect('/dashboard');

  // Obtener tipo de persona del tenant para pre-seleccionar
  const tenant = await prisma.tenant.findUnique({
    where:  { id: session.tenantId },
    select: { personType: true },
  });

  return (
    <ContratoClient
      initialPersonType={(tenant?.personType as PersonType) ?? null}
      tenantEmail={session.email}
    />
  );
}
