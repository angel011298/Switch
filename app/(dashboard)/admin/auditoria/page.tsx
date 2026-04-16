import { redirect } from 'next/navigation';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import AuditoriaClient from './AuditoriaClient';

export const metadata = { title: 'Auditoría | CIFRA' };

export default async function AuditoriaPage() {
  const session = await getSwitchSession();
  if (!session?.tenantId && !session?.isSuperAdmin) redirect('/login');

  // Super Admin: todos los logs sin límite de tiempo
  // Tenant regular: últimos 30 días de su propio tenant
  const since = session.isSuperAdmin
    ? undefined
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
      })();

  const [rawLogs, tenants] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(session.isSuperAdmin ? {} : { tenantId: session.tenantId! }),
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: [
        // Ordenar por eventDate si existe, si no por createdAt
        { createdAt: 'desc' },
      ],
      take: 500,
    }),
    // Para el filtro por tenant, solo super admin recibe la lista
    session.isSuperAdmin
      ? prisma.tenant.findMany({
          select: { id: true, name: true, rfc: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  // Mapa de tenantId → nombre para enriquecer logs
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  const logs = rawLogs.map((l) => ({
    id: l.id,
    tenantId: l.tenantId,
    tenantName: tenantMap.get(l.tenantId) ?? undefined,
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
    // FASE 54: campos de evento manual
    eventDate: (l as any).eventDate ? (l as any).eventDate.toISOString() : null,
    isManualEntry: (l as any).isManualEntry ?? false,
    manualNotes: (l as any).manualNotes ?? null,
  }));

  return (
    <AuditoriaClient
      initialLogs={logs}
      tenants={tenants}
      isSuperAdmin={session.isSuperAdmin}
    />
  );
}
