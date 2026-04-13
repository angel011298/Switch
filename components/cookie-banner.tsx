'use client'

/**
 * CIFRA — Cookie Banner
 * =======================
 * Banner de consentimiento de cookies que:
 * - Aparece una sola vez por dispositivo/navegador
 * - Persiste la decisión en localStorage (clave: __cifra_cookie_consent)
 * - Soporta tres niveles: esenciales · preferencias · analíticas
 * - Se monta en app/(marketing)/layout.tsx y en el root app/layout.tsx
 *
 * La misma lógica vive también en @/components/legal/CookieBanner.
 * Este archivo es el punto de importación canónico para rutas de marketing.
 */

export { CookieBanner } from '@/components/legal/CookieBanner'
export { CookieBanner as default } from '@/components/legal/CookieBanner'
