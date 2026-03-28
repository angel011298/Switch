/**
 * CIFRA — RBAC (Role-Based Access Control)
 * =========================================
 * FASE 25: Jerarquía de roles, permisos por módulo y helper de auditoría.
 *
 * Roles: ADMIN > MANAGER > OPERATIVE
 *   ADMIN    — acceso total incluyendo usuarios, billing y configuración
 *   MANAGER  — puede crear/editar pero no eliminar ni gestionar usuarios
 *   OPERATIVE — solo lectura + sus propias acciones operativas
 */

import prisma from '@/lib/prisma';

// ─── Jerarquía ────────────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN:     3,
  MANAGER:   2,
  OPERATIVE: 1,
};

/** Devuelve true si `role` tiene al menos el nivel de `required` */
export function hasMinRole(role: string, required: string): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[required] ?? 0);
}

// ─── Rutas protegidas por rol ─────────────────────────────────────────────────

/**
 * Rutas que requieren al menos ADMIN.
 * MANAGER y OPERATIVE son redirigidos a /dashboard.
 */
export const ADMIN_ONLY_ROUTES = [
  '/admin',               // Super admin (verificado también por isSuperAdmin)
  '/settings/usuarios',   // Gestión de usuarios del tenant
  '/billing',             // Suscripción y pagos
];

/**
 * Acciones que MANAGER no puede ejecutar (aplicado a nivel de Server Action).
 */
export const MANAGER_FORBIDDEN_ACTIONS = [
  'DELETE_INVOICE',
  'DELETE_EMPLOYEE',
  'DELETE_CUSTOMER',
  'DELETE_PRODUCT',
  'DELETE_ORDER',
  'ROLE_CHANGE',
  'USER_INVITE',
  'USER_REMOVE',
];

// ─── Guard de ruta ────────────────────────────────────────────────────────────

/**
 * Verifica si una ruta está permitida para el rol dado.
 * Usado en middleware.ts — Capa 4.
 */
export function hasRoutePermission(pathname: string, role: string): boolean {
  const isAdmin = hasMinRole(role, 'ADMIN');

  for (const route of ADMIN_ONLY_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return isAdmin;
    }
  }

  return true; // Resto de rutas: MANAGER y OPERATIVE pueden acceder
}

// ─── Permisos de acción ───────────────────────────────────────────────────────

/** ¿Puede este rol eliminar registros? */
export function canDelete(role: string): boolean {
  return hasMinRole(role, 'ADMIN');
}

/** ¿Puede este rol gestionar usuarios del tenant? */
export function canManageUsers(role: string): boolean {
  return hasMinRole(role, 'ADMIN');
}

/** ¿Puede este rol aprobar pagos / cambiar plan? */
export function canManageBilling(role: string): boolean {
  return hasMinRole(role, 'ADMIN');
}

// ─── Registro de Auditoría ────────────────────────────────────────────────────

export interface AuditLogPayload {
  tenantId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  severity?: 'info' | 'warning' | 'critical';
}

/**
 * Escribe un registro en AuditLog.
 * No lanza excepciones — falla silenciosamente para no interrumpir el flujo.
 */
export async function logAudit(payload: AuditLogPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId:   payload.tenantId,
        actorId:    payload.actorId   ?? null,
        actorName:  payload.actorName  ?? null,
        actorEmail: payload.actorEmail ?? null,
        action:     payload.action,
        resource:   payload.resource,
        resourceId: payload.resourceId ?? null,
        oldData:    payload.oldData   ?? undefined,
        newData:    payload.newData   ?? undefined,
        ip:         payload.ip        ?? null,
        userAgent:  payload.userAgent  ?? null,
        severity:   payload.severity   ?? 'info',
      },
    });
  } catch (err) {
    console.error('[logAudit] Failed to write audit log:', err);
  }
}

// ─── Helper: IP desde headers ─────────────────────────────────────────────────

/**
 * Extrae la IP real del request (compatible con Vercel/proxies).
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}
