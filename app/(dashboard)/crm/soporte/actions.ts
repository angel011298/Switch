'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  customerId: string | null;
  customerName: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface TicketDetail extends TicketRow {
  messages: {
    id: string;
    authorName: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
  }[];
}

export async function getTickets(): Promise<TicketRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const tickets = await prisma.supportTicket.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      customer: { select: { legalName: true } },
      _count: { select: { messages: true } },
    },
  });

  return tickets.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    customerId: t.customerId,
    customerName: t.customer?.legalName ?? null,
    messageCount: t._count.messages,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
  }));
}

export async function getTicketDetail(id: string): Promise<TicketDetail | null> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: { select: { legalName: true } },
      messages: { orderBy: { createdAt: 'asc' } },
      _count: { select: { messages: true } },
    },
  });

  if (!ticket || ticket.tenantId !== session.tenantId) return null;

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    customerId: ticket.customerId,
    customerName: ticket.customer?.legalName ?? null,
    messageCount: ticket._count.messages,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    messages: ticket.messages.map(m => ({
      id: m.id,
      authorName: m.authorName,
      body: m.body,
      isInternal: m.isInternal,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function createTicket(input: {
  title: string;
  description?: string;
  priority?: string;
  customerId?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (!input.title.trim()) throw new Error('El título es requerido');

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId:    session.tenantId,
      title:       input.title.trim(),
      description: input.description?.trim() || null,
      priority:    input.priority ?? 'MEDIUM',
      customerId:  input.customerId || null,
    },
    select: { id: true },
  });

  revalidatePath('/crm/soporte');
  return ticket.id;
}

export async function addMessage(ticketId: string, input: {
  body: string;
  isInternal?: boolean;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.tenantId !== session.tenantId) throw new Error('Ticket no encontrado');

  await prisma.supportMessage.create({
    data: {
      ticketId,
      authorId:   session.userId ?? null,
      authorName: 'Agente',
      body:       input.body.trim(),
      isInternal: input.isInternal ?? false,
    },
  });

  // Auto-transition: OPEN → IN_PROGRESS on first reply
  if (ticket.status === 'OPEN') {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'IN_PROGRESS' },
    });
  }

  revalidatePath('/crm/soporte');
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.tenantId !== session.tenantId) throw new Error('Ticket no encontrado');

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
    },
  });

  revalidatePath('/crm/soporte');
}
