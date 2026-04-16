/**
 * CIFRA — Tokens firmados para el Portal del Empleado
 * ====================================================
 * Genera y valida tokens HMAC para el acceso sin contraseña
 * al portal de auto-servicio del empleado.
 *
 * Formato: base64url(payload).base64url(signature)
 * Validity: 30 días por defecto.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface EmployeeTokenPayload {
  employeeId: string;
  tenantId: string;
  exp: number; // Unix timestamp
}

const SECRET = process.env.EMPLOYEE_PORTAL_SECRET ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'cifra-employee-portal-default-secret';

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function fromB64url(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8');
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function generateEmployeeToken(
  employeeId: string,
  tenantId: string,
  validDays = 30,
): string {
  const exp = Math.floor(Date.now() / 1000) + validDays * 24 * 60 * 60;
  const payload = b64url(JSON.stringify({ employeeId, tenantId, exp }));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyEmployeeToken(token: string): EmployeeTokenPayload | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;

    // Validar firma
    const expected = sign(payload);
    const a = Buffer.from(sig, 'base64url');
    const b = Buffer.from(expected, 'base64url');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data: EmployeeTokenPayload = JSON.parse(fromB64url(payload));
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return data;
  } catch {
    return null;
  }
}
