'use server';

/**
 * CIFRA — Nómina Server Actions
 * ===================================
 * FASE 15: Cálculo, almacenamiento y cierre de corridas de nómina.
 * Genera póliza contable automática al cerrar el período.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notifyPayrollReady } from '@/lib/notifications/trigger';
import {
  calculateEmployeePayroll,
  buildPeriod,
  type PeriodType,
} from '@/lib/payroll/calculator';
import { createJournalEntryFromInput } from '@/lib/accounting/create-journal';
import type { JournalEntryInput } from '@/lib/accounting/journal-engine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PayrollRunSummary {
  id: string;
  period: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  status: string;
  totalBruto: number;
  totalISR: number;
  totalIMSS: number;
  totalNeto: number;
  employeeCount: number;
}

export interface PayrollItemRow {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  bruto: number;
  isr: number;
  imss: number;
  absenceDays: number;
  absenceDeduct: number;
  neto: number;
}

// ─── CORRER NÓMINA ────────────────────────────────────────────────────────────

/**
 * Calcula y guarda una corrida de nómina para todos los empleados activos.
 * Si ya existe para ese periodo la reemplaza (re-cálculo).
 */
export async function runPayroll(
  year: number,
  month: number,
  periodType: PeriodType
): Promise<{ success: boolean; runId: string; employeeCount: number }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  const tenantId = session.tenantId;

  const { period, periodLabel, startDate, endDate } = buildPeriod(year, month, periodType);

  // Traer empleados activos del tenant
  const employees = await prisma.employee.findMany({
    where: { tenantId, active: true },
    select: {
      id: true,
      name: true,
      position: true,
      salary: true,
      salaryType: true,
      attendances: {
        where: { date: { gte: startDate, lte: endDate }, absent: true, justified: false },
        select: { id: true },
      },
    },
  });

  if (employees.length === 0) throw new Error('No hay empleados activos en el tenant');

  // Calcular nómina de cada empleado
  const items = employees.map((emp) => {
    const absenceDays = emp.attendances.length;
    return calculateEmployeePayroll({
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      salary: Number(emp.salary),
      salaryType: emp.salaryType,
      absenceDays,
    });
  });

  // Totales
  const totalBruto = items.reduce((s, i) => s + i.bruto, 0);
  const totalISR   = items.reduce((s, i) => s + i.isr,   0);
  const totalIMSS  = items.reduce((s, i) => s + i.imss,  0);
  const totalNeto  = items.reduce((s, i) => s + i.neto,  0);

  // Upsert PayrollRun (si ya existe, eliminar items y recrear)
  const existing = await prisma.payrollRun.findUnique({
    where: { tenantId_period: { tenantId, period } },
  });

  let run;
  if (existing) {
    // Limpiar items anteriores y recalcular
    await prisma.payrollItem.deleteMany({ where: { payrollRunId: existing.id } });
    run = await prisma.payrollRun.update({
      where: { id: existing.id },
      data: {
        periodLabel,
        startDate,
        endDate,
        status: 'DRAFT',
        totalBruto,
        totalISR,
        totalIMSS,
        totalNeto,
        journalEntryId: null,
        items: {
          create: items.map((i) => ({
            employeeId: i.employeeId,
            employeeName: i.employeeName,
            position: i.position,
            bruto: i.bruto,
            isr: i.isr,
            imss: i.imss,
            absenceDays: i.absenceDays,
            absenceDeduct: i.absenceDeduct,
            neto: i.neto,
          })),
        },
      },
    });
  } else {
    run = await prisma.payrollRun.create({
      data: {
        tenantId,
        period,
        periodLabel,
        startDate,
        endDate,
        status: 'DRAFT',
        totalBruto,
        totalISR,
        totalIMSS,
        totalNeto,
        items: {
          create: items.map((i) => ({
            employeeId: i.employeeId,
            employeeName: i.employeeName,
            position: i.position,
            bruto: i.bruto,
            isr: i.isr,
            imss: i.imss,
            absenceDays: i.absenceDays,
            absenceDeduct: i.absenceDeduct,
            neto: i.neto,
          })),
        },
      },
    });
  }

  revalidatePath('/rrhh/nomina');

  // ── Notificación: nómina calculada ──────────────────────────────────────────
  const totalNeto = employees.reduce((s, e) => s + Number(e.neto), 0);
  notifyPayrollReady({
    tenantId,
    periodLabel: run.periodLabel,
    employeeCount: employees.length,
    totalNeto,
  }).catch(() => {});

  return { success: true, runId: run.id, employeeCount: employees.length };
}

// ─── OBTENER CORRIDA ──────────────────────────────────────────────────────────

/**
 * Devuelve la corrida de nómina más reciente o la del periodo indicado.
 */
export async function getPayrollRun(
  period?: string
): Promise<(PayrollRunSummary & { items: PayrollItemRow[] }) | null> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const run = period
    ? await prisma.payrollRun.findUnique({
        where: { tenantId_period: { tenantId: session.tenantId, period } },
        include: { items: { orderBy: { employeeName: 'asc' } } },
      })
    : await prisma.payrollRun.findFirst({
        where: { tenantId: session.tenantId },
        orderBy: { createdAt: 'desc' },
        include: { items: { orderBy: { employeeName: 'asc' } } },
      });

  if (!run) return null;

  return {
    id: run.id,
    period: run.period,
    periodLabel: run.periodLabel,
    startDate: run.startDate.toISOString(),
    endDate: run.endDate.toISOString(),
    status: run.status,
    totalBruto: Number(run.totalBruto),
    totalISR: Number(run.totalISR),
    totalIMSS: Number(run.totalIMSS),
    totalNeto: Number(run.totalNeto),
    employeeCount: run.items.length,
    items: run.items.map((i) => ({
      id: i.id,
      employeeId: i.employeeId,
      employeeName: i.employeeName,
      position: i.position,
      bruto: Number(i.bruto),
      isr: Number(i.isr),
      imss: Number(i.imss),
      absenceDays: i.absenceDays,
      absenceDeduct: Number(i.absenceDeduct),
      neto: Number(i.neto),
    })),
  };
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────

