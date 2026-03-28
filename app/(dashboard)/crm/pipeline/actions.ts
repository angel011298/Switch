'use server';

/**
 * CIFRA — CRM Pipeline Server Actions
 * =========================================
 * FASE 18: Tablero Kanban de oportunidades de venta.
 *
 * - Pipeline con columnas configurables (por defecto 5 etapas)
 * - Deals/oportunidades con valor, probabilidad y fecha de cierre
 * - Mover deals entre columnas (drag & drop simulado)
 * - KPIs del pipeline: pipeline value, win rate, avg deal size
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { notifyDealWon } from '@/lib/notifications/trigger';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface ColumnWithDeals {
  id: string;
  name: string;
  position: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
  deals: DealRow[];
  totalValue: number;
}

export interface DealRow {
  id: string;
  title: string;
  value: number;
  probability: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  expectedCloseDate: string | null;
  wonAt: string | null;
  lostAt: string | null;
  customerName: string | null;
  customerRfc: string | null;
  position: number;
  columnId: string;
  createdAt: string;
}

export interface PipelineKpis {
  totalPipelineValue: number;   // Σ valor de deals activos (no perdidos)
  weightedValue: number;        // Σ (valor × probabilidad)
  dealsCount: number;           // Total deals activos
  wonDealsCount: number;
  lostDealsCount: number;
  winRate: number;              // won / (won + lost) × 100
  avgDealSize: number;
}

// Columnas por defecto (se crean en el primer acceso)
const DEFAULT_COLUMNS = [
  { name: 'Prospecto',    position: 0, color: '#6366f1', isWon: false, isLost: false },
  { name: 'Calificado',   position: 1, color: '#8b5cf6', isWon: false, isLost: false },
  { name: 'Propuesta',    position: 2, color: '#a855f7', isWon: false, isLost: false },
  { name: 'Negociación',  position: 3, color: '#d946ef', isWon: false, isLost: false },
  { name: 'Ganado',       position: 4, color: '#10b981', isWon: true,  isLost: false },
  { name: 'Perdido',      position: 5, color: '#6b7280', isWon: false, isLost: true  },
];

// ─── PIPELINE ─────────────────────────────────────────────────────────────────

/**
 * Obtiene el pipeline completo del tenant.
 * Crea las 6 columnas por defecto si no existen.
 */
export async function getPipelineWithDeals(): Promise<ColumnWithDeals[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  // Asegurar que existen columnas
  const count = await prisma.pipelineColumn.count({ where: { tenantId: session.tenantId } });
  if (count === 0) {
    const tid = session.tenantId;
    await prisma.pipelineColumn.createMany({
      data: DEFAULT_COLUMNS.map((col) => ({ ...col, tenantId: tid })),
    });
  }

  const columns = await prisma.pipelineColumn.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { position: 'asc' },
    include: {
      deals: {
        orderBy: { position: 'asc' },
        include: {
          customer: { select: { legalName: true, rfc: true } },
        },
      },
    },
  });

  return columns.map((col) => ({
    id:       col.id,
    name:     col.name,
    position: col.position,
    color:    col.color,
    isWon:    col.isWon,
    isLost:   col.isLost,
    totalValue: col.deals.reduce((s, d) => s + Number(d.value), 0),
    deals: col.deals.map((d) => ({
      id:         d.id,
      title:      d.title,
      value:      Number(d.value),
      probability: d.probability,
      contactName:  d.contactName,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone,
      notes:        d.notes,
      expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
      wonAt:   d.wonAt?.toISOString()  ?? null,
      lostAt:  d.lostAt?.toISOString() ?? null,
      customerName: d.customer?.legalName ?? null,
      customerRfc:  d.customer?.rfc  ?? null,
      position: d.position,
      columnId: d.columnId,
      createdAt: d.createdAt.toISOString(),
    })),
  }));
}

export async function getPipelineKpis(): Promise<PipelineKpis> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return emptyKpis();

  const [wonCol, lostCol] = await Promise.all([
    prisma.pipelineColumn.findFirst({ where: { tenantId: session.tenantId, isWon: true  }, select: { id: true } }),
    prisma.pipelineColumn.findFirst({ where: { tenantId: session.tenantId, isLost: true }, select: { id: true } }),
  ]);

  const allDeals = await prisma.deal.findMany({
    where: { tenantId: session.tenantId },
    select: { value: true, probability: true, columnId: true },
  });

  const wonDeals  = wonCol  ? allDeals.filter((d) => d.columnId === wonCol.id)  : [];
  const lostDeals = lostCol ? allDeals.filter((d) => d.columnId === lostCol.id) : [];
  const activeDeals = allDeals.filter((d) =>
    d.columnId !== wonCol?.id && d.columnId !== lostCol?.id
  );

  const totalPipelineValue = activeDeals.reduce((s, d) => s + Number(d.value), 0);
  const weightedValue      = activeDeals.reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);
  const wonValue           = wonDeals.reduce((s, d) => s + Number(d.value), 0);

  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? (wonDeals.length / closedCount) * 100 : 0;
  const avgDealSize = allDeals.length > 0
    ? allDeals.reduce((s, d) => s + Number(d.value), 0) / allDeals.length
    : 0;

  return {
    totalPipelineValue: round2(totalPipelineValue),
    weightedValue:      round2(weightedValue),
    dealsCount:         activeDeals.length,
    wonDealsCount:      wonDeals.length,
    lostDealsCount:     lostDeals.length,
    winRate:            round2(winRate),
    avgDealSize:        round2(avgDealSize),
  };
}

