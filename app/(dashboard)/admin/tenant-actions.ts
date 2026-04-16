'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ModuleKey, SubscriptionStatus, PersonType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Admin Client ────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

const ALL_MODULE_KEYS: ModuleKey[] = [
  'DASHBOARD', 'CALENDAR', 'BI',
  'HCM', 'PAYROLL', 'TALENT',
  'FINANCE', 'TAXES', 'COLLECTIONS',
  'BILLING_CFDI', 'POS',
  'CRM', 'MARKETING', 'SUPPORT',
  'SCM', 'INVENTORY', 'LOGISTICS',
  'MRP', 'QUALITY', 'PROJECTS',
];

export interface CreateTenantInput {
  // Datos básicos
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;

  // Datos fiscales
  rfc: string;
  legalName: string;
  personType: 'FISICA' | 'MORAL';
  zipCode: string;
  taxRegimeId: string;

  // Suscripción
  planId: string;
  subscriptionStatus: SubscriptionStatus;
  validUntil: string | null; // ISO string o null = INDETERMINADA

  // Módulos a activar
  moduleKeys: string[];
}

export interface CreateTenantResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

// ─── ACTION: CREAR TENANT DESDE EL PANEL SUPER ADMIN ─────────────────────────

/**
 * Crea un nuevo tenant con todos los datos fiscales desde el panel Super Admin.
 * No envía email de bienvenida.
 * El onboarding se marca como completo (datos ya ingresados por el Super Admin).
 */
export async function createTenantFromAdmin(
  input: CreateTenantInput
): Promise<CreateTenantResult> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    return { success: false, error: 'Acceso denegado: se requiere Super Admin' };
  }

  // Validaciones básicas
  if (!input.name?.trim())         return { success: false, error: 'El nombre del tenant es requerido.' };
  if (!input.adminEmail?.trim())   return { success: false, error: 'El email del administrador es requerido.' };
  if (!input.adminPassword || input.adminPassword.length < 8)
    return { success: false, error: 'La contraseña debe tener mínimo 8 caracteres.' };
  if (!input.rfc?.trim())          return { success: false, error: 'El RFC es requerido.' };
  if (!input.legalName?.trim())    return { success: false, error: 'La razón social es requerida.' };
  if (!input.zipCode?.trim())      return { success: false, error: 'El código postal es requerido.' };
  if (!input.taxRegimeId?.trim())  return { success: false, error: 'El régimen fiscal es requerido.' };

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { success: false, error: 'Configuración de Supabase incompleta (SUPABASE_SERVICE_ROLE_KEY no disponible).' };
  }

  // Verificar que el RFC no exista ya
  const existing = await prisma.tenant.findFirst({
    where: { rfc: input.rfc.trim().toUpperCase() },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: `Ya existe un tenant con el RFC ${input.rfc.toUpperCase()}.` };
  }

  // Verificar email no duplicado en Prisma
  const existingUser = await prisma.user.findUnique({
    where: { email: input.adminEmail.trim().toLowerCase() },
  });
  if (existingUser) {
    return { success: false, error: 'Ya existe un usuario con ese email.' };
  }

  let supabaseUserId: string | null = null;

  try {
    // 1. Crear usuario en Supabase Auth (sin enviar email de confirmación)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.adminEmail.trim().toLowerCase(),
      password: input.adminPassword,
      email_confirm: true, // Confirmar el email automáticamente (super admin lo crea)
      user_metadata: { name: input.adminName?.trim() || input.adminEmail.split('@')[0] },
    });

    if (authError || !authData?.user) {
      return { success: false, error: authError?.message ?? 'Error al crear usuario en Supabase.' };
    }
    supabaseUserId = authData.user.id;

    // 2. Crear todo en Prisma en una transacción
    const tenant = await prisma.$transaction(async (tx) => {
      // 2a. Tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: input.name.trim(),
          rfc: input.rfc.trim().toUpperCase(),
          legalName: input.legalName.trim(),
          personType: input.personType as PersonType,
          zipCode: input.zipCode.trim(),
          taxRegimeId: input.taxRegimeId,
          onboardingComplete: true, // Super admin proveyó todos los datos
        },
      });

      // 2b. User en Prisma
      const newUser = await tx.user.create({
        data: {
          id: supabaseUserId!,
          email: input.adminEmail.trim().toLowerCase(),
          name: input.adminName?.trim() || input.adminEmail.split('@')[0],
        },
      });

      // 2c. TenantMembership (rol ADMIN para el primer usuario)
      await tx.tenantMembership.create({
        data: {
          userId: newUser.id,
          tenantId: newTenant.id,
          role: 'ADMIN',
        },
      });

      // 2d. Suscripción con plan y status elegidos por el Super Admin
      const validUntilDate = input.validUntil ? new Date(input.validUntil) : null;
      await tx.subscription.create({
        data: {
          tenantId: newTenant.id,
          planId: input.planId || 'standard',
          status: input.subscriptionStatus,
          validUntil: validUntilDate,
        },
      });

      // 2e. Módulos activos seleccionados
      const moduleKeysToActivate = (input.moduleKeys || [])
        .filter((k) => ALL_MODULE_KEYS.includes(k as ModuleKey)) as ModuleKey[];

      if (moduleKeysToActivate.length > 0) {
        await tx.tenantModule.createMany({
          data: moduleKeysToActivate.map((moduleKey) => ({
            tenantId: newTenant.id,
            moduleKey,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }

      // 2f. AuditLog — registro de creación manual
      await tx.auditLog.create({
        data: {
          tenantId: newTenant.id,
          actorId: session.userId,
          actorName: session.name || 'Super Admin',
          actorEmail: session.email,
          action: 'TENANT_CREATED_MANUAL',
          resource: 'Tenant',
          resourceId: newTenant.id,
          newData: {
            name: newTenant.name,
            rfc: newTenant.rfc,
            legalName: newTenant.legalName,
            personType: newTenant.personType,
            zipCode: newTenant.zipCode,
            plan: input.planId,
            status: input.subscriptionStatus,
            validUntil: input.validUntil ?? 'INDETERMINADA',
            modules: moduleKeysToActivate,
          },
          severity: 'info',
          isManualEntry: false,
        },
      });

      return newTenant;
    });

    revalidatePath('/admin');
    return { success: true, tenantId: tenant.id };
  } catch (error: any) {
    // Rollback: si se creó el usuario en Supabase pero falló Prisma, eliminar de Supabase
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch(() => {});
    }
    console.error('[createTenantFromAdmin] Error:', error);
    return { success: false, error: error?.message ?? 'Error inesperado al crear el tenant.' };
  }
}

