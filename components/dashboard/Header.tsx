'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LogOut, Search, AlertCircle, Clock, Menu } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/context';

interface HeaderProps {
  userName: string;
  userEmail: string;
  isSuperAdmin: boolean;
  // FASE 12: Paywall badge
  subscriptionStatus?: string | null;
  daysLeft?: number | null;
  /** FASE 52: Mobile hamburger toggle */
  onMobileMenuToggle?: () => void;
}

export default function Header({
  userName,
  userEmail,
  isSuperAdmin,
  subscriptionStatus,
  daysLeft,
  onMobileMenuToggle,
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Iniciales del usuario para el avatar
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Determinar badge de suscripción
  const showSubscriptionBadge =
    !isSuperAdmin &&
    subscriptionStatus !== null &&
    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 5);

  const isExpired = daysLeft !== null && daysLeft !== undefined && daysLeft <= 0;

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">

      {/* ── FASE 52: Hamburger button (mobile only) ── */}
      {onMobileMenuToggle && (
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mr-2 flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Barra de búsqueda global */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder={t.header.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-3">
        {/* FASE 12: Badge de suscripción — solo visible cuando quedan ≤5 días */}
        {showSubscriptionBadge && (
          <Link
            href="/billing/subscription"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 ${
              isExpired
                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600'
                : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-600'
            }`}
          >
            {isExpired ? (
              <>
                <AlertCircle size={14} />
                <span>Suscripción vencida</span>
              </>
            ) : (
              <>
                <Clock size={14} />
                <span>{daysLeft} día{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}</span>
              </>
            )}
          </Link>
        )}

        {/* Selector de idioma */}
        <LanguageSwitcher />

        {/* Notificaciones */}
        <NotificationCenter />

        {/* Perfil */}
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-neutral-900 dark:text-white leading-none">
              {userName}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {isSuperAdmin ? 'Super Admin' : userEmail}
            </p>
          </div>

          {/* Avatar con iniciales */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-black shadow-md">
            {initials}
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Cerrar Sesión"
            className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
