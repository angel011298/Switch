'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, X, Sparkles } from 'lucide-react';
import { MODULE_DEFS, type ModuleKey } from '@/lib/modules/registry';

/**
 * Toast que aparece cuando el middleware redirige por modulo no activo.
 * Lee ?module_denied=BILLING_CFDI del URL y muestra una notificacion
 * premium con el nombre del modulo.
 */
export default function ModuleDeniedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleColor, setModuleColor] = useState('');

  useEffect(() => {
    const denied = searchParams.get('module_denied');
    if (denied) {
      const def = MODULE_DEFS[denied as ModuleKey];
      setModuleName(def?.label ?? denied);
      setModuleColor(def?.color ?? 'text-red-500');
      setVisible(true);

      // Limpiar el parametro del URL sin recargar
      const params = new URLSearchParams(searchParams.toString());
      params.delete('module_denied');
      const cleanUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(cleanUrl, { scroll: false });

      // Auto-dismiss despues de 6 segundos
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 max-w-sm relative overflow-hidden">
        {/* Barra de acento superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-red-500" />

        {/* Boton cerrar */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl shrink-0">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-black text-neutral-900 dark:text-white text-sm leading-tight">
              Modulo no disponible
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
              <span className={`font-bold ${moduleColor}`}>{moduleName}</span> no esta
              incluido en tu plan actual.
            </p>
            <button className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              <Sparkles className="h-3 w-3" />
              Contactar soporte para activarlo
            </button>
          </div>
        </div>

        {/* Barra de progreso auto-dismiss */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-amber-500 animate-shrink-width"
            style={{ animationDuration: '6s' }}
          />
        </div>
      </div>
    </div>
  );
}
