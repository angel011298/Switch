'use client';

import { LogOut, Search, AlertCircle, Clock, Menu, User, ChevronDown, Building2, Check, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { useI18n } from '@/lib/i18n/context';

interface HeaderProps {
  userName: string;
  userEmail: string;
  isSuperAdmin: boolean;
  subscriptionStatus?: string | null;
  daysLeft?: number | null;
  onMobileMenuToggle?: () => void;
  userTenants?: Array<{ id: string; name: string; rfc: string | null; role: string }>;
  activeTenantId?: string | null;
}

export default function Header({
  userName,
  userEmail,
  isSuperAdmin,
  subscriptionStatus,
  daysLeft,
  onMobileMenuToggle,
  userTenants = [],
  activeTenantId,
}: HeaderProps) {
  const { t } = useI18n();
  const [signingOut, setSigningOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setSigningOut(true);
    // Hard redirect to server-side sign-out route.
    window.location.href = '/api/auth/signout';
  };

  const handleSwitchTenant = async (tenantId: string) => {
    if (tenantId === activeTenantId) return;
    
    // Guardar cookie de tenant activo y recargar
    // Usamos document.cookie directamente para simplicidad en el cliente
    document.cookie = `cifra_active_tenant_id=${tenantId}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.location.reload();
  };

  const activeTenant = userTenants.find(t => t.id === activeTenantId);

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

      {/* ── Mobile hamburger toggle ── */}
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
        </div>
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-3">
        {/* Badge de suscripción */}
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
              <AlertCircle size={14} />
            ) : (
              <Clock size={14} />
            )}
            <span>
              {isExpired ? 'Suscripción vencida' : `${daysLeft} días restantes`}
            </span>
          </Link>
        )}

        {/* Notificaciones */}
        <NotificationCenter />

        {/* ── Perfil Dropdown ────────────────────────────────────────── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-4 border-l border-neutral-200 dark:border-neutral-800 group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-neutral-900 dark:text-white leading-none group-hover:text-emerald-500 transition-colors">
                {userName}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 max-w-[120px] truncate">
                {activeTenant?.name || (isSuperAdmin ? 'Super Admin' : userEmail)}
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-black shadow-md shrink-0">
              {initials}
            </div>
            <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menú Dropdown Content */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              
              {/* Header de Usuario */}
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <p className="text-xs font-medium text-neutral-500 mb-1">Sesión activa como</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{userEmail}</p>
              </div>

              {/* Tenant Switcher Section */}
              {userTenants.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-1 text-[10px] font-black text-neutral-400 uppercase tracking-wider">Empresas</p>
                  <div className="max-h-40 overflow-y-auto">
                    {userTenants.map((tenant) => (
                      <button
                        key={tenant.id}
                        onClick={() => handleSwitchTenant(tenant.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${tenant.id === activeTenantId ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
                      >
                        <Building2 className="h-4 w-4 shrink-0" />
                        <div className="flex-1 truncate">
                          <p className="text-xs truncate">{tenant.name}</p>
                          <p className="text-[10px] opacity-60 font-mono italic">{tenant.role}</p>
                        </div>
                        {tenant.id === activeTenantId && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200 dark:border-neutral-800"></div>

              {/* Links de Perfil y Ajustes */}
              <div className="py-2">
                <Link
                  href="/settings/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </Link>
                {isSuperAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Panel Admin
                  </Link>
                )}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800"></div>

              {/* Acción de Cerrar Sesión */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Cerrando...' : 'Cerrar Sesión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
