/**
 * CIFRA ERP — Service Worker
 * FASE 36: PWA + Offline support
 *
 * Estrategia:
 * - App shell (static assets): Cache-first
 * - API routes: Network-first con fallback a cache
 * - Páginas navegación: Stale-while-revalidate
 */

const CACHE_VERSION = 'v1';
const CACHE_STATIC  = `cifra-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `cifra-dynamic-${CACHE_VERSION}`;
const CACHE_API     = `cifra-api-${CACHE_VERSION}`;

// Assets que se cachean en la instalación (app shell)
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorar errores en instalación (algunos assets pueden no existir)
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('cifra-') && !key.endsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar mismo origen
  if (url.origin !== location.origin) return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Next.js internos
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // API routes → Network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE_API));
    return;
  }

  // Páginas de navegación → Stale-while-revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
    return;
  }

  // Assets estáticos → Cache-first
  event.respondWith(cacheFirst(request, CACHE_STATIC));
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response('Offline', { status: 503 });
}

// ── Push Notifications (stub para fase futura) ────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'CIFRA', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/dashboard' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
