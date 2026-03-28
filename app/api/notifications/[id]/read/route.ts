/**
 * PATCH /api/notifications/[id]/read
 * Marca una notificación como leída.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await prisma.notification.updateMany({
    where: {
      id: params.id,
      tenantId: session.tenantId,
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
