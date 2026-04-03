import Link from 'next/link'
import { Cookie, Shield, Lock, Globe } from 'lucide-react'

export const metadata = {
  title: 'Política de Cookies — CIFRA ERP',
  description: 'Información detallada sobre el uso de cookies en la plataforma CIFRA.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity mb-8">
            ← Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Política de Cookies</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-10">
          
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-zinc-400" />
              ¿Qué son las cookies?
            </h2>
            <p className="leading-relaxed">
              Las cookies son pequeños archivos de texto que los sitios web almacenan en su navegador para "recordar" información sobre usted. En CIFRA, utilizamos cookies para asegurar que la plataforma funcione correctamente, recordar sus preferencias y proteger sus datos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Categorías de cookies que utilizamos</h2>
            <div className="grid gap-6">
              
              {/* Essential */}
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold">Cookies Estrictamente Necesarias</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                  Estas cookies son esenciales para que usted pueda navegar por el sitio y usar sus funciones, como acceder a áreas seguras (Dashboard). Sin estas cookies, la plataforma no puede funcionar.
                </p>
                <div className="bg-white dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-100 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-2 font-bold">Nombre</th>
                        <th className="px-4 py-2 font-bold">Propósito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      <tr>
                        <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">sb-access-token</td>
                        <td className="px-4 py-2 text-zinc-500">Mantiene su sesión activa de forma segura.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">sb-refresh-token</td>
                        <td className="px-4 py-2 text-zinc-500">Renueva su sesión automáticamente.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Functional */}
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold">Cookies de Personalización</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                  Permiten que el sitio recuerde las elecciones que ha realizado en el pasado, como su idioma preferido.
                </p>
                <div className="bg-white dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-100 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-2 font-bold">Nombre</th>
                        <th className="px-4 py-2 font-bold">Propósito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      <tr>
                        <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">cifra-locale</td>
                        <td className="px-4 py-2 text-zinc-500">Almacena su preferencia de idioma (español/inglés).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Third Party */}
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-bold">Cookies de Terceros</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                  Utilizamos servicios como Stripe para el procesamiento de pagos. Stripe utiliza cookies para prevenir el fraude y asegurar la integridad de las transacciones financieras.
                </p>
              </div>

            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">¿Cómo puedo controlar las cookies?</h2>
            <p className="leading-relaxed mb-4">
              Usted tiene el derecho de decidir si acepta o rechaza las cookies. La mayoría de los navegadores web permiten controlar las cookies a través de la configuración del navegador. 
            </p>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
              Nota: Bloquear las cookies estrictamente necesarias impedirá que pueda iniciar sesión en el ERP y utilizar sus funciones core.
            </div>
          </section>

          <section className="pt-8 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-400">
            {/* Contacto eliminado por solicitud */}
          </section>

        </div>
      </div>
    </div>
  )
}

function CreditCard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}
