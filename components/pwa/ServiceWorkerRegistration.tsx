'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Registra el Service Worker y muestra un toast cuando hay una
 * nueva versión disponible (FASE 52).
 */
export function ServiceWorkerRegistration() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[CIFRA PWA] SW registrado:', registration.scope);

        // Verificar actualizaciones cada vez que se enfoca la ventana
        const checkUpdate = () => registration.update().catch(() => {});
        window.addEventListener('focus', checkUpdate);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Nueva versión instalada y esperando activación
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[CIFRA PWA] Nueva versión disponible');
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          });
        });

        return () => window.removeEventListener('focus', checkUpdate);
      })
      .catch((err) => {
        console.warn('[CIFRA PWA] Error al registrar SW:', err);
      });
  }, []);

  function handleUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
    window.location.reload();
  }

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-neutral-900 dark:bg-white rounded-2xl shadow-2xl border border-neutral-700 dark:border-neutral-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-blue-400 dark:text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-white dark:text-neutral-900 text-sm">
              Nueva versión disponible
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              CIFRA ERP tiene una actualización lista.
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
              >
                Actualizar ahora
              </button>
              <button
                onClick={() => setShowUpdate(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 dark:bg-neutral-100 text-neutral-400 dark:text-neutral-600 text-xs font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
              >
                Después
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowUpdate(false)}
            className="text-neutral-500 hover:text-neutral-300 dark:hover:text-neutral-700 flex-shrink-0 -mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
