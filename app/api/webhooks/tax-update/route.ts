/**
 * Switch OS — API Endpoint: Actualización de Reglas Fiscales
 * ==========================================================
 * Endpoint para consumir actualizaciones fiscales externas o
 * para que el Super Admin suba un CSV con nuevas reglas.
 *
 * POST /api/webhooks/tax-update
 *
 * Casos de uso:
 * 1. Webhook de API fiscal externa (ej. cambio en Miscelánea Fiscal)
 * 2. Importación CSV de reglas fiscales por el Super Admin
 * 3. Actualización programática desde cron jobs
 *
 * Seguridad: Requiere header X-Tax-Api-Key o sesión de Super Admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TaxType, OperationType, PersonType } from '@prisma/client';

export const dynamic = 'force-dynamic';

// ─── TIPOS ─────────────────────────────────────────────

interface TaxRulePayload {
  code: string;
  name: string;
  description?: string;
  taxType: TaxType;
  operationType: OperationType;
  rate: number;
  isPercentage?: boolean;
  isWithholding?: boolean;
  emitterPersonType?: PersonType | null;
  receiverPersonType?: PersonType | null;
  validFrom: string;
  validTo?: string | null;
  regimeSatCodes?: string[]; // Códigos SAT de regímenes (ej. ["601", "612"])
  replacesCode?: string;     // Código de la regla que reemplaza (para expirar la anterior)
}

interface TaxUpdateRequest {
  source: string;          // Identificador de la fuente (ej. "rmf_2025", "csv_import")
  rules: TaxRulePayload[];
}

// ─── VALIDACIÓN ────────────────────────────────────────

const VALID_TAX_TYPES: string[] = ['IVA', 'ISR', 'IEPS', 'ISH', 'RETENCION_IVA', 'RETENCION_ISR'];
const VALID_OPERATION_TYPES: string[] = [
  'SALE_PRODUCT', 'SALE_SERVICE', 'PURCHASE_PRODUCT', 'PURCHASE_SERVICE',
  'PAYROLL', 'LEASE', 'ROYALTY', 'COMMISSION',
];
const VALID_PERSON_TYPES: string[] = ['FISICA', 'MORAL'];

function validateRule(rule: TaxRulePayload, index: number): string | null {
  if (!rule.code) return `Regla ${index}: code es requerido`;
  if (!rule.name) return `Regla ${index}: name es requerido`;
  if (!VALID_TAX_TYPES.includes(rule.taxType)) return `Regla ${index}: taxType inválido: ${rule.taxType}`;
  if (!VALID_OPERATION_TYPES.includes(rule.operationType)) return `Regla ${index}: operationType inválido`;
  if (typeof rule.rate !== 'number' || rule.rate < 0) return `Regla ${index}: rate debe ser un número >= 0`;
  if (!rule.validFrom) return `Regla ${index}: validFrom es requerido`;
  if (rule.emitterPersonType && !VALID_PERSON_TYPES.includes(rule.emitterPersonType)) {
    return `Regla ${index}: emitterPersonType inválido`;
  }
  if (rule.receiverPersonType && !VALID_PERSON_TYPES.includes(rule.receiverPersonType)) {
    return `Regla ${index}: receiverPersonType inválido`;
  }
  return null;
}

// ─── AUTENTICACIÓN ─────────────────────────────────────

function authenticateRequest(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-tax-api-key');
  const expectedKey = process.env.TAX_API_KEY;

  // Si no hay TAX_API_KEY configurada, denegar acceso externo
  if (!expectedKey) return false;

  return apiKey === expectedKey;
}

// ─── HANDLER ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Autenticar
    if (!authenticateRequest(req)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere header X-Tax-Api-Key válido.' },
        { status: 401 }
      );
    }

    // Parsear body
    const body: TaxUpdateRequest = await req.json();

    if (!body.source) {
      return NextResponse.json({ error: 'Campo "source" es requerido' }, { status: 400 });
    }

    if (!Array.isArray(body.rules) || body.rules.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos una regla en "rules"' }, { status: 400 });
    }

    // Validar todas las reglas antes de procesar
    for (let i = 0; i < body.rules.length; i++) {
      const error = validateRule(body.rules[i], i);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    // Procesar reglas en transacción
    const results = await prisma.$transaction(async (tx) => {
      const processed: Array<{ code: string; action: string; id: string }> = [];

      for (const rule of body.rules) {
        // Si reemplaza una regla existente, expirar la anterior
        if (rule.replacesCode) {
          const oldRule = await tx.taxRule.findUnique({
            where: { code: rule.replacesCode },
          });

          if (oldRule) {
            const expireDate = new Date(rule.validFrom);
            expireDate.setDate(expireDate.getDate() - 1);

            await tx.taxRule.update({
              where: { id: oldRule.id },
              data: { validTo: expireDate },
            });

            processed.push({ code: oldRule.code, action: 'expired', id: oldRule.id });
          }
        }

        // Verificar si ya existe (upsert por code)
        const existing = await tx.taxRule.findUnique({ where: { code: rule.code } });

        let newRule;
        if (existing) {
          // Actualizar regla existente
          newRule = await tx.taxRule.update({
            where: { code: rule.code },
            data: {
              name: rule.name,
              description: rule.description ?? null,
              rate: rule.rate,
              isPercentage: rule.isPercentage ?? true,
              isWithholding: rule.isWithholding ?? false,
              emitterPersonType: rule.emitterPersonType ?? null,
              receiverPersonType: rule.receiverPersonType ?? null,
              validFrom: new Date(rule.validFrom),
              validTo: rule.validTo ? new Date(rule.validTo) : null,
            },
          });
          processed.push({ code: rule.code, action: 'updated', id: newRule.id });
        } else {
          // Crear nueva regla
          newRule = await tx.taxRule.create({
            data: {
              code: rule.code,
              name: rule.name,
              description: rule.description ?? null,
              taxType: rule.taxType as TaxType,
              operationType: rule.operationType as OperationType,
              rate: rule.rate,
              isPercentage: rule.isPercentage ?? true,
              isWithholding: rule.isWithholding ?? false,
              emitterPersonType: (rule.emitterPersonType as PersonType) ?? null,
              receiverPersonType: (rule.receiverPersonType as PersonType) ?? null,
              validFrom: new Date(rule.validFrom),
              validTo: rule.validTo ? new Date(rule.validTo) : null,
            },
          });
          processed.push({ code: rule.code, action: 'created', id: newRule.id });
        }

        // Vincular con regímenes por código SAT
        if (rule.regimeSatCodes && rule.regimeSatCodes.length > 0) {
          // Limpiar vínculos anteriores
          await tx.taxRuleRegime.deleteMany({ where: { taxRuleId: newRule.id } });

          // Buscar regímenes por código SAT
          const regimes = await tx.taxRegime.findMany({
            where: { satCode: { in: rule.regimeSatCodes } },
          });

          if (regimes.length > 0) {
            await tx.taxRuleRegime.createMany({
              data: regimes.map((regime) => ({
                taxRuleId: newRule.id,
                taxRegimeId: regime.id,
              })),
            });
          }
        }
      }

      return processed;
    });

    return NextResponse.json({
      received: true,
      source: body.source,
      processed: results.length,
      details: results,
    });
  } catch (error) {
    console.error('[tax-update] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/tax-update
 * Devuelve las reglas vigentes (para integración con sistemas externos).
 */
export async function GET(req: NextRequest) {
  if (!authenticateRequest(req)) {
    return NextResponse.json(
      { error: 'No autorizado. Se requiere header X-Tax-Api-Key válido.' },
      { status: 401 }
    );
  }

  const rules = await prisma.taxRule.findMany({
    where: {
      validFrom: { lte: new Date() },
      OR: [
        { validTo: null },
        { validTo: { gte: new Date() } },
      ],
    },
    include: {
      regimes: {
        include: { taxRegime: { select: { satCode: true, name: true } } },
      },
    },
    orderBy: [{ taxType: 'asc' }, { operationType: 'asc' }],
  });

  return NextResponse.json({
    count: rules.length,
    asOf: new Date().toISOString(),
    rules,
  });
}
