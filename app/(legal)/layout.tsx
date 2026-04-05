import Link from 'next/link'
import Image from 'next/image'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3">
            <Image src="/logo-light.png" alt="CIFRA" width={100} height={32} className="dark:hidden" />
            <Image src="/logo-dark.png" alt="CIFRA" width={100} height={32} className="hidden dark:block" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-500">
            <Link href="/terminos" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacidad</Link>
            <Link href="/cookies" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Cookies</Link>
            <Link href="/login" className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition-opacity">
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} CIFRA ERP · Angel Alberto Ortiz Sánchez · Nezahualcóyotl, Estado de México</p>
          <div className="flex gap-6">
            <Link href="/terminos" className="hover:text-neutral-600 transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-neutral-600 transition-colors">Privacidad</Link>
            <Link href="/cookies" className="hover:text-neutral-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
