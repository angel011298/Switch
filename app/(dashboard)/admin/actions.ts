'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ModuleKey } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// ─── Helper: Supabase Admin Client (Service Role) ─────────────────────────────

function getSupabaseAdmin() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Variables de entorno Supabase Admin no configuradas.')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── TOGGLE MÓDULO ────────────────────────────────────────────────────────────

/**
 * Toggle un modulo para un tenant.
 * Solo ejecutable por Super Admins.
 */
export async function toggleTenantModule(
  tenantId: string,
  moduleKey: string,
  activate: boolean
) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  const validKeys: string[] = [
    'DASHBOARD', 'CALENDAR', 'BI',
    'HCM', 'PAYROLL', 'TALENT',
    'FINANCE', 'TAXES', 'COLLECTIONS',
    'BILLING_CFDI', 'POS',
    'CRM', 'MARKETING', 'SUPPORT',
    'SCM', 'INVENTORY', 'LOGISTICS',
    'MRP', 'QUALITY', 'PROJECTS',
  ];

  if (!validKeys.includes(moduleKey)) throw new Error(`ModuleKey invalido: ${moduleKey}`);

  await prisma.tenantModule.upsert({
    where:  { tenantId_moduleKey: { tenantId, moduleKey: moduleKey as ModuleKey } },
    update: { isActive: activate },
    create: { tenantId, moduleKey: moduleKey as ModuleKey, isActive: activate },
  });

  revalidatePath('/admin');
  return { success: true, moduleKey, isActive: activate };
}

// ─── ACTIVAR / DESACTIVAR TODOS ───────────────────────────────────────────────

export async function activateAllModules(tenantId: string) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  const allKeys: ModuleKey[] = [
    'DASHBOARD', 'CALENDAR', 'BI',
    'HCM', 'PAYROLL', 'TALENT',
    'FINANCE', 'TAXES', 'COLLECTIONS',
    'BILLING_CFDI', 'POS',
    'CRM', 'MARKETING', 'SUPPORT',
    'SCM', 'INVENTORY', 'LOGISTICS',
    'MRP', 'QUALITY', 'PROJECTS',
  ];

  await Promise.all(
    allKeys.map((moduleKey) =>
      prisma.tenantModule.upsert({
        where:  { tenantId_moduleKey: { tenantId, moduleKey } },
        update: { isActive: true },
        create: { tenantId, moduleKey, isActive: true },
      })
    )
  );

  revalidatePath('/admin');
  return { success: true };
}

export async function deactivateAllModules(tenantId: string) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  await prisma.tenantModule.updateMany({
    where: { tenantId },
    data:  { isActive: false },
  });

  revalidatePath('/admin');
  return { success: true };
}

// ─── ELIMINAR TENANT DEFINITIVAMENTE ─────────────────────────────────────────

/**
 * Elimina un tenant de forma permanente:
 *  1. Obtiene todos los usuarios del tenant
 *  2. Los elimina de Supabase Auth (service role)
 *  3. Elimina el tenant de Prisma (cascade)
 *
 * ⚠️ ACCIÓN IRREVERSIBLE — solo Super Admin.
 */
export async function deleteTenant(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');

  try {
    // 1. Obtener usuarios vinculados a este tenant vía membresías
    const memberships = await prisma.tenantMembership.findMany({
      where:  { tenantId },
      include: { user: { select: { id: true, email: true } } },
    });

    const tenantUsers = memberships.map(m => m.user);

    // 2. Eliminar de Supabase Auth SOLO si no tienen membresías en otras empresas
    if (tenantUsers.length > 0) {
      const supabaseAdmin = getSupabaseAdmin();
      
      for (const user of tenantUsers) {
        // Contar otras membresías
        const otherMembershipsCount = await prisma.tenantMembership.count({
          where: {
            userId: user.id,
            NOT: { tenantId: tenantId }
          }
        });

        if (otherMembershipsCount === 0) {
          // El usuario solo pertenecía a esta empresa, procedemos a borrarlo de Supabase
          const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteErr) {
            console.warn(`[deleteTenant] No se pudo eliminar user ${user.email} de Supabase:`, deleteErr.message);
          }
        } else {
          console.info(`[deleteTenant] Persistiendo usuario ${user.email} porque pertenece a otras ${otherMembershipsCount} empresas.`);
        }
      }
    }

    // 3. Eliminar el tenant de Prisma
    try {
      await prisma.tenant.delete({ where: { id: tenantId } });
    } catch (cascadeErr: any) {
      if (cascadeErr?.code === 'P2003' || cascadeErr?.code === 'P2014') {
        // FK constraint — eliminar relaciones conocidas manualmente
        await prisma.$transaction([
          prisma.tenantModule.deleteMany({ where: { tenantId } }),
          prisma.tenantMembership.deleteMany({ where: { tenantId } }),
          prisma.tenant.delete({ where: { id: tenantId } }),
        ]);
      } else {
        throw cascadeErr;
      }
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('[deleteTenant] Error:', error);
    return {
      success: false,
      error: error?.message ?? 'Error al eliminar el tenant. Intenta de nuevo.',
    };
  }
}
