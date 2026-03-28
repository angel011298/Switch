'use server';

/**
 * CIFRA — Caja Chica Server Actions
 * ========================================
 * FASE 16: Gestión de fondo fijo y registro de gastos menores.
 * Genera póliza contable automática por gasto (best-effort).
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createJournalEntryFromInput } from '@/lib/accounting/create-journal';
import type { JournalEntryInput } from '@/lib/accounting/journal-engine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FundSummary {
  id: string;
  name: string;
  fundAmount: number;
  totalGastos: number;     // Suma de gastos del mes
  saldoDisponible: number;
  requiereReposicion: boolean;
  noDeducibles: number;    // Gastos > $2,000 en efectivo (LISR Art. 27)
}

export interface ExpenseRow {
  id: string;
  date: string;
  concept: string;
  amount: number;
  category: string;
  receiptRef: string | null;
  esNoDeducible: boolean;
}

export const CATEGORIES = [
  'Papelería', 'Transporte', 'Viáticos', 'Limpieza',
  'Mensajería', 'Cafetería', 'Herramientas', 'Otros',
];

// ─── FONDO ────────────────────────────────────────────────────────────────────

/**
 * Obtiene el fondo de caja chica activo del tenant.
 * Si no existe, lo crea con un monto por defecto.
 */
export async function getOrCreateFund(defaultAmount = 10_000): Promise<FundSummary> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let fund = await prisma.pettyCashFund.findFirst({
    where: { tenantId: session.tenantId, active: true },
    include: {
      expenses: {
        where: { date: { gte: startOfMonth } },
        select: { amount: true },
      },
    },
  });

  if (!fund) {
    fund = await prisma.pettyCashFund.create({
      data: {
        tenantId: session.tenantId,
        name: 'Caja Chica',
        fundAmount: defaultAmount,
      },
      include: { expenses: { select: { amount: true } } },
    });
  }

  const totalGastos = fund.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldoDisponible = Number(fund.fundAmount) - totalGastos;
  const requiereReposicion = saldoDisponible < Number(fund.fundAmount) * 0.2;

  // Gastos no deducibles (efectivo > $2,000 según LISR Art. 27 fracc. III)
  const allExpenses = await prisma.pettyCashExpense.findMany({
    where: { fundId: fund.id, date: { gte: startOfMonth } },
    select: { amount: true },
  });
  const noDeducibles = allExpenses.filter((e) => Number(e.amount) > 2_000).length;

  return {
    id: fund.id,
    name: fund.name,
    fundAmount: Number(fund.fundAmount),
    totalGastos: round2(totalGastos),
    saldoDisponible: round2(saldoDisponible),
    requiereReposicion,
    noDeducibles,
  };
}

/**
 * Actualiza el monto del fondo fijo.
 */
export async function updateFundAmount(fundId: string, newAmount: number): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const fund = await prisma.pettyCashFund.findUnique({ where: { id: fundId } });
  if (!fund || fund.tenantId !== session.tenantId) throw new Error('Fondo no encontrado');
  if (newAmount <= 0) throw new Error('El monto debe ser mayor a cero');

  await prisma.pettyCashFund.update({
    where: { id: fundId },
    data: { fundAmount: newAmount },
  });

  revalidatePath('/finanzas/caja-chica');
}

// ─── GASTOS ───────────────────────────────────────────────────────────────────

/**
 * Registra un gasto de caja chica y genera póliza contable automática.
 * Cargo:  Gasto (602.01) — monto del gasto
 * Abono:  Caja (101.01)  — salida de efectivo
 */
export async function addExpense(input: {
  fundId: string;
  date: string;
  concept: string;
  amount: number;
  category?: string;
  receiptRef?: string;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const fund = await prisma.pettyCashFund.findUnique({ where: { id: input.fundId } });
  if (!fund || fund.tenantId !== session.tenantId) throw new Error('Fondo no encontrado');
  if (input.amount <= 0) throw new Error('El monto debe ser mayor a cero');
  if (!input.concept.trim()) throw new Error('El concepto es requerido');

  const expense = await prisma.pettyCashExpense.create({
    data: {
      fundId: input.fundId,
      date: new Date(input.date),
      concept: input.concept.trim(),
      amount: input.amount,
      category: input.category ?? 'General',
      receiptRef: input.receiptRef?.trim() || null,
    },
  });

  // ── Póliza contable automática (best-effort) ──
  const journalInput: JournalEntryInput = {
    tenantId: session.tenantId,
    date: new Date(input.date),
    concept: `Caja chica: ${input.concept.trim()}`,
    reference: input.receiptRef ?? expense.id,
    entryType: 'EGRESO',
    sourceType: 'MANUAL',
    lines: [
      {
        accountCode: '602.01',
        description: `Gasto caja chica — ${input.concept}`,
        debit: input.amount,
        credit: 0,
      },
      {
        accountCode: '101.01',
        description: 'Salida de caja chica',
        debit: 0,
        credit: input.amount,
      },
    ],
  };

  try {
    await createJournalEntryFromInput(session.tenantId, journalInput, 'MANUAL', expense.id);
  } catch (err) {
    console.warn('[CajaChica→Accounting] Póliza omitida:', err);
  }

  revalidatePath('/finanzas/caja-chica');
}

/**
 * Lista los gastos de caja chica del mes actual.
 */
export async function getExpenses(fundId: string, months = 1): Promise<ExpenseRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const fund = await prisma.pettyCashFund.findUnique({
    where: { id: fundId },
    select: { tenantId: true },
  });
  if (!fund || fund.tenantId !== session.tenantId) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const expenses = await prisma.pettyCashExpense.findMany({
    where: { fundId, date: { gte: since } },
    orderBy: { date: 'desc' },
  });

  return expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    concept: e.concept,
    amount: Number(e.amount),
    category: e.category,
    receiptRef: e.receiptRef,
    esNoDeducible: Number(e.amount) > 2_000,
  }));
}

/**
 * Elimina un gasto (solo si el fondo pertenece al tenant).
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const expense = await prisma.pettyCashExpense.findUnique({
    where: { id: expenseId },
    include: { fund: { select: { tenantId: true } } },
  });
  if (!expense || expense.fund.tenantId !== session.tenantId) throw new Error('Gasto no encontrado');

  await prisma.pettyCashExpense.delete({ where: { id: expenseId } });
  revalidatePath('/finanzas/caja-chica');
}

// ─── UTILIDAD ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
