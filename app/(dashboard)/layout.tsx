import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { Suspense } from 'react';
import { getSwitchSession } from '@/lib/auth/session';
import { ensurePrismaUser } from '@/lib/auth/ensure-user';
import prisma from '@/lib/prisma';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ModuleDeniedToast from '@/components/dashboard/ModuleDeniedToast';
import { I18nProvider } from '@/lib/i18n/context';
import { CopilotChat } from '@/components/ai/CopilotChat';

export const metadata = {
  title: 'CIFRA',
  icons: {
    icon: [{ url: '/icon', sizes: '32x32', type: 'image/png' }],
  },
};

/**
 * Layout principal del Dashboard — Server Component.
 *
 * 1. Lee la sesion de Supabase (server-side)
 * 2. Sincroniza el usuario con Prisma si no existe (post-reset safety)
 * 3. FASE 12: Si tenant no completó onboarding, redirige a /onboarding
 * 4. Extrae active_modules y is_super_admin del JWT
 * 5. Pasa datos serializables al Sidebar (client component)
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSwitchSession();

  // Sin sesion → login
  if (!session) {
    redirect('/login');
  }

  // Asegurar que el usuario exista en Prisma
  await ensurePrismaUser(session.userId, session.email, session.name);

  // FASE 12: Forzar onboarding si el tenant no tiene perfil fiscal
  if (!session.isSuperAdmin && session.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { onboardingComplete: true },
    });

    // Obtener pathname para no redirigir si ya está en /onboarding
    const headersList = headers();
    const pathname = headersList.get('x-pathname') ?? '';

    if (!tenant?.onboardingComplete && !pathname.startsWith('/onboarding')) {
      redirect('/onboarding');
    }
  }

  // FASE 51: Check 2FA verification
  const cookieStore = await cookies();
  const twoFaVerified = cookieStore.get('cifra_2fa_verified')?.value === '1';

  if (!twoFaVerified) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { twoFactorEnabled: true },
    });
    if (dbUser?.twoFactorEnabled) {
      redirect('/auth/2fa');
    }
  }

  // Calcular días restantes para badge de suscripción
  const daysLeft = session.validUntil
    ? Math.ceil(
        (new Date(session.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // FASE Multi-Tenant: Obtener todas las empresas a las que pertenece el usuario
  const userTenants = await prisma.tenantMembership.findMany({
    where: { userId: session.userId },
    include: {
      tenant: {
        select: { id: true, name: true, rfc: true }
      }
    }
  });

  return (
    <I18nProvider>
      {/* FASE 52: DashboardShell gestiona el estado del drawer móvil */}
      <DashboardShell
        activeModules={session.activeModules}
        isSuperAdmin={session.isSuperAdmin}
        userName={session.name}
        userEmail={session.email}
        subscriptionStatus={session.subscriptionStatus ?? null}
        daysLeft={daysLeft}
        userTenants={userTenants.map(m => ({
          id: m.tenant.id,
          name: m.tenant.name,
          rfc: m.tenant.rfc,
          role: m.role
        }))}
        activeTenantId={session.tenantId}
      >
        {children}
      </DashboardShell>

      {/* Toast de módulo denegado */}
      <Suspense fallback={null}>
        <ModuleDeniedToast />
      </Suspense>
      <CopilotChat />
    </I18nProvider>
  );
}
