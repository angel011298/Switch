'use server';

/**
 * CIFRA — RRHH Server Actions
 * ==================================
 * FASE 12: Asistencias y empleados desde Prisma.
 * Reemplaza las queries legacy de Supabase (empleados, asistencias).
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  absent: boolean;
}

export interface EmployeeRow {
  id: string;
  name: string;
  position: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  hireDate: string;
}

// ─── Asistencias ──────────────────────────────────────────────────────────────

/**
 * Devuelve las asistencias de HOY para todos los empleados activos del tenant.
 * Si un empleado no tiene registro hoy, aparece con clockInTime = null.
 */
export async function getAttendanceReport(): Promise<AttendanceRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Traer todos los empleados activos con sus asistencias de hoy
  const employees = await prisma.employee.findMany({
    where: { tenantId: session.tenantId, active: true },
    include: {
      attendances: {
        where: { date: { gte: today, lt: tomorrow } },
      },
    },
    orderBy: { name: 'asc' },
  });

  return employees.map((emp) => {
    const att = emp.attendances[0] ?? null;
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      date: today.toISOString(),
      clockInTime: att?.clockInTime?.toISOString() ?? null,
      clockOutTime: att?.clockOutTime?.toISOString() ?? null,
      absent: att?.absent ?? false,
    };
  });
}

/**
 * Registra la entrada de un empleado (Clock In).
 * Solo permite una entrada por día.
 */
export async function clockInEmployee(employeeId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  // Verificar que el empleado pertenece al tenant
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { tenantId: true },
  });
  if (!employee || employee.tenantId !== session.tenantId) {
    throw new Error('Empleado no encontrado');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    create: {
      employeeId,
      date: today,
      clockInTime: new Date(),
    },
    update: {
      clockInTime: new Date(),
      absent: false,
    },
  });

  revalidatePath('/rrhh');
}

/**
 * Registra la salida de un empleado (Clock Out).
 */
export async function clockOutEmployee(employeeId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  // Verificar que el empleado pertenece al tenant
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { tenantId: true },
  });
  if (!employee || employee.tenantId !== session.tenantId) {
    throw new Error('Empleado no encontrado');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Solo actualizar si ya existe el registro de hoy
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!existing) throw new Error('No hay entrada registrada hoy');

  await prisma.attendance.update({
    where: { employeeId_date: { employeeId, date: today } },
    data: { clockOutTime: new Date() },
  });

  revalidatePath('/rrhh');
}

// ─── Empleados ────────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<EmployeeRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const employees = await prisma.employee.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });

  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    position: e.position,
    department: e.department,
    email: e.email,
    phone: e.phone,
    active: e.active,
    hireDate: e.hireDate.toISOString(),
  }));
}

export async function createEmployee(data: {
  name: string;
  curp: string;
  rfc?: string;
  email?: string;
  phone?: string;
  position: string;
  department?: string;
  salary: number;
  salaryType: 'MENSUAL' | 'QUINCENAL';
  imssNumber?: string;
  bankAccount?: string;
  hireDate: string;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  if (!data.name.trim()) throw new Error('Nombre requerido');
  if (!data.curp.trim()) throw new Error('CURP requerido');
  if (!data.position.trim()) throw new Error('Puesto requerido');
  if (data.salary <= 0) throw new Error('Salario debe ser mayor a 0');

  await prisma.employee.create({
    data: {
      tenantId: session.tenantId,
      name: data.name.trim(),
      curp: data.curp.trim().toUpperCase(),
      rfc: data.rfc?.trim().toUpperCase() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      position: data.position.trim(),
      department: data.department?.trim() || null,
      salary: data.salary,
      salaryType: data.salaryType,
      imssNumber: data.imssNumber?.trim() || null,
      bankAccount: data.bankAccount?.trim() || null,
      hireDate: new Date(data.hireDate),
    },
  });

  revalidatePath('/rrhh');
}
