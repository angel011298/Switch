import type { Metadata } from 'next'
import { Providers } from './providers'

import '../styles/main.css'

export const metadata: Metadata = {
  title: 'Switch',
  icons: {
    icon: '/icon.png?v=2',
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
