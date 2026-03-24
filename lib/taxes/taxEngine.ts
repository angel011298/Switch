/**
 * Switch OS — Motor de Reglas Fiscales (Tax Engine)
 * ==================================================
 * Calcula dinamicamente impuestos, retenciones y deducciones
 * basandose en el perfil fiscal del Tenant, el tipo de operacion
 * y el marco juridico vigente en la fecha de la transaccion.
 *
 * PRINCIPIO CENTRAL: Cero tasas hardcodeadas.
 * Todas las tasas y reglas se leen de la base de datos (TaxRule),
 * versionadas por fecha de vigencia para soportar cambios en la
 * Miscelanea Fiscal (RMF) sin modificar codigo.
 *
 * FUNDAMENTO LEGAL:
 * - LIVA: Art. 1 (tasa general), Art. 1-A (retenciones), Art. 2-A (tasa 0%)
 * - LISR: Art. 106 (retenciones servicios), Art. 111-113 (RESICO)
 * - CFF:  Art. 29, 29-A (requisitos CFDI)
 * - RMF:  Reglas vigentes de Miscelanea Fiscal
 */

import prisma from '@/lib/prisma';
import type { PersonType, OperationType, TaxType } from '@prisma/client';

// ─── TIPOS DE RESULTADO ─────────────────────────────────

/** Detalle de un impuesto individual calculado */
export interface TaxLineItem {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  taxType: TaxType;
  rate: number;          // Tasa efectiva (ej. 0.16 = 16%)
  isWithholding: boolean;
  amount: number;        // Monto calculado (siempre positivo)
  legalBasis: string;    // Fundamento legal
}

/** Resultado completo del calculo fiscal */
export interface TaxCalculationResult {
  subtotal: number;
  transferredTaxes: TaxLineItem[];    // Impuestos trasladados (IVA, IEPS)
  withheldTaxes: TaxLineItem[];       // Impuestos retenidos (Ret. IVA, Ret. ISR)
  totalTransferred: number;            // Suma de trasladados
  totalWithheld: number;               // Suma de retenidos
  total: number;                        // subtotal + trasladados - retenidos
  effectiveRate: number;                // Tasa efectiva total sobre subtotal
  metadata: TaxCalculationMetadata;
}

/** Metadatos del calculo para auditoria y trazabilidad */
export interface TaxCalculationMetadata {
  tenantId: string;
  tenantRfc: string | null;
  tenantRegime: string | null;
  tenantPersonType: PersonType | null;
  operationType: OperationType;
  transactionDate: string;
  rulesEvaluated: number;
  rulesApplied: number;
  calculatedAt: string;
  engineVersion: string;
}

// ─── INPUT ──────────────────────────────────────────────

export interface TaxCalculationInput {
  /** Monto base (subtotal antes de impuestos) */
  amount: number;
  /** ID del Tenant emisor de la transaccion */
  tenantId: string;
  /** Tipo de operacion (venta producto, servicio, nomina, etc.) */
  operationType: OperationType;
  /** Fecha de la transaccion (determina reglas vigentes) */
  transactionDate?: Date;
  /**
   * Tipo de persona del receptor (contraparte).
   * Requerido para calcular retenciones automaticas.
   * Ej: Persona Fisica que factura servicios a Persona Moral → retencion ISR.
   * Ref: Art. 106 LISR parrafo 2.
   */
  receiverPersonType?: PersonType;
}

// ─── ENGINE ─────────────────────────────────────────────

const ENGINE_VERSION = '1.0.0';

/**
 * Calcula los impuestos de una transaccion.
 *
 * Flujo del algoritmo:
 * 1. Obtener perfil fiscal del Tenant (regimen, tipo persona)
 * 2. Consultar reglas vigentes para la fecha y tipo de operacion
 * 3. Filtrar por regimen fiscal del Tenant
 * 4. Filtrar por tipo de persona emisor/receptor
 * 5. Calcular montos trasladados y retenidos
 * 6. Ensamblar resultado con trazabilidad completa
 */