// ─── DEALS CRUD ───────────────────────────────────────────────────────────────

export async function createDeal(input: {
  title: string;
  columnId: string;
  value?: number;
  probability?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  expectedCloseDate?: string;
  customerId?: string;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (!input.title.trim()) throw new Error('El título es requerido');

  const column = await prisma.pipelineColumn.findUnique({ where: { id: input.columnId } });
  if (!column || column.tenantId !== session.tenantId) throw new Error('Columna no encontrada');

  // Posición al final de la columna
  const lastDeal = await prisma.deal.findFirst({
    where:   { columnId: input.columnId },
    orderBy: { position: 'desc' },
    select:  { position: true },
  });

  await prisma.deal.create({
    data: {
      tenantId:     session.tenantId,
      columnId:     input.columnId,
      title:        input.title.trim(),
      value:        input.value ?? 0,
      probability:  Math.min(100, Math.max(0, input.probability ?? 50)),
      contactName:  input.contactName?.trim()  || null,
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      notes:        input.notes?.trim()        || null,
      customerId:   input.customerId || null,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      position:     (lastDeal?.position ?? -1) + 1,
    },
  });

  revalidatePath('/crm/pipeline');
}

/**
 * Mueve un deal a otra columna.
 * Si la columna destino es "Ganado" o "Perdido" actualiza los campos de cierre.
 */
export async function moveDeal(dealId: string, targetColumnId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.tenantId !== session.tenantId) throw new Error('Deal no encontrado');

  const targetColumn = await prisma.pipelineColumn.findUnique({ where: { id: targetColumnId } });
  if (!targetColumn || targetColumn.tenantId !== session.tenantId) throw new Error('Columna no encontrada');

  // Posición al final de la columna destino
  const last = await prisma.deal.findFirst({
    where:   { columnId: targetColumnId },
    orderBy: { position: 'desc' },
    select:  { position: true },
  });

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      columnId: targetColumnId,
      position: (last?.position ?? -1) + 1,
      wonAt:    targetColumn.isWon  ? new Date() : null,
      lostAt:   targetColumn.isLost ? new Date() : null,
    },
  });

  // ── Notificación: deal ganado ─────────────────────────────────────────────
  if (targetColumn.isWon) {
    notifyDealWon({
      tenantId: session.tenantId,
      userId:   session.userId,
      dealName: deal.title,
      amount:   Number(deal.value ?? 0),
    }).catch(() => {});
  }

  revalidatePath('/crm/pipeline');
}

export async function updateDeal(dealId: string, input: {
  title?: string;
  value?: number;
  probability?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  expectedCloseDate?: string | null;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.tenantId !== session.tenantId) throw new Error('Deal no encontrado');

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      ...(input.title        !== undefined && { title:       input.title.trim() }),
      ...(input.value        !== undefined && { value:       input.value }),
      ...(input.probability  !== undefined && { probability: Math.min(100, Math.max(0, input.probability)) }),
      ...(input.contactName  !== undefined && { contactName:  input.contactName?.trim()  || null }),
      ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail?.trim() || null }),
      ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone?.trim() || null }),
      ...(input.notes        !== undefined && { notes:        input.notes?.trim()        || null }),
      ...(input.expectedCloseDate !== undefined && {
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      }),
    },
  });

  revalidatePath('/crm/pipeline');
}

export async function deleteDeal(dealId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.tenantId !== session.tenantId) throw new Error('Deal no encontrado');

  await prisma.deal.delete({ where: { id: dealId } });
  revalidatePath('/crm/pipeline');
}

// ─── CLIENTES para selector ───────────────────────────────────────────────────

export async function getCustomersForSelect(): Promise<Array<{ id: string; legalName: string; rfc: string }>> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  return prisma.customer.findMany({
    where:   { tenantId: session.tenantId, isActive: true },
    orderBy: { legalName: 'asc' },
    select:  { id: true, legalName: true, rfc: true },
  });
}

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

function emptyKpis(): PipelineKpis {
  return { totalPipelineValue: 0, weightedValue: 0, dealsCount: 0, wonDealsCount: 0, lostDealsCount: 0, winRate: 0, avgDealSize: 0 };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
