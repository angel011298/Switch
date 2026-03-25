import type { NextConfig } from 'next';

/**
 * Switch OS — Next.js Configuration
 * ====================================
 * FASE 19: Security headers, image optimization, strict mode.
 */

const nextConfig: NextConfig = {
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
          // Scripts: self + supabase + inline para Next.js
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
          // Estilos: self + inline para Tailwind
          "style-src 'self' 'unsafe-inline'",
          // Imágenes: self + supabase + data URIs
          "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
          // Conexiones: self + supabase + API PAC
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          // Fuentes: self
          "font-src 'self'",
          // Frames: ninguno
          "frame-src 'none'",
          // Workers
          "worker-src 'self' blob:",
        ].join('; '),
      },
    ];

    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirigir raíz al dashboard
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
