/**
 * GET /api/notifications
 * Devuelve las últimas 30 notificaciones del usuario actual (leídas y no leídas).
 * Query: ?unread=1 → solo no leídas
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const onlyUnread = req.nextUrl.searchParams.get('unread') === '1';

  const notifications = await prisma.notification.findMany({
    where: {
      tenantId: session.tenantId,
      OR: [
        { userId: session.userId },
        { userId: null },          // broadcast a todo el tenant
      ],
      ...(onlyUnread ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      tenantId: session.tenantId,
      OR: [{ userId: session.userId }, { userId: null }],
      read: false,
    },
  });

  return NextResponse.json({ notifications, unreadCount });
}
