/**
 * Switch OS — Sincronización Prisma (Server-side only)
 * =====================================================
 * Asegura que el usuario de Supabase Auth exista en la tabla User de Prisma.
 * Se llama desde el dashboard layout (Server Component), no desde Server Actions,
 * para no interferir con las cookies de sesión durante el login.
 */

import prisma from '@/lib/prisma';

/**
 * Verifica que exista un User en Prisma para el userId dado.
 * Si no existe, lo crea junto con su Tenant.
 * Si existe con otro ID (post-reset), actualiza el ID.
 */
export async function ensurePrismaUser(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  try {
    // 1. Buscar por ID (caso normal — mayoria de las veces)
    const byId = await prisma.user.findUnique({ where: { id: userId } });
    if (byId) return;

    // 2. Buscar por email (caso post-reset: user existe con otro ID)
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      await prisma.user.update({
        where: { email },
        data: { id: userId },
      });
      console.log(`[ensurePrismaUser] ID actualizado para ${email}`);
      return;
    }

    // 3. No existe → crear tenant + user
    const isSuperAdmin = email === '553angelortiz@gmail.com';

    await prisma.tenant.create({
      data: {
        name: `ERP - ${name}`,
        users: {
          create: {
            id: userId,
            email,
            name,
            role: 'ADMIN',
            isSuperAdmin,
          },
        },
      },
    });

    console.log(`[ensurePrismaUser] Creado usuario Prisma para ${email}`);
  } catch (error: any) {
    // P2002 = unique constraint → el usuario ya existe, no es un error real
    if (error?.code === 'P2002') return;
    console.error('[ensurePrismaUser] Error:', error?.message ?? error);
    // No lanzar — nunca bloquear el dashboard por un error de sync
  }
}
