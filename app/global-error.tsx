'use client';

/**
 * Switch OS — Global Error Boundary
 * ====================================
 * Captura errores irrecuperables en el root layout.
 * Se muestra cuando error.tsx no puede rescatar la situación.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Logo */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
            <span className="text-3xl">💥</span>
          </div>

          {/* Mensaje */}
          <div>
            <h1 className="text-2xl font-black text-white">Error crítico del sistema</h1>
            <p className="text-neutral-400 mt-2 text-sm leading-relaxed">
              Switch OS encontró un error irrecuperable. Nuestro equipo fue notificado automáticamente.
            </p>
          </div>

          {/* Código de diagnóstico */}
          {error.digest && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-left">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Código de diagnóstico</p>
              <code className="text-xs text-red-400 font-mono">{error.digest}</code>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Reintentar
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-sm transition-colors"
            >
              Ir al inicio
            </a>
          </div>

          <p className="text-xs text-neutral-600">
            Switch OS ERP/CRM Fiscal para México
          </p>
        </div>
      </body>
    </html>
  );
}
