'use client';

/**
 * CIFRA — Dashboard Shell
 * ========================
 * FASE 52: Mobile First — Client wrapper que gestiona el estado del
 * menú lateral en móvil (drawer overlay).
 *
 * Recibe todas las props de Sidebar + Header como datos serializables,
 * permitiendo que el layout.tsx (Server Component) siga haciendo
 * el data-fetching mientras este componente gestiona el estado de UI.
 *
 * El children puede contener Server Components — Next.js App Router
 * pasa los children ya renderizados a los Client Components.
 */

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';

interface DashboardShellProps {
  children: React.ReactNode;
  // Sidebar props
  activeModules: string[];
  isSuperAdmin: boolean;
  userName: string;
  // Header props
  userEmail: string;
  subscriptionStatus?: string | null;
  daysLeft?: number | null;
  userTenants?: Array<{ id: string; name: string; rfc: string | null; role: string }>;
  activeTenantId?: string | null;
}

export default function DashboardShell({
  children,
  activeModules,
  isSuperAdmin,
  userName,
  userEmail,
  subscriptionStatus,
  daysLeft,
  userTenants = [],
  activeTenantId,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Mobile overlay ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (drawer on mobile, fixed on desktop) ────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40
          md:relative md:z-auto md:translate-x-0
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar
          activeModules={activeModules}
          isSuperAdmin={isSuperAdmin}
          userName={userName}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          userName={userName}
          userEmail={userEmail}
          isSuperAdmin={isSuperAdmin}
          subscriptionStatus={subscriptionStatus}
          daysLeft={daysLeft}
          onMobileMenuToggle={() => setMobileOpen(o => !o)}
          userTenants={userTenants}
          activeTenantId={activeTenantId}
        />

        {/* Extra bottom padding on mobile for the bottom nav bar */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ────────────────────────────────── */}
      <MobileBottomNav
        activeModules={activeModules}
        onMenuOpen={() => setMobileOpen(true)}
      />
    </div>
  );
}
