'use server';

/**
 * CIFRA — Server Actions: Gestión de Reglas Fiscales
 * ======================================================
 * Permite al Super Admin crear, actualizar y expirar reglas fiscales
 * sin modificar código. Todas las operaciones son auditables.
 *
 * Ref: CFF Art. 29, 29-A | RMF vigente
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { TaxType, OperationType, PersonType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ─────────────────────────────────────────────

export interface CreateTaxRuleInput {
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
  validFrom: string; // ISO date string
  validTo?: string | null;
  regimeIds: string[]; // IDs de TaxRegime a vincular
}

export interface UpdateTaxRuleInput {
  id: string;
  name?: string;
  description?: string;
  rate?: number;
  isPercentage?: boolean;
  isWithholding?: boolean;
  emitterPersonType?: PersonType | null;
  receiverPersonType?: PersonType | null;
  validTo?: string | null;
  regimeIds?: string[];
}

// ─── HELPERS ───────────────────────────────────────────

async function requireSuperAdmin() {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    throw new Error('Acceso denegado: se requiere Super Admin');
  }
  return session;
}

// ─── ACCIONES ──────────────────────────────────────────

/**
 * Crear una nueva regla fiscal.
 * Opcionalmente expira la regla anterior del mismo tipo/operación.
 */
export async function createTaxRule(input: CreateTaxRuleInput) {
  await requireSuperAdmin();

  const {
    code,
    name,
    description,
    taxType,
    operationType,
    rate,
    isPercentage = true,
    isWithholding = false,
    emitterPersonType = null,
    receiverPersonType = null,
    validFrom,
    validTo = null,
    regimeIds,
  } = input;

  // Validar que el code sea único
  const existing = await prisma.taxRule.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`Ya existe una regla con código: ${code}`);
  }

  // Crear la regla y sus vínculos con regímenes en una transacción
  const rule = await prisma.$transaction(async (tx) => {
    const newRule = await tx.taxRule.create({
      data: {
        code,
        name,
        description: description ?? null,
        taxType,
        operationType,
        rate,
        isPercentage,
        isWithholding,
        emitterPersonType,
        receiverPersonType,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null,
      },
    });

    // Vincular con regímenes fiscales
    if (regimeIds.length > 0) {
      await tx.taxRuleRegime.createMany({
        data: regimeIds.map((taxRegimeId) => ({
          taxRuleId: newRule.id,
          taxRegimeId,
        })),
      });
    }

    return newRule;
  });

  revalidatePath('/admin');
  return { success: true, ruleId: rule.id, code: rule.code };
}

/**
 * Actualizar una regla fiscal existente.
 * No permite cambiar code, taxType ni operationType (crear nueva regla en su lugar).
 */
export async function updateTaxRule(input: UpdateTaxRuleInput) {
  await requireSuperAdmin();

  const { id, regimeIds, ...updateData } = input;

  const rule = await prisma.taxRule.findUnique({ where: { id } });
  if (!rule) {
    throw new Error(`Regla no encontrada: ${id}`);
  }

  await prisma.$transaction(async (tx) => {
    // Actualizar campos de la regla
    const data: Record<string, unknown> = {};
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.rate !== undefined) data.rate = updateData.rate;
    if (updateData.isPercentage !== undefined) data.isPercentage = updateData.isPercentage;
    if (updateData.isWithholding !== undefined) data.isWithholding = updateData.isWithholding;
    if (updateData.emitterPersonType !== undefined) data.emitterPersonType = updateData.emitterPersonType;
    if (updateData.receiverPersonType !== undefined) data.receiverPersonType = updateData.receiverPersonType;
    if (updateData.validTo !== undefined) {
      data.validTo = updateData.validTo ? new Date(updateData.validTo) : null;
    }

    if (Object.keys(data).length > 0) {
      await tx.taxRule.update({ where: { id }, data });
    }

    // Reemplazar vínculos con regímenes si se proporcionaron
    if (regimeIds !== undefined) {
      await tx.taxRuleRegime.deleteMany({ where: { taxRuleId: id } });
      if (regimeIds.length > 0) {
        await tx.taxRuleRegime.createMany({
          data: regimeIds.map((taxRegimeId) => ({
            taxRuleId: id,
            taxRegimeId,
          })),
        });
      }
    }
  });

  revalidatePath('/admin');
  return { success: true, ruleId: id };
}

