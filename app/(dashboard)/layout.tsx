import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import { getSwitchSession } from '@/lib/auth/session';
import { ensurePrismaUser } from '@/lib/auth/ensure-user';
import prisma from '@/lib/prisma';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
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

  // Calcular días restantes para badge de suscripción
  const daysLeft = session.validUntil
    ? Math.ceil(
        (new Date(session.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <I18nProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar dinámico — solo módulos activos */}
        <Sidebar
          activeModules={session.activeModules}
          isSuperAdmin={session.isSuperAdmin}
          userName={session.name}
        />

        {/* Área principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header con perfil y badge de suscripción */}
          <Header
            userName={session.name}
            userEmail={session.email}
            isSuperAdmin={session.isSuperAdmin}
            subscriptionStatus={session.subscriptionStatus}
            daysLeft={daysLeft}
          />

          {/* Contenido de la página */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            {children}
          </main>
        </div>

        {/* Toast de módulo denegado */}
        <Suspense fallback={null}>
          <ModuleDeniedToast />
        </Suspense>
      </div>
      <CopilotChat />
    </I18nProvider>
  );
}
