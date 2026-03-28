/**
 * GET /api/admin/audit-logs
 * ==========================
 * Devuelve los registros de auditoría del tenant (o todos si es Super Admin).
 * Query params:
 *   ?severity=info|warning|critical  (opcional)
 *   ?action=ROLE_CHANGE              (opcional)
 *   ?days=7                          (opcional, default 30)
 *   ?limit=100                       (opcional, default 50)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sp       = req.nextUrl.searchParams;
    const severity = sp.get('severity') ?? undefined;
    const action   = sp.get('action')   ?? undefined;
    const days     = parseInt(sp.get('days')  ?? '30', 10);
    const limit    = parseInt(sp.get('limit') ?? '50',  10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Record<string, unknown> = {
      tenantId:  session.isSuperAdmin ? undefined : session.tenantId,
      createdAt: { gte: since },
      ...(severity ? { severity } : {}),
      ...(action   ? { action }   : {}),
    };

    // Super admin ve todos los tenants; usuarios normales solo ven el suyo
    if (!session.isSuperAdmin) {
      where.tenantId = session.tenantId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      select: {
        id: true, tenantId: true,
        actorId: true, actorName: true, actorEmail: true,
        action: true, resource: true, resourceId: true,
        oldData: true, newData: true,
        ip: true, userAgent: true, severity: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('[audit-logs]', err);
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 });
  }
}
