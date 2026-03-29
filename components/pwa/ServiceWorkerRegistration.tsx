'use client';

import { useEffect } from 'react';

/**
 * Registra el Service Worker en producción (FASE 36).
 * Componente cliente que no renderiza nada visible.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[CIFRA PWA] SW registrado:', registration.scope);

        // Verificar actualizaciones al enfocar la ventana
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[CIFRA PWA] Nueva versión disponible');
              // Aquí se podría mostrar un toast de "Actualizar"
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[CIFRA PWA] Error al registrar SW:', err);
      });
  }, []);

  return null;
}
