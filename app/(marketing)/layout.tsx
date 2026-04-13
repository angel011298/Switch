/**
 * CIFRA — Marketing Route Group Layout
 * ======================================
 * Layout para páginas públicas de marketing, legales y planes.
 * Rutas: /landing, /planes, /privacidad, /terminos, /cookies
 *
 * El CookieBanner se renderiza globalmente en app/layout.tsx.
 * Este layout solo agrupa las rutas públicas; el LegalLayout
 * (header + footer) lo provee cada página individualmente.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
