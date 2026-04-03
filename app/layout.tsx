import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { CookieConsent } from '@/components/legal/CookieConsent'

import '../styles/main.css'

export const metadata: Metadata = {
  title: 'CIFRA',
  description: 'ERP y CRM Fiscal para empresas mexicanas · CFDI 4.0',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CIFRA ERP',
  },
  formatDetection: { telephone: false },
  icons: {
    // Next.js sirve /icon desde app/icon.tsx (PNG con Δ azul)
    icon: [{ url: '/icon', sizes: '32x32', type: 'image/png' }],
    apple: '/icon-192.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <CookieConsent />
      </body>
    </html>
  )
}
