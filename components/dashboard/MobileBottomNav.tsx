'use client';

/**
 * CIFRA — Mobile Bottom Navigation
 * ==================================
 * FASE 52: Mobile First — Barra de navegación inferior para dispositivos móviles.
 * Visible solo en pantallas < md (768px).
 *
 * Muestra accesos directos a los módulos más usados según los módulos
 * activos del tenant, más un botón "Más" que abre el sidebar drawer.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  MoreHorizontal,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeModules: string[];
  onMenuOpen: () => void;
}

// Shortcuts fijos ordenados por prioridad
const SHORTCUTS = [
  { href: '/dashboard',    label: 'Inicio',    icon: LayoutDashboard, module: null },
  { href: '/billing',      label: 'Facturas',  icon: FileText,        module: 'BILLING' },
  { href: '/pos',          label: 'POS',        icon: ShoppingCart,    module: 'POS' },
  { href: '/crm',          label: 'CRM',        icon: Users,           module: 'CRM' },
  { href: '/finanzas',     label: 'Finanzas',   icon: DollarSign,      module: 'FINANCE' },
  { href: '/scm',          label: 'Inventario', icon: Package,         module: 'SCM' },
  { href: '/bi',           label: 'BI',         icon: BarChart3,       module: 'BI' },
];

export default function MobileBottomNav({ activeModules, onMenuOpen }: MobileBottomNavProps) {
  const pathname = usePathname() || '';

  // Seleccionar hasta 4 shortcuts que el tenant tenga activos
  const visible = SHORTCUTS.filter(s =>
    s.module === null || activeModules.includes(s.module)
  ).slice(0, 4);

  return (
    <nav
      className="
        md:hidden fixed bottom-0 inset-x-0 z-30
        bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl
        border-t border-neutral-200 dark:border-neutral-800
        safe-area-inset-bottom
      "
      aria-label="Navegación inferior"
    >
      <div className="flex items-stretch h-16">
        {visible.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 transition-all
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-xl transition-colors
                ${isActive ? 'bg-blue-500/10' : ''}
              `}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-blue-500 rounded-full" />
              )}
            </Link>
          );
        })}

        {/* ── Botón "Más" → abre sidebar drawer ── */}
        <button
          onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all"
          aria-label="Abrir menú completo"
        >
          <div className="p-1.5 rounded-xl">
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-medium leading-none">Más</span>
        </button>
      </div>
    </nav>
  );
}
