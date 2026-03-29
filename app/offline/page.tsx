/**
 * CIFRA — Página offline (FASE 36 PWA)
 * Mostrada por el service worker cuando no hay conexión y no hay caché.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Sin conexión</h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
        No tienes acceso a internet. Algunas páginas pueden estar disponibles desde caché.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
      >
        Intentar de nuevo
      </button>

      <p className="mt-6 text-sm text-zinc-400">
        CIFRA ERP — Modo sin conexión
      </p>
    </div>
  );
}
