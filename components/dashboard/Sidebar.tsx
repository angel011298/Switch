'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ChevronDown,
  Bot,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { getActiveGroups, type ModuleDef } from '@/lib/modules/registry';
import { useI18n } from '@/lib/i18n/context';

// ─── Props ──────────────────────────────────────────────

interface SidebarProps {
  activeModules: string[];
  isSuperAdmin: boolean;
  userName: string;
}

// ─── Componente ─────────────────────────────────────────

export default function Sidebar({ activeModules, isSuperAdmin, userName }: SidebarProps) {
  const pathname = usePathname() || '';
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-abrir el grupo que contiene la ruta activa
  useEffect(() => {
    const groups = getActiveGroups(activeModules);
    for (const group of groups) {
      for (const mod of group.modules) {
        for (const route of mod.routes) {
          if (pathname === route.href || pathname.startsWith(route.href + '/')) {
            setOpenGroup(group.title);
            return;
          }
        }
      }
    }
  }, [pathname, activeModules]);

  const toggleGroup = (groupTitle: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroup(openGroup === groupTitle ? null : groupTitle);
  };

  // Filtra grupos según módulos activos del tenant
  const visibleGroups = getActiveGroups(activeModules);

  // Super admin ve todo si no tiene módulos asignados
  const effectiveGroups =
    isSuperAdmin && visibleGroups.length === 0
      ? getActiveGroups(Object.keys(require('@/lib/modules/registry').MODULE_DEFS))
      : visibleGroups;

  if (!mounted) {
    // Skeleton mientras monta
    return (
      <aside className="w-72 bg-neutral-50 dark:bg-black border-r border-neutral-200 dark:border-neutral-800 min-h-screen animate-pulse" />
    );
  }

  return (
    <aside
      className={`bg-neutral-50 dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 min-h-screen relative z-50
        ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Toggle collapsar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-black z-50"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Logo — clic siempre lleva al dashboard principal */}
      <Link
        href="/dashboard"
        title="Ir al Inicio"
        className={`px-4 py-6 mb-2 flex items-center transition-opacity hover:opacity-80 ${
          isCollapsed ? 'justify-center' : 'justify-start'
        }`}
      >
        {!isCollapsed ? (
          <div className="flex flex-col gap-1 overflow-hidden">
            {/* Logo día (light mode) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-light.png"
              alt="CIFRA"
              className="h-16 object-contain object-left rounded-lg block dark:hidden"
            />
            {/* Logo noche (dark mode) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.png"
              alt="CIFRA"
              className="h-16 object-contain object-left rounded-lg hidden dark:block"
            />
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest truncate">
              {t.sidebar.workspace}
            </p>
          </div>
        ) : (
          /* Collapsed: ícono cuadrado con Δ */
          <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-neutral-800 flex items-center justify-center shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-label="CIFRA" role="img">
              <polygon points="10,2 19,18 1,18" fill="white" />
              <polygon points="10,7 15.5,16.5 4.5,16.5" fill="#1d4ed8" />
            </svg>
          </div>
        )}
      </Link>

      {/* CIFRA AI */}
      <div className="px-3 mb-4">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('cifra-ai-open'))}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'
          } bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md transition-all group`}
          title={isCollapsed ? t.sidebar.aiButton : ''}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Bot
              className={`flex-shrink-0 ${
                isCollapsed ? 'h-6 w-6' : 'h-5 w-5'
              } group-hover:animate-bounce`}
            />
            {!isCollapsed && <span className="text-sm font-bold">{t.sidebar.aiButton}</span>}
          </div>
          {!isCollapsed && <Sparkles className="h-4 w-4 text-purple-200" />}
        </button>
      </div>

      {/* Navegacion de modulos */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        {effectiveGroups.map((group) => {
          const isOpen = openGroup === group.title && !isCollapsed;
          const allRoutes = group.modules.flatMap((m) => m.routes);
          const hasActiveRoute = allRoutes.some(
            (r) => pathname === r.href || pathname.startsWith(r.href + '/')
          );

          // Si el grupo solo tiene 1 modulo con 1 ruta, renderizar como link directo
          const isSingleLink = group.modules.length === 1 && allRoutes.length === 1;

          if (isSingleLink) {
            const route = allRoutes[0];
            const mod = group.modules[0];
            const isActive = pathname === route.href || pathname.startsWith(route.href + '/');

            return (
              <Link
                key={group.title}
                href={route.href}
                title={isCollapsed ? mod.label : ''}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                } rounded-xl transition-all ${
                  isActive
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
                }`}
              >
                <mod.icon
                  className={`flex-shrink-0 ${isCollapsed ? 'h-5 w-5' : `h-4 w-4 ${mod.color}`}`}
                />
                {!isCollapsed && <span className="text-sm font-medium truncate">{mod.label}</span>}
              </Link>
            );
          }

          return (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(group.title)}
                title={isCollapsed ? group.title : ''}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
                } rounded-xl transition-all
                  ${
                    hasActiveRoute && isCollapsed
                      ? 'bg-neutral-200 dark:bg-neutral-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
                  }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <GroupIcon
                    modules={group.modules}
                    isCollapsed={isCollapsed}
                    color={group.color}
                  />
                  {!isCollapsed && (
                    <span
                      className={`text-sm font-bold truncate ${
                        hasActiveRoute
                          ? 'text-neutral-900 dark:text-white'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {group.title}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Sub-items expandibles */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pl-11 pr-2 space-y-0.5 pb-2 border-l-2 border-neutral-100 dark:border-neutral-800 ml-5">
                  {group.modules.map((mod) =>
                    mod.routes.map((route) => {
                      const isSubActive =
                        pathname === route.href || pathname.startsWith(route.href + '/');
                      return (
                        <Link
                          key={route.href}
                          href={route.href}
                          className={`block px-3 py-2 rounded-lg text-xs transition-colors truncate
                            ${
                              isSubActive
                                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
                            }`}
                        >
                          {route.name}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Mensaje si no hay modulos */}
        {effectiveGroups.length === 0 && !isCollapsed && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-neutral-400 font-medium">
              {t.sidebar.noModules}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {t.sidebar.contactAdmin}
            </p>
          </div>
        )}
      </div>

      {/* Footer del sidebar */}
      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 px-3 pb-4">
        {/* Boton Admin para Super Admin */}
        {isSuperAdmin && (
          <Link
            href="/admin"
            title={isCollapsed ? t.sidebar.adminMaestro : ''}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-3'
            } rounded-xl transition-all font-black mb-2 ${
              pathname.startsWith('/admin')
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'bg-neutral-950 dark:bg-white text-white dark:text-black hover:opacity-90'
            }`}
          >
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">{t.sidebar.adminMaestro}</span>}
          </Link>
        )}

        {/* Toggle tema */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={isCollapsed ? (theme === 'dark' ? t.sidebar.dayMode : t.sidebar.nightMode) : ''}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2'
          } rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all`}
        >
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? t.sidebar.dayMode : t.sidebar.nightMode}
            </span>
          )}
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Moon className="h-4 w-4 flex-shrink-0" />
          )}
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
        }
      `}</style>
    </aside>
  );
}

// ─── Helper: Icono del grupo (usa el primer modulo) ─────

function GroupIcon({
  modules,
  isCollapsed,
  color,
}: {
  modules: ModuleDef[];
  isCollapsed: boolean;
  color: string;
}) {
  if (modules.length === 0) return null;
  const Icon = modules[0].icon;
  return (
    <Icon
      className={`flex-shrink-0 ${
        isCollapsed ? 'h-5 w-5 text-neutral-500' : `h-4 w-4 ${color}`
      }`}
    />
  );
}
