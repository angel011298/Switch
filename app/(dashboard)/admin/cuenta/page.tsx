/**
 * CIFRA — Admin: Mi Cuenta
 * ==========================
 * Server Component: carga datos reales del tenant y del usuario
 * super-admin desde la DB, luego delega toda la UI interactiva
 * al AccountClient (client component).
 *
 * Solo accesible por isSuperAdmin === true.
 */

import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import AccountClient from './AccountClient';
import type { AccountInitialData } from './AccountClient';

export default async function MyAccountPage() {
  const session = await getSwitchSession();

  if (!session?.isSuperAdmin) {
    redirect('/dashboard');
  }

  // Cargar datos del tenant y del usuario en paralelo
  const [tenant, user] = await Promise.all([
    session.tenantId
      ? prisma.tenant.findUnique({
          where: { id: session.tenantId },
          select: {
            name:        true,
            legalName:   true,
            rfc:         true,
            taxRegimeId: true,
            zipCode:     true,
          },
        })
      : null,
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, phone: true },
    }),
  ]);

  const initialData: AccountInitialData = {
    tenant: tenant ?? null,
    user:   user   ?? null,
    email:  session.email,
  };

  return <AccountClient initialData={initialData} />;
}
