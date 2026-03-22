'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;          // e.g. 'text-purple-500'
  iconBg: string;             // e.g. 'bg-purple-50 dark:bg-purple-500/10'
  breadcrumbs: { label: string; href?: string }[];
  children?: React.ReactNode; // Para contenido real en el futuro
  comingSoon?: boolean;
}

export default function ModulePage({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  breadcrumbs,
  children,
  comingSoon = true,
}: ModulePageProps) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard"
          className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-600" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-neutral-900 dark:text-white font-bold">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Header del modulo */}
      <div className="flex items-start gap-5">
        <div className={`p-4 rounded-2xl ${iconBg} shrink-0`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400 text-base max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {/* Contenido o Coming Soon */}
      {children && !comingSoon ? (
        children
      ) : (
        <div className="mt-8">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Construction className="h-10 w-10 text-neutral-400" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">!</span>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              Modulo en Desarrollo
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
              Estamos construyendo algo increible para ti. Este modulo estara disponible muy pronto
              con todas las funcionalidades que necesitas.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex -space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full ${
                      i === 0
                        ? 'bg-emerald-500'
                        : i === 1
                        ? 'bg-emerald-300'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-400">En progreso</span>
            </div>
          </div>

          {/* Cards placeholder para dar sensacion de contenido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-4" />
                <div className="h-8 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-3" />
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
