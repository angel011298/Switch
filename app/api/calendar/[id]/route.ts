import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// PUT /api/calendar/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!event || event.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const body = await req.json();

  const updated = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      ...(body.title       !== undefined && { title:       body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.start       !== undefined && { start:       new Date(body.start) }),
      ...(body.end         !== undefined && { end:         new Date(body.end) }),
      ...(body.allDay      !== undefined && { allDay:      body.allDay }),
      ...(body.type        !== undefined && { type:        body.type }),
      ...(body.color       !== undefined && { color:       body.color }),
    },
  });

  return NextResponse.json({ id: updated.id });
}

// DELETE /api/calendar/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!event || event.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