export async function calculateTransactionTaxes(
  input: TaxCalculationInput
): Promise<TaxCalculationResult> {
  const {
    amount,
    tenantId,
    operationType,
    transactionDate = new Date(),
    receiverPersonType,
  } = input;

  // ─── 1. Obtener perfil fiscal del Tenant ────────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      taxRegime: true,
    },
  });

  if (!tenant) {
    throw new TaxEngineError(`Tenant no encontrado: ${tenantId}`, 'TENANT_NOT_FOUND');
  }

  const tenantPersonType = tenant.personType;
  const tenantRegimeId = tenant.taxRegimeId;

  // ─── 2. Consultar reglas vigentes ───────────────────
  // Busca todas las reglas que:
  //   a) Coincidan con el tipo de operacion
  //   b) Esten vigentes en la fecha de transaccion
  //   c) Apliquen al regimen fiscal del Tenant (via TaxRuleRegime)
  const candidateRules = await prisma.taxRule.findMany({
    where: {
      operationType,
      validFrom: { lte: transactionDate },
      OR: [
        { validTo: null },                         // Vigente indefinidamente
        { validTo: { gte: transactionDate } },     // Aun no expira
      ],
      // Solo reglas vinculadas al regimen del Tenant (o sin regimen = universales)
      ...(tenantRegimeId
        ? {
            regimes: {
              some: { taxRegimeId: tenantRegimeId },
            },
          }
        : {}),
    },
    orderBy: [
      { taxType: 'asc' },
      { validFrom: 'desc' }, // Mas reciente primero (en caso de overlap)
    ],
  });

  // ─── 3. Filtrar por tipo de persona emisor/receptor ─
  const applicableRules = candidateRules.filter((rule) => {
    // Filtro por tipo de persona del emisor (Tenant)
    if (rule.emitterPersonType && tenantPersonType) {
      if (rule.emitterPersonType !== tenantPersonType) return false;
    }

    // Filtro por tipo de persona del receptor
    if (rule.receiverPersonType && receiverPersonType) {
      if (rule.receiverPersonType !== receiverPersonType) return false;
    }

    // Si la regla requiere un tipo de receptor pero no se proporciono, no aplicar
    if (rule.receiverPersonType && !receiverPersonType) return false;

    return true;
  });

  // ─── 4. Deduplicar por taxType (la mas reciente gana) ─
  const deduped = deduplicateByTaxType(applicableRules);

  // ─── 5. Calcular montos ─────────────────────────────
  const transferredTaxes: TaxLineItem[] = [];
  const withheldTaxes: TaxLineItem[] = [];

  for (const rule of deduped) {
    const rate = Number(rule.rate);
    const taxAmount = rule.isPercentage
      ? round(amount * rate)
      : round(Number(rule.rate)); // Cuota fija

    const lineItem: TaxLineItem = {
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      taxType: rule.taxType,
      rate,
      isWithholding: rule.isWithholding,
      amount: taxAmount,
      legalBasis: rule.description ?? '',
    };

    if (rule.isWithholding) {
      withheldTaxes.push(lineItem);
    } else {
      transferredTaxes.push(lineItem);
    }
  }

  // ─── 6. Ensamblar resultado ─────────────────────────
  const totalTransferred = transferredTaxes.reduce((sum, t) => sum + t.amount, 0);
  const totalWithheld = withheldTaxes.reduce((sum, t) => sum + t.amount, 0);
  const total = round(amount + totalTransferred - totalWithheld);

  return {
    subtotal: amount,
    transferredTaxes,
    withheldTaxes,
    totalTransferred: round(totalTransferred),
    totalWithheld: round(totalWithheld),
    total,
    effectiveRate: amount > 0 ? round((total - amount) / amount) : 0,
    metadata: {
      tenantId,
      tenantRfc: tenant.rfc,
      tenantRegime: tenant.taxRegime?.satCode ?? null,
      tenantPersonType,
      operationType,
      transactionDate: transactionDate.toISOString(),
      rulesEvaluated: candidateRules.length,
      rulesApplied: deduped.length,
      calculatedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
    },
  };
}

// ─── HELPERS ────────────────────────────────────────────

/**
 * Deduplica reglas por taxType: si hay 2 reglas de IVA,
 * gana la de validFrom mas reciente (la mas actualizada).
 */
function deduplicateByTaxType(
  rules: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    taxType: TaxType;
    operationType: OperationType;
    rate: any;
    isPercentage: boolean;
    isWithholding: boolean;
    emitterPersonType: PersonType | null;
    receiverPersonType: PersonType | null;
    validFrom: Date;
    validTo: Date | null;
  }>
) {
  // Clave compuesta: taxType + isWithholding (para diferenciar IVA trasladado de IVA retenido)
  const map = new Map<string, (typeof rules)[number]>();

  for (const rule of rules) {
    const key = `${rule.taxType}:${rule.isWithholding}`;
    const existing = map.get(key);

    if (!existing || rule.validFrom > existing.validFrom) {
      map.set(key, rule);
    }
  }

  return Array.from(map.values());
}

/** Redondea a 2 decimales (precision monetaria MXN) */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── ERRORES ────────────────────────────────────────────

export class TaxEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'TaxEngineError';
  }
}
