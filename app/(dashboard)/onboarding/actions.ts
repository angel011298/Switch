'use server';

/**
 * CIFRA — Onboarding Actions
 * ================================
 * FASE 21: Captura perfil fiscal + activa módulos seleccionados + email bienvenida.
 *
 * Flujo completo:
 *   1. Validar RFC, CP, razón social (CFF Art. 27, Anexo 20 CFDI 4.0)
 *   2. Actualizar Tenant con datos fiscales
 *   3. Crear TenantModule para cada módulo seleccionado (upsert — idempotente)
 *   4. Email de bienvenida (best-effort — nunca bloquea)
 *   5. Marcar onboardingComplete = true
 */

import { getSwitchSession } from '@/lib/auth/session';
import { validateRfc } from '@/lib/crm/rfc-validator';
import { sendWelcomeEmail } from '@/lib/email/mailer';
import prisma from '@/lib/prisma';
import { ModuleKey } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Módulos que se activan en el plan TRIAL por defecto
const TRIAL_MODULES: ModuleKey[] = [
  ModuleKey.DASHBOARD,
  ModuleKey.CALENDAR,
  ModuleKey.BI,
  ModuleKey.HCM,
  ModuleKey.PAYROLL,
  ModuleKey.FINANCE,
  ModuleKey.TAXES,
  ModuleKey.COLLECTIONS,
  ModuleKey.BILLING_CFDI,
  ModuleKey.POS,
  ModuleKey.CRM,
  ModuleKey.SCM,
  ModuleKey.INVENTORY,
  ModuleKey.PROJECTS,
];

// ─── COMPLETAR ONBOARDING ────────────────────────────────────────────────────

export async function setupTenantProfile(data: {
  name: string;
  legalName: string;
  rfc: string;
  zipCode: string;
  taxRegimeKey: string;
  selectedModules?: ModuleKey[];
}) {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    throw new Error('No hay sesión activa');
  }

  // ── Normalizar datos ─────────────────────────────────────────────────────
  const rfc       = data.rfc.trim().toUpperCase();
  const legalName = data.legalName.trim().toUpperCase();
  const name      = data.name.trim();
  const zipCode   = data.zipCode.trim();

  // ── Validaciones ─────────────────────────────────────────────────────────
  if (!validateRfc(rfc)) {
    throw new Error('RFC inválido. Verifica el formato (12 chars moral, 13 física).');
  }
  if (!/^[0-9]{5}$/.test(zipCode)) {
    throw new Error('Código postal inválido (debe ser 5 dígitos numéricos)');
  }
  if (!name)      throw new Error('Nombre de empresa requerido');
  if (!legalName) throw new Error('Razón social requerida');
  if (!data.taxRegimeKey) throw new Error('Régimen fiscal requerido');

  // ── Régimen fiscal ───────────────────────────────────────────────────────
  const taxRegime = await prisma.taxRegime.findFirst({
    where: { satCode: data.taxRegimeKey },
  });

  // ── Módulos a activar ────────────────────────────────────────────────────
  const modulesToActivate = data.selectedModules?.length
    ? data.selectedModules
    : TRIAL_MODULES;

  const tenantId = session.tenantId;

  // ── Transacción atómica ──────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    // 1. Actualizar perfil fiscal del tenant
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        legalName,
        rfc,
        zipCode,
        taxRegimeId: taxRegime?.id ?? undefined,
        onboardingComplete: true,
        termsAcceptedAt: new Date(), // Registra la aceptación de T&C
      },
    });

    // 2. Activar módulos seleccionados (upsert — idempotente)
    for (const moduleKey of modulesToActivate) {
      await tx.tenantModule.upsert({
        where: { tenantId_moduleKey: { tenantId, moduleKey } },
        update: { isActive: true },
        create: { tenantId, moduleKey, isActive: true },
      });
    }
  });

  // ── Email de bienvenida (best-effort) ────────────────────────────────────
  try {
    if (session.email) {
      await sendWelcomeEmail({
        to: session.email,
        tenantName: name,
        userName: session.name ?? session.email,
        modulesActivated: modulesToActivate.length,
      });
    }
  } catch {
    // Nunca bloquea el flujo principal
  }

  revalidatePath('/', 'layout');
}

// ─── ESTADO DE ONBOARDING ────────────────────────────────────────────────────

export async function getOnboardingStatus(): Promise<boolean> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return false;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { onboardingComplete: true },
  });

  return tenant?.onboardingComplete ?? false;
}

// MODULE_GROUPS y ModuleGroup se definen en ./constants (sin 'use server')
// para evitar el error "A use server file can only export async functions"
