'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── Catálogo de acciones disponibles para registro manual ───────────────────

export const MANUAL_EVENT_ACTIONS = [
  // Pagos y suscripciones
  { value: 'PAYMENT_RECEIVED_OFFLINE',    label: 'Pago recibido (offline/transferencia)', group: 'Pagos' },
  { value: 'PAYMENT_RECEIVED_CASH',       label: 'Pago recibido en efectivo',             group: 'Pagos' },
  { value: 'SUBSCRIPTION_RENEWED',        label: 'Suscripción renovada',                  group: 'Pagos' },
  { value: 'SUBSCRIPTION_DOWNGRADED',     label: 'Cambio a plan inferior',                group: 'Pagos' },
  { value: 'SUBSCRIPTION_UPGRADED',       label: 'Cambio a plan superior',                group: 'Pagos' },
  { value: 'PAYMENT_REFUNDED',            label: 'Reembolso emitido',                     group: 'Pagos' },

  // Tenant / Cuenta
  { value: 'TENANT_CREATED_MANUAL',       label: 'Tenant creado manualmente',             group: 'Tenant' },
  { value: 'TENANT_CONTACTED',            label: 'Contacto con el tenant',                group: 'Tenant' },
  { value: 'TENANT_ONBOARDING_COMPLETED', label: 'Onboarding completado',                 group: 'Tenant' },
  { value: 'TENANT_SUSPENDED',            label: 'Tenant suspendido',                     group: 'Tenant' },
  { value: 'TENANT_REACTIVATED',          label: 'Tenant reactivado',                     group: 'Tenant' },
  { value: 'TENANT_DATA_CORRECTED',       label: 'Corrección de datos del tenant',        group: 'Tenant' },

  // Módulos
  { value: 'MODULE_ACTIVATED',            label: 'Módulo activado',                       group: 'Módulos' },
  { value: 'MODULE_DEACTIVATED',          label: 'Módulo desactivado',                    group: 'Módulos' },
  { value: 'MODULES_BULK_ACTIVATED',      label: 'Activación masiva de módulos',          group: 'Módulos' },

  // Usuarios / Acceso
  { value: 'USER_CREATED_MANUAL',         label: 'Usuario creado manualmente',            group: 'Usuarios' },
  { value: 'USER_ROLE_CHANGED',           label: 'Rol de usuario cambiado',               group: 'Usuarios' },
  { value: 'USER_LOGIN',                  label: 'Inicio de sesión registrado',            group: 'Usuarios' },
  { value: 'USER_LOGOUT',                 label: 'Cierre de sesión registrado',            group: 'Usuarios' },
  { value: 'USER_2FA_ENABLED',            label: '2FA habilitado',                        group: 'Usuarios' },
  { value: 'USER_PASSWORD_RESET',         label: 'Contraseña restablecida',               group: 'Usuarios' },
  { value: 'USER_BLOCKED',               label: 'Usuario bloqueado',                     group: 'Usuarios' },
  { value: 'ACCESS_DENIED',              label: 'Acceso denegado registrado',            group: 'Usuarios' },

  // Seguridad
  { value: 'SECURITY_INCIDENT',          label: 'Incidente de seguridad',               group: 'Seguridad' },
  { value: 'IP_WHITELIST_CHANGED',       label: 'Whitelist de IPs modificada',           group: 'Seguridad' },
  { value: 'API_KEY_CREATED',            label: 'API Key creada',                        group: 'Seguridad' },
  { value: 'API_KEY_REVOKED',            label: 'API Key revocada',                      group: 'Seguridad' },
  { value: 'CSD_UPLOADED',              label: 'CSD subido',                            group: 'Seguridad' },

  // Fiscal / Facturación
  { value: 'INVOICE_ISSUED_MANUAL',      label: 'Factura emitida (registro manual)',     group: 'Facturación' },
  { value: 'INVOICE_CANCELLED_MANUAL',   label: 'Factura cancelada (registro manual)',   group: 'Facturación' },
  { value: 'TAX_CONFIG_CHANGED',        label: 'Configuración fiscal modificada',       group: 'Facturación' },

  // Soporte / Comunicación
  { value: 'SUPPORT_TICKET_OPENED',      label: 'Ticket de soporte abierto',            group: 'Soporte' },
  { value: 'SUPPORT_TICKET_RESOLVED',    label: 'Ticket de soporte resuelto',           group: 'Soporte' },
  { value: 'CALL_LOGGED',               label: 'Llamada telefónica registrada',         group: 'Soporte' },
  { value: 'MEETING_LOGGED',            label: 'Reunión registrada',                   group: 'Soporte' },
  { value: 'EMAIL_SENT',               label: 'Email enviado al tenant',              group: 'Soporte' },

  // Geolocalización / Presencia
  { value: 'GEOFENCE_CONFIGURED',       label: 'Geocerca configurada',                 group: 'Geolocalización' },
  { value: 'LOCATION_ANOMALY',          label: 'Anomalía de ubicación registrada',     group: 'Geolocalización' },

  // General
  { value: 'ADMIN_NOTE',               label: 'Nota administrativa',                  group: 'General' },
  { value: 'OTHER',                    label: 'Otro (especificar en notas)',           group: 'General' },
] as const;

