/**
 * GET /api/admin/audit-logs
 * ==========================
 * Devuelve los registros de auditoría del tenant (o todos si es Super Admin).
 * Query params:
 *   ?severity=info|warning|critical  (opcional)
 *   ?action=ROLE_CHANGE              (opcional)
 *   ?days=7                          (opcional, default 30; 9999 = todo)
 *   ?limit=500                       (opcional, default 200)
 *   ?tenantId=uuid                   (solo super admin)
 *   ?onlyManual=true                 (solo eventos manuales)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId && !session?.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sp         = req.nextUrl.searchParams;
    const severity   = sp.get('severity')   ?? undefined;
    const action     = sp.get('action')     ?? undefined;
    const days       = parseInt(sp.get('days')  ?? '30', 10);
    const limit      = parseInt(sp.get('limit') ?? '200', 10);
    const tenantIdQ  = sp.get('tenantId')   ?? undefined;
    const onlyManual = sp.get('onlyManual') === 'true';

    const where: Record<string, unknown> = {};

    // Filtro de tenant
    if (session.isSuperAdmin) {
      if (tenantIdQ) where.tenantId = tenantIdQ;
      // Si no se especifica, devuelve todos
    } else {
      where.tenantId = session.tenantId;
    }

    // Filtro temporal (9999 = sin límite)
    if (days < 9999) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      where.createdAt = { gte: since };
    }

    if (severity)   where.severity      = severity;
    if (action)     where.action        = action;
    if (onlyManual) where.isManualEntry = true;

    const rawLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      select: {
        id: true, tenantId: true,
        actorId: true, actorName: true, actorEmail: true,
        action: true, resource: true, resourceId: true,
        oldData: true, newData: true,
        ip: true, userAgent: true, severity: true,
        createdAt: true,
        // FASE 54: campos evento manual
        eventDate: true,
        isManualEntry: true,
        manualNotes: true,
      },
    });

    // Enriquecer con nombre del tenant (solo super admin)
    let tenantMap: Map<string, string> = new Map();
    if (session.isSuperAdmin) {
      const tenantIds = [...new Set(rawLogs.map((l) => l.tenantId))];
      if (tenantIds.length > 0) {
        const tenants = await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true },
        });
        tenantMap = new Map(tenants.map((t) => [t.id, t.name]));
      }
    }

    const logs = rawLogs.map((l) => ({
      ...l,
      tenantName: tenantMap.get(l.tenantId),
      createdAt: l.createdAt.toISOString(),
      eventDate: l.eventDate ? l.eventDate.toISOString() : null,
    }));

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('[audit-logs]', err);
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 });
  }
}
