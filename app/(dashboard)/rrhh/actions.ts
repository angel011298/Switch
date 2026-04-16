'use server';

/**
 * CIFRA — RRHH Shared Server Actions
 * FASE 34: Asistencia, Documentos, Vacaciones, Desempeño
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface EmployeeRow {
  id: string;
  name: string;
  position: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  salary: number;
  salaryType: string;
  hireDate: string;
  active: boolean;
  attendanceToday: boolean; // has clock-in today
  documentsCount: number;
}

export interface AttendanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  absent: boolean;
  justified: boolean;
  notes: string | null;
  // Extended fields — FASE 52
  employeeNumber: string | null;
  area: string | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  checkInStatus: string | null;
  checkOutStatus: string | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
  isAnomaly: boolean;
  anomalyReason: string | null;
  workAddress: string | null;
}

export interface DocumentRow {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  name: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface LeaveRequestRow {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

export interface ReviewRow {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  score: number;
  goals: string | null;
  achievements: string | null;
  improvements: string | null;
  reviewerName: string | null;
  status: string;
  createdAt: string;
}

export interface RrhhKpis {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  expiringSoonDocs: number; // docs que vencen en los próximos 30 días
}

// ─── EMPLEADOS ────────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<EmployeeRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const employees = await prisma.employee.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    include: {
      attendances: {
        where: { date: today },
        select: { id: true },
      },
      _count: { select: { documents: true } },
    },
  });

  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    position: e.position,
    department: e.department,
    email: e.email,
    phone: e.phone ?? null,
    salary: Number(e.salary),
    salaryType: e.salaryType,
    hireDate: e.hireDate.toISOString(),
    active: e.active,
    attendanceToday: e.attendances.length > 0,
    documentsCount: e._count.documents,
  }));
}

export async function getRrhhKpis(): Promise<RrhhKpis> {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return { totalEmployees: 0, activeEmployees: 0, presentToday: 0, pendingLeaves: 0, expiringSoonDocs: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);

  const [total, active, presentToday, pendingLeaves, expiringSoonDocs] = await Promise.all([
    prisma.employee.count({ where: { tenantId: session.tenantId } }),
    prisma.employee.count({ where: { tenantId: session.tenantId, active: true } }),
    prisma.attendance.count({
      where: {
        employee: { tenantId: session.tenantId },
        date: today,
        absent: false,
      },
    }),
    prisma.leaveRequest.count({
      where: { tenantId: session.tenantId, status: 'PENDING' },
    }),
    prisma.employeeDocument.count({
      where: {
        tenantId: session.tenantId,
        expiresAt: { gte: today, lte: in30Days },
      },
    }),
  ]);

  return { totalEmployees: total, activeEmployees: active, presentToday, pendingLeaves, expiringSoonDocs };
}

// ─── ASISTENCIA ───────────────────────────────────────────────────────────────

export async function getAttendances(year: number, month: number): Promise<AttendanceRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: {
      employee: { tenantId: session.tenantId },
      date: { gte: start, lte: end },
    },
    orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }],
    include: { employee: { select: { name: true } } },
  });

  return records.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.name,
    date: r.date.toISOString(),
    clockInTime: r.clockInTime?.toISOString() ?? null,
    clockOutTime: r.clockOutTime?.toISOString() ?? null,
    absent: r.absent,
    justified: r.justified,
    notes: r.notes,
  }));
}

export async function clockIn(employeeId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId: session.tenantId } });
  if (!emp) throw new Error('Empleado no encontrado');

  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: dateOnly } },
    create: { employeeId, date: dateOnly, clockInTime: today, absent: false },
    update: { clockInTime: today, absent: false },
  });

  revalidatePath('/rrhh');
  revalidatePath('/rrhh/empleados');
}

export async function clockOut(employeeId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const att = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: dateOnly } },
  });
  if (!att) throw new Error('No hay registro de entrada hoy');

  await prisma.attendance.update({
    where: { id: att.id },
    data: { clockOutTime: today },
  });

  revalidatePath('/rrhh');
  revalidatePath('/rrhh/empleados');
}

export async function markAbsent(employeeId: string, date: Date, justified: boolean, notes?: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId: session.tenantId } });
  if (!emp) throw new Error('Empleado no encontrado');

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: dateOnly } },
    create: { employeeId, date: dateOnly, absent: true, justified, notes: notes ?? null },
    update: { absent: true, justified, notes: notes ?? null },
  });

  revalidatePath('/rrhh/empleados');
}

// ─── DOCUMENTOS ───────────────────────────────────────────────────────────────

export async function getDocuments(employeeId?: string): Promise<DocumentRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const docs = await prisma.employeeDocument.findMany({
    where: {
      tenantId: session.tenantId,
      ...(employeeId ? { employeeId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { employee: { select: { name: true } } },
  });

  return docs.map((d) => ({
    id: d.id,
    employeeId: d.employeeId,
    employeeName: d.employee.name,
    type: d.type,
    name: d.name,
    fileUrl: d.fileUrl,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    expiresAt: d.expiresAt?.toISOString() ?? null,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
  }));
}

export async function addDocument(input: {
  employeeId: string;
  type: string;
  name: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  expiresAt?: string;
  notes?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: session.tenantId } });
  if (!emp) throw new Error('Empleado no encontrado');

  if (!input.name.trim()) throw new Error('El nombre del documento es requerido');
  if (!input.fileUrl.trim()) throw new Error('La URL del archivo es requerida');

  const doc = await prisma.employeeDocument.create({
    data: {
      tenantId:   session.tenantId,
      employeeId: input.employeeId,
      type:       input.type,
      name:       input.name.trim(),
      fileUrl:    input.fileUrl.trim(),
      fileSize:   input.fileSize ?? null,
      mimeType:   input.mimeType ?? null,
      expiresAt:  input.expiresAt ? new Date(input.expiresAt) : null,
      notes:      input.notes?.trim() ?? null,
    },
    select: { id: true },
  });

  revalidatePath('/rrhh/documentos');
  return doc.id;
}

export async function deleteDocument(docId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const doc = await prisma.employeeDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.tenantId !== session.tenantId) throw new Error('Documento no encontrado');

  await prisma.employeeDocument.delete({ where: { id: docId } });
  revalidatePath('/rrhh/documentos');
}

// ─── SOLICITUDES DE VACACIONES / PERMISOS ─────────────────────────────────────

export async function getLeaveRequests(status?: string): Promise<LeaveRequestRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const requests = await prisma.leaveRequest.findMany({
    where: {
      tenantId: session.tenantId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { employee: { select: { name: true } } },
  });

  return requests.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.name,
    type: r.type,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    days: r.days,
    reason: r.reason,
    status: r.status,
    approvedAt: r.approvedAt?.toISOString() ?? null,
    rejectedReason: r.rejectedReason,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createLeaveRequest(input: {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: session.tenantId } });
  if (!emp) throw new Error('Empleado no encontrado');

  const start = new Date(input.startDate);
  const end   = new Date(input.endDate);
  if (end < start) throw new Error('La fecha de fin debe ser posterior al inicio');

  // Días naturales (incluyendo fines de semana)
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const req = await prisma.leaveRequest.create({
    data: {
      tenantId:   session.tenantId,
      employeeId: input.employeeId,
      type:       input.type,
      startDate:  start,
      endDate:    end,
      days,
      reason:     input.reason?.trim() ?? null,
      status:     'PENDING',
    },
    select: { id: true },
  });

  revalidatePath('/rrhh/cultura');
  return req.id;
}

export async function approveLeaveRequest(requestId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const req = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!req || req.tenantId !== session.tenantId) throw new Error('Solicitud no encontrada');
  if (req.status !== 'PENDING') throw new Error('La solicitud ya fue procesada');

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED', approvedById: session.userId ?? null, approvedAt: new Date() },
  });

  revalidatePath('/rrhh/cultura');
}

export async function rejectLeaveRequest(requestId: string, reason?: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const req = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!req || req.tenantId !== session.tenantId) throw new Error('Solicitud no encontrada');
  if (req.status !== 'PENDING') throw new Error('La solicitud ya fue procesada');

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', rejectedReason: reason?.trim() ?? null },
  });

  revalidatePath('/rrhh/cultura');
}

// ─── EVALUACIONES DE DESEMPEÑO ─────────────────────────────────────────────────

export async function getReviews(employeeId?: string): Promise<ReviewRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const reviews = await prisma.performanceReview.findMany({
    where: {
      tenantId: session.tenantId,
      ...(employeeId ? { employeeId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { employee: { select: { name: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.name,
    period: r.period,
    score: r.score,
    goals: r.goals,
    achievements: r.achievements,
    improvements: r.improvements,
    reviewerName: r.reviewerName,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createReview(input: {
  employeeId: string;
  period: string;
  score: number;
  goals?: string;
  achievements?: string;
  improvements?: string;
  reviewerName?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId: session.tenantId } });
  if (!emp) throw new Error('Empleado no encontrado');
  if (input.score < 1 || input.score > 5) throw new Error('El puntaje debe estar entre 1 y 5');
  if (!input.period.trim()) throw new Error('El período es requerido');

  const review = await prisma.performanceReview.create({
    data: {
      tenantId:     session.tenantId,
      employeeId:   input.employeeId,
      period:       input.period.trim(),
      score:        input.score,
      goals:        input.goals?.trim() ?? null,
      achievements: input.achievements?.trim() ?? null,
      improvements: input.improvements?.trim() ?? null,
      reviewerName: input.reviewerName?.trim() ?? null,
      status:       'PUBLISHED',
    },
    select: { id: true },
  });

  revalidatePath('/rrhh/talento');
  return review.id;
}

// ─── LEGACY COMPAT (keep old names used by existing pages) ────────────────────

export { getEmployees as getEmployeesLegacy };

export async function getAttendanceReport(): Promise<AttendanceRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [employees, tenant] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId: session.tenantId, active: true },
      include: {
        attendances: {
          where: { date: { gte: today, lt: tomorrow } },
        },
        shift: {
          select: { startTime: true, endTime: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { workAddress: true },
    }),
  ]);

  return employees.map((emp) => {
    const att = emp.attendances[0] ?? null;
    return {
      id: att?.id ?? emp.id,
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      date: today.toISOString(),
      clockInTime: att?.clockInTime?.toISOString() ?? null,
      clockOutTime: att?.clockOutTime?.toISOString() ?? null,
      absent: att?.absent ?? false,
      justified: att?.justified ?? false,
      notes: att?.notes ?? null,
      employeeNumber: emp.employeeNumber ?? null,
      area: emp.area ?? emp.department ?? null,
      shiftStartTime: emp.shift?.startTime ?? null,
      shiftEndTime: emp.shift?.endTime ?? null,
      checkInStatus: att?.checkInStatus ?? null,
      checkOutStatus: att?.checkOutStatus ?? null,
      checkInAddress: att?.checkInAddress ?? null,
      checkOutAddress: att?.checkOutAddress ?? null,
      isAnomaly: att?.isAnomaly ?? false,
      anomalyReason: att?.anomalyReason ?? null,
      workAddress: tenant?.workAddress ?? null,
    };
  });
}

export async function clockInEmployee(employeeId: string): Promise<void> {
  return clockIn(employeeId);
}

export async function clockOutEmployee(employeeId: string): Promise<void> {
  return clockOut(employeeId);
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
      tenantId:    session.tenantId,
      name:        data.name.trim(),
      curp:        data.curp.trim().toUpperCase(),
      rfc:         data.rfc?.trim().toUpperCase() || null,
      email:       data.email?.trim() || null,
      phone:       data.phone?.trim() || null,
      position:    data.position.trim(),
      department:  data.department?.trim() || null,
      salary:      data.salary,
      salaryType:  data.salaryType,
      imssNumber:  data.imssNumber?.trim() || null,
      bankAccount: data.bankAccount?.trim() || null,
      hireDate:    new Date(data.hireDate),
    },
  });

  revalidatePath('/rrhh');
}

// ─── Portal del Empleado ──────────────────────────────────────────────────────

/**
 * Genera un enlace de auto-servicio para un empleado.
 * Válido 30 días — no requiere contraseña.
 */
export async function generateEmployeePortalLink(employeeId: string): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  // Verificar que el empleado pertenece al tenant
  const emp = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!emp) throw new Error('Empleado no encontrado');

  const { generateEmployeeToken } = await import('@/lib/portal/employee-token');
  const token = generateEmployeeToken(employeeId, session.tenantId, 30);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cifra-mx.vercel.app';
  return `${base}/portal/empleado/${token}`;
}
