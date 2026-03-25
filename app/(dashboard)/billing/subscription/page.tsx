import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import SubscriptionClient from './SubscriptionClient';

export const metadata = { title: 'Suscripción | Switch OS' };

export default async function SubscriptionPage() {
  const session = await getSwitchSession();
  if (!session) redirect('/login');
  if (!session.tenantId) redirect('/dashboard');

  const [tenant, sub, pendingProof] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, rfc: true },
    }),
    prisma.subscription.findUnique({
      where: { tenantId: session.tenantId },
    }),
    prisma.paymentProof.findFirst({
      where: {
        tenantId: session.tenantId,
        status: { in: ['PENDING', 'REJECTED'] },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!tenant) redirect('/dashboard');

  return (
    <SubscriptionClient
      subStatus={sub?.status ?? 'TRIAL'}
      validUntil={sub?.validUntil ?? null}
      pendingProof={
        pendingProof
          ? {
              id: pendingProof.id,
              status: pendingProof.status,
              createdAt: pendingProof.createdAt,
              amount: Number(pendingProof.amount),
              rejectionNote: pendingProof.rejectionNote,
            }
          : null
      }
      tenantName={tenant.name}
      tenantRfc={tenant.rfc}
    />
  );
}
