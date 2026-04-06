import Link from 'next/link'
import Image from 'next/image'

export function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3">
            <Image src="/logo-light.png" alt="CIFRA" width={100} height={32} className="dark:hidden" />
            <Image src="/logo-dark.png" alt="CIFRA" width={100} height={32} className="hidden dark:block" />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-neutral-500">
            <Link href="/terminos" className="hover:text-neutral-900 dark:hover:text-white transition-colors hidden sm:inline">Términos</Link>
            <Link href="/privacidad" className="hover:text-neutral-900 dark:hover:text-white transition-colors hidden sm:inline">Privacidad</Link>
            <Link href="/cookies" className="hover:text-neutral-900 dark:hover:text-white transition-colors hidden sm:inline">Cookies</Link>
            <Link href="/login" className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition-opacity text-xs">
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>

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

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className="mb-10">
      <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        {title}
      </h2>
      <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
        {children}
      </div>
    </section>
  )
}

export function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{title}</h3>
      <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">{children}</div>
    </div>
  )
}
