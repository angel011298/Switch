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
 *   6. Escribir cookie cifra_onboarding_complete=1 para que el middleware
 *      no rebote al usuario de vuelta a /onboarding mientras el JWT se refresca
 *      (el JWT de Supabase solo se regenera cada hora via custom_access_token_hook)
 */

import { getSwitchSession } from '@/lib/auth/session';
import { validateRfc } from '@/lib/crm/rfc-validator';
import { sendWelcomeEmail } from '@/lib/email/mailer';
import { ensurePrismaUser } from '@/lib/auth/ensure-user';
import prisma from '@/lib/prisma';
import { ModuleKey } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
}): Promise<{ ok: false; error: string }> {
  try {
  const session = await getSwitchSession();
  if (!session?.userId) {
    return { ok: false, error: 'No hay sesión activa' };
  }

  // Garantizar que el usuario y su tenant existan en Prisma.
  // Red de seguridad para usuarios de Google OAuth cuyo JWT fue emitido antes
  // de que ensurePrismaUser creara el tenant (e.g. primer login vía Google).
  await ensurePrismaUser(
    session.userId,
    session.email,
    session.name ?? session.email.split('@')[0],
  );

  // Resolver tenantId: primero del JWT (rápido), luego por membership en BD.
  let tenantId = session.tenantId;
  if (!tenantId) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: session.userId },
      select: { tenantId: true },
    });
    tenantId = membership?.tenantId ?? null;
  }
  if (!tenantId) {
    return { ok: false, error: 'No se encontró la empresa asociada a tu cuenta. Contacta soporte.' };
  }

  // ── Normalizar datos ─────────────────────────────────────────────────────
  const rfc       = data.rfc.trim().toUpperCase();
  const legalName = data.legalName.trim().toUpperCase();
  const name      = data.name.trim();
  const zipCode   = data.zipCode.trim();

  // ── Validaciones ─────────────────────────────────────────────────────────
  if (!validateRfc(rfc)) {
    return { ok: false, error: 'RFC inválido. Verifica el formato (12 chars moral, 13 física).' };
  }
  if (!/^[0-9]{5}$/.test(zipCode)) {
    return { ok: false, error: 'Código postal inválido (debe ser 5 dígitos numéricos)' };
  }
  if (!name)      return { ok: false, error: 'Nombre de empresa requerido' };
  if (!legalName) return { ok: false, error: 'Razón social requerida' };
  if (!data.taxRegimeKey) return { ok: false, error: 'Régimen fiscal requerido' };

  // ── Régimen fiscal ───────────────────────────────────────────────────────
  const taxRegime = await prisma.taxRegime.findFirst({
    where: { satCode: data.taxRegimeKey },
  });

  // ── Módulos a activar ────────────────────────────────────────────────────
  const modulesToActivate = data.selectedModules?.length
    ? data.selectedModules
    : TRIAL_MODULES;

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

  // ── Cookie puente para el middleware ────────────────────────────────────
  // El JWT de Supabase (con el claim onboarding_complete) se regenera cada
  // hora vía custom_access_token_hook. Sin esta cookie, el middleware redirige
  // al usuario de vuelta a /onboarding porque el JWT todavía dice false.
  // La cookie se destruye sola cuando caduca (1 hora = tiempo máximo de JWT).
  // Cookie puente: valor = userId para que el middleware no la aplique a otras cuentas
  // que usen el mismo navegador antes de que el JWT se refresque (~1h).
  const cookieStore = await cookies();
  cookieStore.set('cifra_onboarding_complete', session.userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });

  // Navegar a dashboard — evita que Next.js re-renderice el layout actual
  // (lo que causaría "An error occurred in the Server Components render")
  redirect('/dashboard');

  } catch (err: any) {
    // CRÍTICO: redirect() lanza NEXT_REDIRECT — debe re-lanzarse para que
    // Next.js lo procese correctamente como navegación.
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) throw err;

    // Capturamos cualquier error inesperado (Prisma, red, etc.) y lo devolvemos
    // como string legible para que el cliente pueda mostrarlo sin que Next.js
    // lo oculte con el mensaje genérico de producción.
    const msg = err?.message ?? 'Error inesperado al guardar. Intenta de nuevo.';
    console.error('[setupTenantProfile]', msg);
    return { ok: false, error: msg };
  }
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
