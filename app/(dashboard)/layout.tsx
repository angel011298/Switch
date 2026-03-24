import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSwitchSession } from '@/lib/auth/session';
import { ensurePrismaUser } from '@/lib/auth/ensure-user';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ModuleDeniedToast from '@/components/dashboard/ModuleDeniedToast';

export const metadata = {
  title: 'Switch OS',
  icons: { icon: '/icon.png?v=2' },
};

/**
 * Layout principal del Dashboard — Server Component.
 *
 * 1. Lee la sesion de Supabase (server-side)
 * 2. Sincroniza el usuario con Prisma si no existe (post-reset safety)
 * 3. Extrae active_modules y is_super_admin del JWT
 * 4. Pasa datos serializables al Sidebar (client component)
 *
 * NOTA: NO incluye <html> ni <body> — eso lo hace el root layout (app/layout.tsx).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSwitchSession();

  // Si no hay sesion, redirigir a login (defensa en profundidad + middleware)
  if (!session) {
    redirect('/login');
  }

  // Asegurar que el usuario exista en Prisma (cubre resets de BD)
  await ensurePrismaUser(session.userId, session.email, session.name);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar dinamico — solo modulos activos */}
      <Sidebar
        activeModules={session.activeModules}
        isSuperAdmin={session.isSuperAdmin}
        userName={session.name}
      />

      {/* Area principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con perfil */}
        <Header
          userName={session.name}
          userEmail={session.email}
          isSuperAdmin={session.isSuperAdmin}
        />

        {/* Contenido de la pagina */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* Toast de modulo denegado */}
      <Suspense fallback={null}>
        <ModuleDeniedToast />
      </Suspense>
    </div>
  );
}