/**
 * Expirar una regla fiscal (soft-delete via validTo).
 * La regla deja de aplicarse desde la fecha indicada.
 * Ref: Cuando la Miscelánea Fiscal cambia, se cierra la regla anterior.
 */
export async function expireTaxRule(ruleId: string, expireDate?: string) {
  await requireSuperAdmin();

  const rule = await prisma.taxRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw new Error(`Regla no encontrada: ${ruleId}`);
  }

  const validTo = expireDate ? new Date(expireDate) : new Date();

  await prisma.taxRule.update({
    where: { id: ruleId },
    data: { validTo },
  });

  revalidatePath('/admin');
  return { success: true, ruleId, expiredAt: validTo.toISOString() };
}

/**
 * Propagar nueva regla fiscal: crea una nueva versión de una regla existente
 * y expira la anterior. Útil para cambios en la Miscelánea Fiscal.
 *
 * Ejemplo: IVA cambia de 16% a 17% → expira la regla vieja, crea la nueva.
 */
export async function propagateTaxRuleUpdate(
  oldRuleId: string,
  newRuleData: Omit<CreateTaxRuleInput, 'regimeIds'> & { regimeIds?: string[] }
) {
  await requireSuperAdmin();

  const oldRule = await prisma.taxRule.findUnique({
    where: { id: oldRuleId },
    include: { regimes: true },
  });

  if (!oldRule) {
    throw new Error(`Regla anterior no encontrada: ${oldRuleId}`);
  }

  const newValidFrom = new Date(newRuleData.validFrom);

  // Usar los mismos regímenes de la regla anterior si no se especifican nuevos
  const regimeIds = newRuleData.regimeIds ?? oldRule.regimes.map((r) => r.taxRegimeId);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Expirar la regla anterior (un día antes del inicio de la nueva)
    const expireDate = new Date(newValidFrom);
    expireDate.setDate(expireDate.getDate() - 1);

    await tx.taxRule.update({
      where: { id: oldRuleId },
      data: { validTo: expireDate },
    });

    // 2. Crear la nueva regla
    const newRule = await tx.taxRule.create({
      data: {
        code: newRuleData.code,
        name: newRuleData.name,
        description: newRuleData.description ?? null,
        taxType: newRuleData.taxType,
        operationType: newRuleData.operationType,
        rate: newRuleData.rate,
        isPercentage: newRuleData.isPercentage ?? true,
        isWithholding: newRuleData.isWithholding ?? false,
        emitterPersonType: newRuleData.emitterPersonType ?? null,
        receiverPersonType: newRuleData.receiverPersonType ?? null,
        validFrom: newValidFrom,
        validTo: newRuleData.validTo ? new Date(newRuleData.validTo) : null,
      },
    });

    // 3. Vincular con regímenes
    if (regimeIds.length > 0) {
      await tx.taxRuleRegime.createMany({
        data: regimeIds.map((taxRegimeId) => ({
          taxRuleId: newRule.id,
          taxRegimeId,
        })),
      });
    }

    return newRule;
  });

  revalidatePath('/admin');
  return {
    success: true,
    oldRuleId,
    newRuleId: result.id,
    newRuleCode: result.code,
  };
}

/**
 * Obtener todas las reglas fiscales vigentes con sus regímenes.
 * Para el panel de administración.
 */
export async function getTaxRules() {
  await requireSuperAdmin();

  const rules = await prisma.taxRule.findMany({
    include: {
      regimes: {
        include: { taxRegime: true },
      },
    },
    orderBy: [
      { taxType: 'asc' },
      { operationType: 'asc' },
      { validFrom: 'desc' },
    ],
  });

  return rules;
}

/**
 * Obtener todos los regímenes fiscales del catálogo SAT.
 */
export async function getTaxRegimes() {
  await requireSuperAdmin();

  return prisma.taxRegime.findMany({
    orderBy: { satCode: 'asc' },
  });
}
