/**
 * Switch OS — Seed: Activar TODOS los modulos para el Super Admin
 * ================================================================
 * Busca el User con email 553angelortiz@gmail.com, encuentra su Tenant
 * y le activa los 20 modulos del enum ModuleKey.
 *
 * Ejecutar: npx tsx prisma/seed.ts
 */

import { PrismaClient, ModuleKey } from '@prisma/client';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = '553angelortiz@gmail.com';

// Todos los ModuleKeys del enum
const ALL_MODULES: ModuleKey[] = [
  'DASHBOARD',
  'CALENDAR',
  'BI',
  'HCM',
  'PAYROLL',
  'TALENT',
  'FINANCE',
  'TAXES',
  'COLLECTIONS',
  'BILLING_CFDI',
  'POS',
  'CRM',
  'MARKETING',
  'SUPPORT',
  'SCM',
  'INVENTORY',
  'LOGISTICS',
  'MRP',
  'QUALITY',
  'PROJECTS',
];

async function main() {
  console.log('🔍 Buscando usuario Super Admin...');

  const user = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    include: { tenant: true },
  });

  if (!user) {
    console.error(`❌ No se encontro usuario con email: ${SUPER_ADMIN_EMAIL}`);
    console.log('   Asegurate de haber completado el registro en /login primero.');
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ${user.name} (${user.email})`);
  console.log(`🏢 Tenant: ${user.tenant.name} (${user.tenant.id})`);

  // Asegurar que el usuario tenga isSuperAdmin = true
  if (!user.isSuperAdmin) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true, role: 'ADMIN' },
    });
    console.log('🔑 Se activo isSuperAdmin = true y role = ADMIN');
  }

  // Activar TODOS los modulos con upsert (idempotente)
  console.log(`\n📦 Activando ${ALL_MODULES.length} modulos para Tenant "${user.tenant.name}"...\n`);

  for (const moduleKey of ALL_MODULES) {
    const result = await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId: user.tenantId,
          moduleKey,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        tenantId: user.tenantId,
        moduleKey,
        isActive: true,
      },
    });

    console.log(`   ✅ ${moduleKey.padEnd(15)} → activo (${result.id})`);
  }

  console.log(`\n🎉 ¡Seed completado! Los ${ALL_MODULES.length} modulos estan activos.`);
  console.log('   Cierra sesion y vuelve a iniciar para que el JWT se regenere');
  console.log('   con los active_modules actualizados.\n');
}

main()
  .catch((e) => {
    console.error('💥 Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
