'use server';

/**
 * CIFRA — Tesorería Server Actions
 * ==========================================
 * FASE 52: Gestión de cuentas bancarias, movimientos, conciliación y caja chica.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeData } from '@/lib/security/sanitizer';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

import {
  type BankAccountRow,
  type TreasuryTransactionRow,
  type PettyCashFundRow,
  type PettyCashExpenseRow,
  type PettyCashReplenishmentRow,
  type TreasurySummary,
  TREASURY_CATEGORIES,
  PETTY_CASH_CATEGORIES,
  ACCOUNT_TYPES
} from './types';

// ─── Lectura: Resumen de tesorería ────────────────────────────────────────────

export async function getTreasurySummary(): Promise<TreasurySummary> {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return { totalBalance: 0, ingresosMes: 0, egresosMes: 0, flujoNeto: 0, accounts: [] };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [accounts, monthlyTx] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { bankName: 'asc' },
    }),
    prisma.treasuryTransaction.findMany({
      where: {
        tenantId: session.tenantId,
        date: { gte: startOfMonth },
      },
      select: { type: true, amount: true },
    }),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
  const ingresosMes = monthlyTx
    .filter((t) => t.type === 'INGRESO')
    .reduce((s, t) => s + Number(t.amount), 0);
  const egresosMes = monthlyTx
    .filter((t) => t.type === 'EGRESO')
    .reduce((s, t) => s + Number(t.amount), 0);

  return {
    totalBalance: round2(totalBalance),
    ingresosMes: round2(ingresosMes),
    egresosMes: round2(egresosMes),
    flujoNeto: round2(ingresosMes - egresosMes),
    accounts: accounts.map(mapBankAccount),
  };
}

// ─── Lectura: Movimientos ─────────────────────────────────────────────────────

export async function getTreasuryTransactions(filters?: {
  bankAccountId?: string;
  type?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TreasuryTransactionRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const where: Record<string, unknown> = { tenantId: session.tenantId };

  if (filters?.bankAccountId) where.bankAccountId = filters.bankAccountId;
  if (filters?.type) where.type = filters.type;
  if (filters?.category) where.category = filters.category;
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + 'T23:59:59') } : {}),
    };
  }

  const transactions = await prisma.treasuryTransaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 200,
    include: {
      bankAccount: { select: { bankName: true, alias: true } },
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    bankAccountId: t.bankAccountId,
    bankName: t.bankAccount.bankName,
    bankAlias: t.bankAccount.alias,
    date: t.date.toISOString(),
    concept: t.concept,
    type: t.type,
    amount: Number(t.amount),
    balance: Number(t.balance),
    reference: t.reference,
    category: t.category,
    isReconciled: t.isReconciled,
    invoiceId: t.invoiceId,
  }));
}

// ─── Lectura: Fondos de caja chica ───────────────────────────────────────────

export async function getPettyCashFunds(): Promise<PettyCashFundRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const funds = await prisma.pettyCashFund.findMany({
    where: { tenantId: session.tenantId, active: true },
    include: {
      expenses: {
        where: { status: 'PENDIENTE' },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return funds.map((f) => {
    const totalPending = f.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const saldoDisponible = Number(f.fundAmount) - totalPending;
    const minBalance = Number(f.minimumBalance ?? Number(f.fundAmount) * 0.2);

    return {
      id: f.id,
      name: f.name,
      description: f.description,
      fundAmount: Number(f.fundAmount),
      minimumBalance: minBalance,
      active: f.active,
      custodianName: f.custodianName,
      custodianEmail: f.custodianEmail,
      lastAuditAt: f.lastAuditAt?.toISOString() ?? null,
      lastAuditBalance: f.lastAuditBalance ? Number(f.lastAuditBalance) : null,
      saldoDisponible: round2(saldoDisponible),
      totalPendingExpenses: round2(totalPending),
      requiereReposicion: saldoDisponible < minBalance,
    };
  });
}

export async function getPettyCashExpenses(fundId: string): Promise<PettyCashExpenseRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const fund = await prisma.pettyCashFund.findUnique({
    where: { id: fundId },
    select: { tenantId: true },
  });
  if (!fund || fund.tenantId !== session.tenantId) return [];

  const expenses = await prisma.pettyCashExpense.findMany({
    where: { fundId },
    orderBy: { date: 'desc' },
    take: 100,
  });

  return expenses.map((e) => ({
    id: e.id,
    fundId: e.fundId,
    date: e.date.toISOString(),
    concept: e.concept,
    amount: Number(e.amount),
    category: e.category,
    costCenter: e.costCenter,
    receiptRef: e.receiptRef,
    status: e.status,
    xmlValidated: e.xmlValidated,
    providerRfc: e.providerRfc,
  }));
}

// ─── Mutaciones: Cuentas bancarias ───────────────────────────────────────────

export async function createBankAccount(data: {
  bankName: string;
  alias: string;
  accountNumber: string;
  clabe?: string;
  currency?: string;
  accountType?: string;
  currentBalance?: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const sanitized = sanitizeData(data);

    if (!data.bankName.trim()) return { ok: false, error: 'El banco es requerido' };
    if (!data.alias.trim()) return { ok: false, error: 'El alias es requerido' };
    if (!data.accountNumber.trim()) return { ok: false, error: 'El número de cuenta es requerido' };

    const account = await prisma.bankAccount.create({
      data: {
        tenantId: session.tenantId,
        bankName: sanitized.bankName,
        alias: sanitized.alias,
        accountNumber: sanitized.accountNumber,
        clabe: sanitized.clabe || null,
        currency: sanitized.currency ?? 'MXN',
        accountType: sanitized.accountType ?? 'CHEQUES',
        currentBalance: sanitized.currentBalance ?? 0,
        notes: sanitized.notes || null,
      },
    });

    revalidatePath('/finanzas/tesoreria');
    return { ok: true, id: account.id };
  } catch (err: unknown) {
    console.error('[createBankAccount]', err);
    return { ok: false, error: 'Error al crear la cuenta bancaria' };
  }
}

// ─── Mutaciones: Movimientos bancarios ───────────────────────────────────────

export async function createTreasuryTransaction(data: {
  bankAccountId: string;
  date: string;
  concept: string;
  type: string;
  amount: number;
  reference?: string;
  category?: string;
  notes?: string;
  invoiceId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const sanitized = sanitizeData(data);

    if (!sanitized.concept) return { ok: false, error: 'El concepto es requerido' };
    if (sanitized.amount <= 0) return { ok: false, error: 'El importe debe ser mayor a cero' };

    const account = await prisma.bankAccount.findUnique({
      where: { id: sanitized.bankAccountId },
      select: { tenantId: true, currentBalance: true },
    });
    if (!account || account.tenantId !== session.tenantId) {
      return { ok: false, error: 'Cuenta no encontrada' };
    }

    const prevBalance = Number(account.currentBalance);
    const newBalance =
      sanitized.type === 'INGRESO'
        ? prevBalance + sanitized.amount
        : prevBalance - sanitized.amount;

    await prisma.$transaction([
      prisma.treasuryTransaction.create({
        data: {
          tenantId: session.tenantId,
          bankAccountId: sanitized.bankAccountId,
          date: new Date(sanitized.date),
          concept: sanitized.concept,
          type: sanitized.type,
          amount: sanitized.amount,
          balance: newBalance,
          reference: sanitized.reference || null,
          category: sanitized.category || null,
          invoiceId: sanitized.invoiceId || null,
        },
      }),
      prisma.bankAccount.update({
        where: { id: sanitized.bankAccountId },
        data: { currentBalance: newBalance },
      }),
    ]);

    revalidatePath('/finanzas/tesoreria');
    return { ok: true };
  } catch (err: unknown) {
    console.error('[createTreasuryTransaction]', err);
    return { ok: false, error: 'Error al registrar el movimiento' };
  }
}

export async function reconcileTransaction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const tx = await prisma.treasuryTransaction.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!tx || tx.tenantId !== session.tenantId) {
      return { ok: false, error: 'Movimiento no encontrado' };
    }

    await prisma.treasuryTransaction.update({
      where: { id },
      data: { isReconciled: true, reconciledAt: new Date() },
    });

    revalidatePath('/finanzas/tesoreria');
    return { ok: true };
  } catch (err: unknown) {
    console.error('[reconcileTransaction]', err);
    return { ok: false, error: 'Error al conciliar el movimiento' };
  }
}

// ─── Mutaciones: Caja chica ───────────────────────────────────────────────────

export async function createPettyCashExpense(data: {
  fundId: string;
  date: string;
  concept: string;
  amount: number;
  category?: string;
  costCenter?: string;
  receiptRef?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const sanitized = sanitizeData(data);

    if (!sanitized.concept) return { ok: false, error: 'El concepto es requerido' };
    if (sanitized.amount <= 0) return { ok: false, error: 'El importe debe ser mayor a cero' };

    const fund = await prisma.pettyCashFund.findUnique({
      where: { id: sanitized.fundId },
      select: { tenantId: true },
    });
    if (!fund || fund.tenantId !== session.tenantId) {
      return { ok: false, error: 'Fondo no encontrado' };
    }

    await prisma.pettyCashExpense.create({
      data: {
        fundId: sanitized.fundId,
        date: new Date(sanitized.date),
        concept: sanitized.concept,
        amount: sanitized.amount,
        category: sanitized.category ?? 'Otros',
        costCenter: sanitized.costCenter || null,
        receiptRef: sanitized.receiptRef || null,
        status: 'PENDIENTE',
      },
    });

    revalidatePath('/finanzas/tesoreria');
    return { ok: true };
  } catch (err: unknown) {
    console.error('[createPettyCashExpense]', err);
    return { ok: false, error: 'Error al registrar el gasto' };
  }
}

export async function requestReplenishment(
  fundId: string,
  amount: number,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    if (amount <= 0) return { ok: false, error: 'El monto debe ser mayor a cero' };

    const fund = await prisma.pettyCashFund.findUnique({
      where: { id: fundId },
      select: { tenantId: true },
    });
    if (!fund || fund.tenantId !== session.tenantId) {
      return { ok: false, error: 'Fondo no encontrado' };
    }

    await prisma.pettyCashReplenishment.create({
      data: {
        fundId,
        amount,
        notes: notes?.trim() || null,
        status: 'SOLICITADA',
      },
    });

    revalidatePath('/finanzas/tesoreria');
    return { ok: true };
  } catch (err: unknown) {
    console.error('[requestReplenishment]', err);
    return { ok: false, error: 'Error al solicitar la reposición' };
  }
}

export async function approvePettyCashExpense(
  id: string,
  status: 'APROBADO' | 'RECHAZADO'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const expense = await prisma.pettyCashExpense.findUnique({
      where: { id },
      include: { fund: { select: { tenantId: true } } },
    });
    if (!expense || expense.fund.tenantId !== session.tenantId) {
      return { ok: false, error: 'Gasto no encontrado' };
    }

    await prisma.pettyCashExpense.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/finanzas/tesoreria');
    return { ok: true };
  } catch (err: unknown) {
    console.error('[approvePettyCashExpense]', err);
    return { ok: false, error: 'Error al actualizar el estado' };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapBankAccount(a: {
  id: string;
  bankName: string;
  alias: string;
  accountNumber: string;
  clabe: string | null;
  currency: string;
  accountType: string;
  currentBalance: { toString(): string };
  isActive: boolean;
  notes: string | null;
}): BankAccountRow {
  return {
    id: a.id,
    bankName: a.bankName,
    alias: a.alias,
    accountNumber: a.accountNumber,
    clabe: a.clabe,
    currency: a.currency,
    accountType: a.accountType,
    currentBalance: Number(a.currentBalance),
    isActive: a.isActive,
    notes: a.notes,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
