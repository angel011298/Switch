'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ModuleKey } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Toggle un modulo para un tenant.
 * Solo ejecutable por Super Admins.
 */
export async function toggleTenantModule(
  tenantId: string,
  moduleKey: string,
  activate: boolean
) {
  // Validar sesion y permisos
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    throw new Error('Acceso denegado: se requiere Super Admin');
  }

  // Validar que el moduleKey sea valido
  const validKeys: string[] = [
    'DASHBOARD', 'CALENDAR', 'BI',
    'HCM', 'PAYROLL', 'TALENT',
    'FINANCE', 'TAXES', 'COLLECTIONS',
    'BILLING_CFDI', 'POS',
    'CRM', 'MARKETING', 'SUPPORT',
    'SCM', 'INVENTORY', 'LOGISTICS',
    'MRP', 'QUALITY', 'PROJECTS',
  ];

  if (!validKeys.includes(moduleKey)) {
    throw new Error(`ModuleKey invalido: ${moduleKey}`);
  }

  // Upsert: crear si no existe, actualizar si ya existe
  await prisma.tenantModule.upsert({
    where: {
      tenantId_moduleKey: {
        tenantId,
        moduleKey: moduleKey as ModuleKey,
      },
    },
    update: {
      isActive: activate,
    },
    create: {
      tenantId,
      moduleKey: moduleKey as ModuleKey,
      isActive: activate,
    },
  });

  // Revalidar la pagina de admin para reflejar el cambio
  revalidatePath('/admin');

  return { success: true, moduleKey, isActive: activate };
}

/**
 * Activa TODOS los modulos para un tenant.
 */
export async function activateAllModules(tenantId: string) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    throw new Error('Acceso denegado: se requiere Super Admin');
  }

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
        where: { tenantId_moduleKey: { tenantId, moduleKey } },
        update: { isActive: true },
        create: { tenantId, moduleKey, isActive: true },
      })
    )
  );

  revalidatePath('/admin');
  return { success: true };
}

/**
 * Desactiva TODOS los modulos para un tenant.
 */
export async function deactivateAllModules(tenantId: string) {
  const session = await getSwitchSession();
  if (!session?.isSuperAdmin) {
    throw new Error('Acceso denegado: se requiere Super Admin');
  }

  await prisma.tenantModule.updateMany({
    where: { tenantId },
    data: { isActive: false },
  });

  revalidatePath('/admin');
  return { success: true };
}
