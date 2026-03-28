'use client';

/**
 * CIFRA — Dashboard Error Boundary
 * =======================================
 * Captura errores en cualquier ruta del dashboard sin romper el shell.
 * El Sidebar y la navegación siguen funcionando.
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CIFRA] Dashboard error:', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-lg w-full space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white">Error en este módulo</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              El resto de CIFRA sigue funcionando con normalidad.
            </p>
          </div>
        </div>

        {/* Detalle del error (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
            <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">
              Detalle (solo en desarrollo)
            </p>
            <pre className="text-xs text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap overflow-auto max-h-32">
              {error.message}
            </pre>
          </div>
        )}

        {/* Digest en producción */}
        {process.env.NODE_ENV !== 'development' && error.digest && (
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Código de diagnóstico</p>
            <code className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{error.digest}</code>
          </div>
        )}

        {/* Sugerencias */}
        <ul className="text-sm text-neutral-500 space-y-1.5 list-disc list-inside">
          <li>Verifica tu conexión a internet</li>
          <li>Recarga la página con el botón de abajo</li>
          <li>Si el error persiste, contacta a soporte</li>
        </ul>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            🔄 Reintentar
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm transition-colors text-center"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
