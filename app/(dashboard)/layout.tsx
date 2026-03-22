import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Providers } from '../providers';
import { getSwitchSession } from '@/lib/auth/session';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ModuleDeniedToast from '@/components/dashboard/ModuleDeniedToast';
import '../../styles/main.css';

export const metadata = {
  title: 'Switch OS',
  icons: { icon: '/icon.png?v=2' },
};

/**
 * Layout principal del Dashboard — Server Component.
 *
 * 1. Lee la sesion de Supabase (server-side)
 * 2. Extrae active_modules y is_super_admin del JWT
 * 3. Pasa datos serializables al Sidebar (client component)
 * 4. No hay fetch de modulos en el cliente = 0 waterfalls
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

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
        <Providers>
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
          </div>

          {/* Toast de modulo denegado */}
          <Suspense fallback={null}>
            <ModuleDeniedToast />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
