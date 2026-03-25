'use client';

/**
 * Switch OS — Root Error Boundary
 * =================================
 * Captura errores en páginas fuera del dashboard (login, landing, etc.)
 */

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción aquí se enviaría a un servicio de monitoreo (Sentry, etc.)
    console.error('[Switch OS] Root error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mx-auto">
          <span className="text-3xl">⚠️</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Algo salió mal</h1>
          <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
            Ocurrió un error inesperado. Intenta de nuevo o regresa al inicio.
          </p>
        </div>
        {error.digest && (
          <code className="block text-xs text-neutral-400 font-mono bg-neutral-50 dark:bg-neutral-900 rounded-xl px-4 py-2 border border-neutral-200 dark:border-neutral-800">
            {error.digest}
          </code>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
            Reintentar
          </button>
          <a href="/"
            className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm transition-colors">
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
