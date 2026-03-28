/**
 * PATCH /api/notifications/read-all
 * Marca todas las notificaciones del usuario como leídas.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(_req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await prisma.notification.updateMany({
    where: {
      tenantId: session.tenantId,
      OR: [{ userId: session.userId }, { userId: null }],
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