export async function getPayrollHistory(): Promise<PayrollRunSummary[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const runs = await prisma.payrollRun.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { items: true } } },
  });

  return runs.map((r) => ({
    id: r.id,
    period: r.period,
    periodLabel: r.periodLabel,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    status: r.status,
    totalBruto: Number(r.totalBruto),
    totalISR: Number(r.totalISR),
    totalIMSS: Number(r.totalIMSS),
    totalNeto: Number(r.totalNeto),
    employeeCount: r._count.items,
  }));
}

// ─── CERRAR PERIODO ───────────────────────────────────────────────────────────

/**
 * Cierra la corrida de nómina y genera la póliza contable.
 *   Cargo:  Sueldos y Salarios (601.01) = totalBruto
 *   Abono:  Bancos (101.02)             = totalNeto
 *   Abono:  ISR retenido por pagar (213) = totalISR
 *   Abono:  IMSS cuota obrera por pagar (216) = totalIMSS
 */
export async function closePayrollRun(runId: string): Promise<{ success: boolean }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const run = await prisma.payrollRun.findUnique({
    where: { id: runId },
    select: { tenantId: true, status: true, totalBruto: true, totalISR: true, totalIMSS: true, totalNeto: true, periodLabel: true, period: true, startDate: true },
  });

  if (!run || run.tenantId !== session.tenantId) throw new Error('Corrida no encontrada');
  if (run.status === 'CLOSED') throw new Error('Esta nómina ya fue cerrada');

  const totalBruto = Number(run.totalBruto);
  const totalISR   = Number(run.totalISR);
  const totalIMSS  = Number(run.totalIMSS);
  const totalNeto  = Number(run.totalNeto);

  // Construir póliza de nómina
  const journalInput: JournalEntryInput = {
    tenantId: session.tenantId,
    date: run.startDate,
    concept: `Nómina — ${run.periodLabel}`,
    reference: run.period,
    entryType: 'EGRESO',
    sourceType: 'MANUAL', // sobreescrito abajo
    lines: [
      {
        accountCode: '601.01',
        description: `Sueldos y salarios — ${run.periodLabel}`,
        debit: totalBruto,
        credit: 0,
      },
      {
        accountCode: '101.02',
        description: `Pago de nómina — ${run.periodLabel}`,
        debit: 0,
        credit: totalNeto,
      },
      ...(totalISR > 0
        ? [{
            accountCode: '213',
            description: 'ISR retenido empleados por pagar',
            debit: 0,
            credit: totalISR,
          }]
        : []),
      ...(totalIMSS > 0
        ? [{
            accountCode: '216',
            description: 'IMSS cuota obrera por pagar',
            debit: 0,
            credit: totalIMSS,
          }]
        : []),
    ],
  };

  // Crear póliza (best-effort — no bloquea el cierre)
  let journalEntryId: string | null = null;
  try {
    journalEntryId = await createJournalEntryFromInput(
      session.tenantId,
      journalInput,
      'MANUAL',
      runId
    );
  } catch (err) {
    console.warn('[Nómina→Accounting] Póliza omitida:', err);
  }

  // Cerrar corrida
  await prisma.payrollRun.update({
    where: { id: runId },
    data: {
      status: 'CLOSED',
      journalEntryId: journalEntryId ?? undefined,
    },
  });

  revalidatePath('/rrhh/nomina');
  return { success: true };
}

// ─── EMPLEADOS CRUD ───────────────────────────────────────────────────────────

export async function updateEmployee(
  employeeId: string,
  data: {
    name?: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    salary?: number;
    salaryType?: 'MENSUAL' | 'QUINCENAL';
    bankAccount?: string;
    active?: boolean;
  }
): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { tenantId: true },
  });
  if (!employee || employee.tenantId !== session.tenantId) throw new Error('Empleado no encontrado');

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...(data.name      !== undefined && { name: data.name.trim() }),
      ...(data.position  !== undefined && { position: data.position.trim() }),
      ...(data.department!== undefined && { department: data.department || null }),
      ...(data.email     !== undefined && { email: data.email || null }),
      ...(data.phone     !== undefined && { phone: data.phone || null }),
      ...(data.salary    !== undefined && { salary: data.salary }),
      ...(data.salaryType!== undefined && { salaryType: data.salaryType }),
      ...(data.bankAccount!== undefined && { bankAccount: data.bankAccount || null }),
      ...(data.active    !== undefined && { active: data.active }),
    },
  });

  revalidatePath('/rrhh');
  revalidatePath('/rrhh/empleados');
}

export async function getEmployeeDetail(employeeId: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      curp: true,
      rfc: true,
      email: true,
      phone: true,
      position: true,
      department: true,
      salary: true,
      salaryType: true,
      imssNumber: true,
      bankAccount: true,
      hireDate: true,
      active: true,
    },
  });

  if (!emp || (emp as any).tenantId !== session.tenantId) {
    // findUnique con select no expone tenantId — re-fetch para validar
    const check = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!check) return null;
  }

  if (!emp) return null;
  return {
    ...emp,
    salary: Number(emp.salary),
    hireDate: emp.hireDate.toISOString(),
  };
}
