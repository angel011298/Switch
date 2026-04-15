/**
 * CIFRA — pac-client.ts  (punto de entrada canónico del PAC)
 * ============================================================
 * Fábrica centralizada que:
 *   1. Resuelve qué PAC usar según las variables de entorno.
 *   2. Opcionalmente envuelve el adaptador con logging a AuditLog
 *      para errores HTTP 401 y 307 del SAT/PAC.
 *
 * Uso típico (Server Action o API route):
 *
 *   import { getPacClient, withAuditLog } from '@/lib/cfdi/pac-client';
 *
 *   // Sin AuditLog (desarrollo / jobs):
 *   const pac = getPacClient();
 *   const result = await pac.stamp(xmlSellado);
 *
 *   // Con AuditLog (producción):
 *   const pac = withAuditLog(getPacClient(), tenantId, actorEmail);
 *   const result = await pac.stamp(xmlSellado);
 *
 * Variables de entorno (en orden de precedencia):
 *   SW_PAC_TOKEN       → Token estático de SW Sapien (Infinite Token)
 *   SW_PAC_URL         → URL base (sandbox o producción)
 *   SW_SAPIEN_TOKEN    → Alias heredado
 *   SW_SAPIEN_URL      → Alias heredado
 *   SW_SAPIEN_USER     → Usuario para auth user+password
 *   SW_SAPIEN_PASSWORD → Contraseña
 *
 * Sin credenciales → MockPac (para desarrollo local).
 */

import type { PacAdapter, PacStampResult, PacCancelResult, PacStatusResult } from './pac/adapter';
import { SwSapienPac } from './pac/sw-sapien';
import { MockPac } from './pac/mock-pac';
import prisma from '@/lib/prisma';

// ─── Fábrica ──────────────────────────────────────────────────────────────────

/**
 * Devuelve el adaptador PAC apropiado según las variables de entorno.
 *
 * • Con SW_PAC_TOKEN o SW_SAPIEN_TOKEN → SwSapienPac (token estático)
 * • Con SW_SAPIEN_USER + SW_SAPIEN_PASSWORD → SwSapienPac (user+password)
 * • Sin credenciales → MockPac (sandbox local, no contacta al SAT)
 */
export function getPacClient(): PacAdapter {
  const token    = process.env.SW_PAC_TOKEN ?? process.env.SW_SAPIEN_TOKEN;
  const user     = process.env.SW_SAPIEN_USER;
  const password = process.env.SW_SAPIEN_PASSWORD;

  if (token || (user && password)) {
    return new SwSapienPac({ token, user, password });
  }

  console.warn('[PAC] Sin credenciales configuradas — usando MockPac (no se timbrará ante el SAT).');
  return new MockPac();
}

// ─── Wrapper con AuditLog ─────────────────────────────────────────────────────

/**
 * Envuelve cualquier PacAdapter y escribe en AuditLog cuando:
 *   - stamp() falla con httpStatus 401 (severity: critical)
 *   - stamp() recibe un 307 inesperado en un contexto no idempotente
 *   - cancel() falla
 *   - Cualquier error de red (httpStatus === 0)
 *
 * @param base        Adaptador PAC a envolver
 * @param tenantId    Tenant que origina la operación
 * @param actorEmail  Email del usuario que ejecuta (para auditoría)
 */
export function withAuditLog(
  base: PacAdapter,
  tenantId: string,
  actorEmail?: string
): PacAdapter {
  return {
    name: base.name,

    async stamp(xmlSellado: string): Promise<PacStampResult> {
      const result = await base.stamp(xmlSellado);

      if (!result.success || result.httpStatus === 401) {
        const severity = result.httpStatus === 401 ? 'critical' : 'warning';
        await writeAuditLog({
          tenantId,
          actorEmail,
          action: 'PAC_STAMP_ERROR',
          resource: 'Invoice',
          severity,
          newData: {
            pac:        base.name,
            httpStatus: result.httpStatus,
            error:      result.error,
          },
        });
      }

      return result;
    },

    async cancel(
      uuid: string,
      rfcEmisor: string,
      motivo: string,
      folioSustitucion?: string
    ): Promise<PacCancelResult> {
      const result = await base.cancel(uuid, rfcEmisor, motivo, folioSustitucion);

      if (!result.success) {
        const severity = result.httpStatus === 401 ? 'critical' : 'warning';
        await writeAuditLog({
          tenantId,
          actorEmail,
          action: 'PAC_CANCEL_ERROR',
          resource: 'Invoice',
          resourceId: uuid,
          severity,
          newData: {
            pac:        base.name,
            uuid,
            motivo,
            httpStatus: result.httpStatus,
            error:      result.error,
          },
        });
      }

      return result;
    },

    async status(
      uuid: string,
      rfcEmisor: string,
      rfcReceptor: string,
      total: string
    ): Promise<PacStatusResult> {
      // Las consultas de estatus no generan AuditLog (son read-only y frecuentes)
      return base.status(uuid, rfcEmisor, rfcReceptor, total);
    },
  };
}

// ─── Helper interno ───────────────────────────────────────────────────────────

interface AuditEntry {
  tenantId:   string;
  actorEmail?: string;
  action:     string;
  resource:   string;
  resourceId?: string;
  severity:   string;
  newData:    Record<string, unknown>;
}

async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId:   entry.tenantId,
        actorEmail: entry.actorEmail ?? null,
        action:     entry.action,
        resource:   entry.resource,
        resourceId: entry.resourceId ?? null,
        severity:   entry.severity,
        newData:    entry.newData as object,
      },
    });
  } catch (e) {
    // AuditLog nunca debe interrumpir el flujo principal
    console.error('[AuditLog] Error al escribir entrada de auditoría PAC:', e);
  }
}