export type ManualEventAction = typeof MANUAL_EVENT_ACTIONS[number]['value'];

// ─── Severidad según la acción ────────────────────────────────────────────────

function inferSeverity(action: string): 'info' | 'warning' | 'critical' {
  if (['SECURITY_INCIDENT', 'USER_BLOCKED', 'ACCESS_DENIED', 'TENANT_SUSPENDED'].includes(action))
    return 'critical';
  if (['PAYMENT_REFUNDED', 'MODULE_DEACTIVATED', 'SUBSCRIPTION_DOWNGRADED', 'API_KEY_REVOKED',
       'TENANT_SUSPENDED', 'USER_PASSWORD_RESET', 'IP_WHITELIST_CHANGED'].includes(action))
    return 'warning';
  return 'info';
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateManualEventInput {
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  eventDate: string;       // ISO string — fecha retroactiva del evento
  severity?: 'info' | 'warning' | 'critical';
  manualNotes: string;
  additionalData?: Record<string, unknown>;
  ip?: string;
  location?: string;       // Ubicación geográfica opcional
}

export interface CreateManualEventResult {
  success: boolean;
  logId?: string;
  error?: string;
}

// ─── ACTION: REGISTRAR EVENTO MANUAL CON FECHA RETROACTIVA ───────────────────

/**
 * Permite al Super Admin registrar un evento administrativo que ocurrió
 * en el pasado (o fuera del sistema) con una fecha retroactiva.
 *
 * Base de datos:
 * - createdAt: fecha real de creación del registro (automática)
 * - eventDate: fecha en que ocurrió el evento (retroactiva, ingresada por el admin)
 */
export async function createManualAuditEvent(
  input: CreateManualEventInput
): Promise<CreateManualEventResult> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    return { success: false, error: 'Acceso denegado: se requiere Super Admin' };
  }

  if (!input.tenantId)    return { success: false, error: 'El tenant es requerido.' };
  if (!input.action)      return { success: false, error: 'La acción es requerida.' };
  if (!input.eventDate)   return { success: false, error: 'La fecha del evento es requerida.' };
  if (!input.manualNotes?.trim())
    return { success: false, error: 'Las notas son requeridas para eventos manuales.' };

  // Verificar que el tenant existe
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) return { success: false, error: 'Tenant no encontrado.' };

  const eventDate = new Date(input.eventDate);
  if (isNaN(eventDate.getTime())) {
    return { success: false, error: 'Fecha del evento inválida.' };
  }

  const severity = input.severity ?? inferSeverity(input.action);

  try {
    const log = await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: session.userId,
        actorName: session.name || 'Super Admin',
        actorEmail: session.email,
        action: input.action,
        resource: input.resource || 'Tenant',
        resourceId: input.resourceId,
        ip: input.ip,
        severity,
        isManualEntry: true,
        eventDate,
        manualNotes: input.manualNotes.trim(),
        newData: {
          ...(input.additionalData ?? {}),
          tenantName: tenant.name,
          ...(input.location ? { location: input.location } : {}),
          registeredAt: new Date().toISOString(),
          registeredBy: session.email,
        },
      },
    });

    revalidatePath('/admin/auditoria');
    return { success: true, logId: log.id };
  } catch (error: any) {
    console.error('[createManualAuditEvent] Error:', error);
    return { success: false, error: error?.message ?? 'Error al registrar el evento.' };
  }
}

// ─── ACTION: OBTENER LOGS DE AUDITORÍA (API INTERNA) ─────────────────────────

export async function getAuditLogs(options: {
  tenantId?: string;
  daysBack?: number;
  limit?: number;
  onlyManual?: boolean;
  action?: string;
  severity?: string;
}) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    throw new Error('Acceso denegado');
  }

  const where: Record<string, unknown> = {};

  if (options.tenantId) {
    where.tenantId = options.tenantId;
  }

  if (options.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    where.createdAt = { gte: since };
  }

  if (options.onlyManual) {
    where.isManualEntry = true;
  }

  if (options.action) {
    where.action = options.action;
  }

  if (options.severity && options.severity !== 'all') {
    where.severity = options.severity;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: [
      { eventDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: options.limit ?? 200,
  });

  return logs;
}
