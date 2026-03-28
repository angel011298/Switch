/**
 * CIFRA — Calendar API
 * =====================
 * FASE 30: CRUD de CalendarEvent
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET /api/calendar?from=ISO&to=ISO
export async function GET(req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(new Date().setDate(1));
  const to   = searchParams.get('to')   ? new Date(searchParams.get('to')!)   : new Date(new Date().setMonth(new Date().getMonth() + 1));

  const events = await prisma.calendarEvent.findMany({
    where: {
      tenantId: session.tenantId,
      start: { gte: from, lte: to },
    },
    orderBy: { start: 'asc' },
  });

  return NextResponse.json(events.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    allDay: e.allDay,
    type: e.type,
    color: e.color ?? getDefaultColor(e.type),
    relatedId: e.relatedId,
    relatedType: e.relatedType,
  })));
}

// POST /api/calendar
export async function POST(req: NextRequest) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
  if (!body.start || !body.end) return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 });

  const event = await prisma.calendarEvent.create({
    data: {
      tenantId:    session.tenantId,
      userId:      session.userId ?? null,
      title:       body.title.trim(),
      description: body.description?.trim() || null,
      start:       new Date(body.start),
      end:         new Date(body.end),
      allDay:      body.allDay ?? false,
      type:        body.type ?? 'MANUAL',
      color:       body.color || null,
      relatedId:   body.relatedId || null,
      relatedType: body.relatedType || null,
    },
  });

  return NextResponse.json({ id: event.id }, { status: 201 });
}

function getDefaultColor(type: string): string {
  const map: Record<string, string> = {
    MANUAL:        '#6366f1',
    INVOICE_DUE:   '#ef4444',
    PAYROLL_DATE:  '#10b981',
    DEAL_FOLLOWUP: '#f59e0b',
    DELIVERY:      '#3b82f6',
  };
  return map[type] ?? '#6366f1';
}
