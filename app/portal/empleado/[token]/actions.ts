'use server';

import { verifyEmployeeToken } from '@/lib/portal/employee-token';
import prisma from '@/lib/prisma';

interface LeavePayload {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const ALLOWED_TYPES = ['VACACIONES', 'PERMISO', 'INCAPACIDAD', 'DUELO'];

export async function submitLeaveRequest(
  token: string,
  data: LeavePayload,
): Promise<{ ok: boolean; error?: string }> {
  const payload = verifyEmployeeToken(token);
  if (!payload) return { ok: false, error: 'Sesión expirada. Solicita un nuevo enlace.' };

  if (!ALLOWED_TYPES.includes(data.type)) {
    return { ok: false, error: 'Tipo de permiso no válido.' };
  }

  const start = new Date(data.startDate);
  const end   = new Date(data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { ok: false, error: 'Fechas inválidas.' };
  }

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  try {
    await prisma.leaveRequest.create({
      data: {
        tenantId:   payload.tenantId,
        employeeId: payload.employeeId,
        type:       data.type,
        startDate:  start,
        endDate:    end,
        days,
        reason:     data.reason?.trim() || null,
        status:     'PENDING',
      },
    });
    return { ok: true };
  } catch (err) {
    console.error('[submitLeaveRequest]', err);
    return { ok: false, error: 'Error al guardar la solicitud. Inténtalo de nuevo.' };
  }
}