// ─── ACTION: ACTUALIZAR SUSCRIPCIÓN DEL TENANT ────────────────────────────────

export interface UpdateSubscriptionInput {
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  validUntil: string | null; // null = INDETERMINADA
}

export async function updateTenantSubscription(
  input: UpdateSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    return { success: false, error: 'Acceso denegado: se requiere Super Admin' };
  }

  try {
    const previous = await prisma.subscription.findUnique({
      where: { tenantId: input.tenantId },
      select: { status: true, planId: true, validUntil: true },
    });

    const validUntilDate = input.validUntil ? new Date(input.validUntil) : null;

    await prisma.subscription.upsert({
      where: { tenantId: input.tenantId },
      update: {
        planId: input.planId,
        status: input.status,
        validUntil: validUntilDate,
      },
      create: {
        tenantId: input.tenantId,
        planId: input.planId,
        status: input.status,
        validUntil: validUntilDate,
      },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: session.userId,
        actorName: session.name || 'Super Admin',
        actorEmail: session.email,
        action: 'SUBSCRIPTION_UPDATED',
        resource: 'Subscription',
        resourceId: input.tenantId,
        oldData: previous
          ? {
              status: previous.status,
              planId: previous.planId,
              validUntil: previous.validUntil?.toISOString() ?? 'INDETERMINADA',
            }
          : null,
        newData: {
          status: input.status,
          planId: input.planId,
          validUntil: input.validUntil ?? 'INDETERMINADA',
        },
        severity: 'warning',
        isManualEntry: false,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('[updateTenantSubscription] Error:', error);
    return { success: false, error: error?.message ?? 'Error al actualizar suscripción.' };
  }
}
