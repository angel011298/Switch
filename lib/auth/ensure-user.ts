/**
 * Switch OS — Sincronización Prisma (Server-side only)
 * =====================================================
 * FASE 12: Auto-crear tenant con subscription TRIAL + módulos base.
 *
 * Flujo al primer login:
 * 1. Busca usuario por ID (caso normal)
 * 2. Si no, busca por email (caso post-reset de BD)
 * 3. Si tampoco, crea: Tenant + User + Subscription(TRIAL 14 días) + 4 módulos base
 *
 * Los 4 módulos base permiten operar desde día 1:
 *   DASHBOARD    → centro de KPIs
 *   BILLING_CFDI → emitir facturas
 *   POS          → punto de venta
 *   CRM          → gestión de clientes
 */

import prisma from '@/lib/prisma';

const BASE_MODULES = ['DASHBOARD', 'BILLING_CFDI', 'POS', 'CRM'] as const;
const TRIAL_DAYS = 14;

export async function ensurePrismaUser(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  try {
    // 1. Buscar por ID (caso normal — mayoría de las veces)
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

    // 3. Usuario nuevo → crear todo en una sola operación
    const isSuperAdmin = email === '553angelortiz@gmail.com';

    // validUntil = hoy + 14 días (TRIAL estándar SaaS)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + TRIAL_DAYS);

    await prisma.tenant.create({
      data: {
        name: `ERP - ${name}`,   // Se actualiza en onboarding
        rfc: '',                  // Se captura en onboarding
        legalName: '',            // Se captura en onboarding
        zipCode: '',              // Se captura en onboarding
        onboardingComplete: false,

        users: {
          create: {
            id: userId,
            email,
            name,
            role: 'ADMIN',
            isSuperAdmin,
          },
        },

        // Subscription TRIAL automática — paywall activado
        subscription: {
          create: {
            status: 'TRIAL',
            validUntil,
          },
        },

        // 4 módulos base activos desde el día 1
        modules: {
          createMany: {
            data: BASE_MODULES.map((moduleKey) => ({
              moduleKey,
              isActive: true,
            })),
          },
        },
      },
    });

    console.log(
      `[ensurePrismaUser] Tenant creado para ${email}. ` +
        `Módulos: ${BASE_MODULES.join(', ')}. TRIAL hasta: ${validUntil.toISOString()}`
    );
  } catch (error: any) {
    // P2002 = unique constraint → usuario ya existe, no es error real
    if (error?.code === 'P2002') return;
    console.error('[ensurePrismaUser] Error:', error?.message ?? error);
    // Nunca lanzar — no bloquear el dashboard por un error de sync
  }
}
