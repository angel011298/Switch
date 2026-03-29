/**
 * Switch OS — Next.js Configuration
 * ====================================
 * FASE 19: Security headers, image optimization, strict mode.
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  // ── Rendering ──────────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── Imágenes ───────────────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',   // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
    ],
  },

  // ── Optimizaciones de paquetes ─────────────────────────────────────────────
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@supabase/ssr'],
  },

  // ── Security Headers (FASE 19) ─────────────────────────────────────────────
  async headers() {
    const securityHeaders = [
      // Previene clickjacking
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // Previene MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Referrer policy estricta
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Permisos de APIs del navegador
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
      },
      // DNS prefetch
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // HSTS (solo en producción real con HTTPS)
      ...(process.env.NODE_ENV === 'production'
        ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          }]
        : []),
      // Content-Security-Policy
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "font-src 'self'",
          "frame-src 'none'",
          "worker-src 'self' blob:",
        ].join('; '),
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        // Solo redirige al dashboard cuando NO viene un código de auth de Supabase.
        // Si llega /?code=... (flujo PKCE de confirmación de email), lo maneja app/page.tsx.
        source: '/',
        destination: '/dashboard',
        permanent: false,
        missing: [
          { type: 'query', key: 'code' },
          { type: 'query', key: 'token_hash' },
        ],
      },
    ];
  },
};

export default nextConfig;
