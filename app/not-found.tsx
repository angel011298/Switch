/**
 * Switch OS — 404 Not Found
 * ===========================
 * Página global para rutas inexistentes.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Código 404 */}
        <div>
          <p className="text-8xl font-black text-neutral-100 dark:text-neutral-800 select-none leading-none">404</p>
          <div className="-mt-6 relative z-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-neutral-900 dark:bg-white border border-neutral-800 dark:border-neutral-200 mx-auto shadow-xl">
              <span className="text-3xl">🔍</span>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Página no encontrada</h1>
          <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
            La ruta que buscas no existe o fue movida. Verifica la URL o regresa al dashboard.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/dashboard"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors">
            Ir al Dashboard
          </Link>
          <Link href="/"
            className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm transition-colors">
            Inicio
          </Link>
        </div>

        <p className="text-xs text-neutral-400">Switch OS · ERP/CRM Fiscal para México</p>
      </div>
    </div>
  );
}
