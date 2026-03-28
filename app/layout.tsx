import type { Metadata } from 'next'
import { Providers } from './providers'

import '../styles/main.css'

export const metadata: Metadata = {
  title: 'CIFRA',
  description: 'ERP y CRM Fiscal para empresas mexicanas · CFDI 4.0',
  icons: {
    icon:    '/favicon.ico',
    apple:   '/icon-192.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
