import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import AuditoriaClient from './AuditoriaClient';

export const metadata = { title: 'Auditoría | CIFRA' };

export default async function AuditoriaPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId) redirect('/login');

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rawLogs = await prisma.auditLog.findMany({
    where: {
      ...(session.isSuperAdmin ? {} : { tenantId: session.tenantId }),
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const logs = rawLogs.map((l) => ({
    id: l.id,
    tenantId: l.tenantId,
    actorId: l.actorId ?? '',
    actorName: l.actorName ?? 'Sistema',
    actorEmail: l.actorEmail ?? '',
    action: l.action,
    resource: l.resource,
    resourceId: l.resourceId ?? '',
    oldData: l.oldData as Record<string, unknown> | null,
    newData: l.newData as Record<string, unknown> | null,
    ip: l.ip ?? '',
    userAgent: l.userAgent ?? '',
    severity: l.severity as 'info' | 'warning' | 'critical',
    createdAt: l.createdAt.toISOString(),
  }));

  return <AuditoriaClient initialLogs={logs} />;
}
