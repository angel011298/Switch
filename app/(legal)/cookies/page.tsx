import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies · CIFRA ERP',
  description: 'Política de Cookies de CIFRA ERP — qué cookies usamos, para qué y cómo controlarlas.',
}

const LAST_UPDATED = '5 de abril de 2026'

export default function CookiesPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="not-prose mb-10 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
          Cookies &amp; Rastreo
        </div>
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
          Política de Cookies
        </h1>
        <p className="text-neutral-500">Última actualización: <strong>{LAST_UPDATED}</strong></p>
        <p className="text-sm text-neutral-400 mt-2">
          Esta política explica qué cookies y tecnologías similares utiliza <strong>CIFRA ERP</strong> (cifra-mx.vercel.app), con qué finalidad y cómo puede controlarlas.
        </p>
      </div>

      <Section id="1" title="1. ¿Qué son las cookies?">
        <p>
          Las <strong>cookies</strong> son pequeños archivos de texto que un sitio web almacena en su navegador o dispositivo cuando lo visita. Permiten que la plataforma recuerde información sobre su visita (por ejemplo, su sesión activa o preferencias de idioma) para mejorar su experiencia.
        </p>
        <p>
          Además de cookies, CIFRA ERP puede utilizar tecnologías similares como <strong>localStorage</strong> y <strong>sessionStorage</strong> del navegador para guardar preferencias de interfaz sin necesidad de transmitir datos al servidor.
        </p>
      </Section>

      <Section id="2" title="2. Tipos de cookies que utilizamos">

        <div className="not-prose space-y-4">
          {/* Esenciales */}
          <div className="p-5 border-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-black text-emerald-900 dark:text-emerald-200">🔒 Cookies Esenciales (Estrictamente Necesarias)</h3>
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full">Siempre activas</span>
            </div>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-3">
              Son indispensables para el funcionamiento de la plataforma. Sin ellas, no es posible iniciar sesión ni usar CIFRA ERP. <strong>No pueden desactivarse</strong>.
            </p>
            <CookieTable cookies={[
              {
                nombre: 'sb-[ref]-auth-token',
                proveedor: 'Supabase',
                proposito: 'Mantiene activa la sesión de autenticación del usuario.',
                duracion: 'Sesión / 1 hora (JWT + refresh token ~1 semana)',
                tipo: 'HttpOnly, Secure',
              },
              {
                nombre: 'sb-[ref]-auth-token.0/.1',
                proveedor: 'Supabase',
                proposito: 'Fragmentos del token de sesión para tokens largos.',
                duracion: 'Sesión',
                tipo: 'HttpOnly, Secure',
              },
              {
                nombre: '__cifra_cookie_consent',
                proveedor: 'CIFRA ERP',
                proposito: 'Almacena las preferencias de consentimiento de cookies del usuario.',
                duracion: '365 días',
                tipo: 'Persistent',
              },
            ]} />
          </div>

          {/* Preferencias */}
          <div className="p-5 border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 rounded-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-black text-blue-900 dark:text-blue-200">⚙️ Cookies de Preferencias (Funcionalidad)</h3>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">Opcional</span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              Permiten que CIFRA ERP recuerde sus elecciones para personalizar la experiencia.
            </p>
            <CookieTable cookies={[
              {
                nombre: 'theme',
                proveedor: 'CIFRA ERP (localStorage)',
                proposito: 'Recuerda su preferencia de tema: claro u oscuro.',
                duracion: 'Persistente (localStorage)',
                tipo: 'localStorage',
              },
              {
                nombre: 'i18n-locale',
                proveedor: 'CIFRA ERP (localStorage)',
                proposito: 'Idioma seleccionado en la interfaz (Español / English).',
                duracion: 'Persistente (localStorage)',
                tipo: 'localStorage',
              },
              {
                nombre: '__cifra_sidebar_state',
                proveedor: 'CIFRA ERP (localStorage)',
                proposito: 'Estado expandido/colapsado de la barra lateral de navegación.',
                duracion: 'Persistente (localStorage)',
                tipo: 'localStorage',
              },
            ]} />
          </div>

          {/* Analíticas */}
          <div className="p-5 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-black text-neutral-800 dark:text-neutral-200">📊 Cookies Analíticas (Rendimiento)</h3>
              <span className="px-2 py-0.5 bg-neutral-600 text-white text-xs font-bold rounded-full">Opcional</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Recopilan información <strong>anonimizada</strong> sobre cómo los usuarios utilizan la plataforma para mejorar el rendimiento y las funcionalidades. No contienen datos de identificación personal.
            </p>
            <CookieTable cookies={[
              {
                nombre: '__vercel_live_token',
                proveedor: 'Vercel',
                proposito: 'Monitoreo de rendimiento y disponibilidad de la aplicación. Datos anonimizados.',
                duracion: 'Sesión',
                tipo: 'Session',
              },
            ]} />
            <p className="text-xs text-neutral-400 mt-3">
              CIFRA ERP no utiliza actualmente herramientas de analítica de terceros como Google Analytics. Los datos de uso se procesan de forma anonimizada internamente.
            </p>
          </div>

          {/* PWA */}
          <div className="p-5 border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/5 rounded-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-black text-violet-900 dark:text-violet-200">📱 Service Worker y Caché (PWA)</h3>
              <span className="px-2 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full">Esencial para PWA</span>
            </div>
            <p className="text-sm text-violet-800 dark:text-violet-300 mb-3">
              CIFRA ERP es una Progressive Web App (PWA). El Service Worker almacena recursos en caché del navegador para permitir el acceso offline y mejorar la velocidad de carga.
            </p>
            <CookieTable cookies={[
              {
                nombre: 'cifra-v[N] (Cache API)',
                proveedor: 'CIFRA ERP (Service Worker)',
                proposito: 'Caché de recursos estáticos (CSS, JS, imágenes) para funcionamiento offline y carga rápida.',
                duracion: 'Hasta que se actualice la versión del SW',
                tipo: 'Cache API (no cookie)',
              },
            ]} />
          </div>
        </div>
      </Section>

      <Section id="3" title="3. Cookies de terceros">
        <p>
          Los siguientes proveedores pueden establecer cookies o almacenar datos en su navegador cuando utiliza CIFRA ERP:
        </p>
        <div className="not-prose space-y-3 mt-3">
          {[
            {
              proveedor: 'Supabase',
              uso: 'Gestión de autenticación y sesiones. Las cookies de Supabase son esenciales y no pueden desactivarse.',
              politica: 'https://supabase.com/privacy',
            },
            {
              proveedor: 'Stripe',
              uso: 'Cuando accede a la página de pago/suscripción, Stripe puede establecer cookies para prevenir fraude y mejorar la seguridad del pago.',
              politica: 'https://stripe.com/es-mx/privacy',
            },
            {
              proveedor: 'Vercel',
              uso: 'CDN y entrega de contenido. Vercel puede establecer cookies técnicas para enrutamiento y optimización de rendimiento.',
              politica: 'https://vercel.com/legal/privacy-policy',
            },
          ].map((t, i) => (
            <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{t.proveedor}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{t.uso}</p>
              <a href={t.politica} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                Política de privacidad de {t.proveedor} →
              </a>
            </div>
          ))}
        </div>
      </Section>

      <Section id="4" title="4. Base legal para el uso de cookies">
        <p>
          El uso de cookies en CIFRA ERP se fundamenta en:
        </p>
        <ul>
          <li><strong>Interés legítimo y necesidad contractual:</strong> Las cookies esenciales son necesarias para ejecutar el contrato de servicio con El Cliente (prestación del SaaS). Sin ellas, el inicio de sesión y el uso del ERP no son posibles.</li>
          <li><strong>Consentimiento:</strong> Las cookies de preferencias y analíticas solo se activan con su consentimiento explícito a través del banner de cookies.</li>
        </ul>
        <p>
          El tratamiento de datos asociados a cookies está contemplado en nuestro{' '}
          <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 underline">Aviso de Privacidad Integral</Link>.
        </p>
      </Section>

      <Section id="5" title="5. Gestión y control de cookies">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-2">5.1 Panel de Consentimiento de CIFRA</h3>
        <p>
          Al ingresar por primera vez a CIFRA ERP, se mostrará un banner de cookies donde podrá:
        </p>
        <ul>
          <li><strong>Aceptar todas:</strong> Habilita cookies esenciales, de preferencias y analíticas.</li>
          <li><strong>Solo esenciales:</strong> Habilita únicamente las cookies sin las cuales el sistema no puede funcionar.</li>
          <li><strong>Configurar:</strong> Personalizar qué categorías de cookies acepta.</li>
        </ul>
        <p>
          Puede cambiar sus preferencias en cualquier momento haciendo clic en el enlace &quot;Gestionar Cookies&quot; ubicado en el pie de página de la plataforma.
        </p>

        <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-2 mt-4">5.2 Control desde el Navegador</h3>
        <p>
          También puede controlar o eliminar cookies directamente desde la configuración de su navegador:
        </p>
        <div className="not-prose grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {[
            { browser: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
            { browser: 'Mozilla Firefox', url: 'https://support.mozilla.org/es/kb/Borrar%20cookies' },
            { browser: 'Safari (Mac/iOS)', url: 'https://support.apple.com/es-mx/guide/safari/sfri11471/mac' },
            { browser: 'Microsoft Edge', url: 'https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
            { browser: 'Opera', url: 'https://help.opera.com/en/latest/web-preferences/#cookies' },
            { browser: 'Samsung Internet', url: 'https://www.samsung.com/global/galaxy/apps/samsung-internet/' },
          ].map((b, i) => (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
              className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center">
              {b.browser} →
            </a>
          ))}
        </div>
        <p className="text-sm text-neutral-500 mt-3">
          <strong>Aviso:</strong> Deshabilitar las cookies esenciales impide el inicio de sesión y el uso de CIFRA ERP.
        </p>
      </Section>

      <Section id="6" title="6. Cookies y el módulo de AI Copilot">
        <p>
          El módulo de <strong>CIFRA AI Copilot</strong> (impulsado por Claude de Anthropic vía Vercel AI SDK) realiza llamadas a la API con autenticación basada en la sesión de Supabase (JWT). No establece cookies adicionales, pero las respuestas del modelo pueden incluir contexto del ERP recuperado de la base de datos del Tenant para personalizar las respuestas.
        </p>
      </Section>

      <Section id="7" title="7. Cookies y el Portal del Cliente">
        <p>
          El <strong>Portal del Cliente</strong> (accesible en <code>/portal/[token]</code>) es una sección pública que no requiere inicio de sesión. En lugar de cookies de autenticación, utiliza un <strong>token de acceso único de un solo uso</strong> (CustomerPortalToken) incluido en la URL, con tiempo de expiración configurable. No establece cookies persistentes.
        </p>
      </Section>

      <Section id="8" title="8. Retención de datos de cookies">
        <p>
          Los datos recopilados a través de cookies se conservan según los períodos indicados en la tabla de la Sección 2. Los datos analíticos anonimizados se agregan y eliminan los identificadores únicos en un plazo máximo de 90 días.
        </p>
      </Section>

      <Section id="9" title="9. Modificaciones a esta política">
        <p>
          CIFRA ERP puede actualizar esta Política de Cookies para reflejar cambios en las tecnologías utilizadas o en la legislación aplicable. Los cambios materiales se notificarán mediante el banner de cookies o correo electrónico, al menos 15 días antes de su entrada en vigor.
        </p>
      </Section>

      <div className="not-prose mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="font-black text-neutral-900 dark:text-white mb-2">¿Preguntas sobre cookies?</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Escríbenos a{' '}
          <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">
            angelortizsanchez0112@gmail.com
          </a>
        </p>
        <div className="flex gap-4 mt-4 text-sm">
          <Link href="/terminos" className="text-blue-600 dark:text-blue-400 underline">Términos y Condiciones</Link>
          <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 underline">Aviso de Privacidad</Link>
        </div>
      </div>
    </article>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className="mb-10">
      <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        {title}
      </h2>
      <div className="space-y-3 text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
        {children}
      </div>
    </section>
  )
}

function CookieTable({ cookies }: {
  cookies: { nombre: string; proveedor: string; proposito: string; duracion: string; tipo: string }[]
}) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-white/50 dark:bg-black/30">
            <th className="text-left p-2 font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">Nombre</th>
            <th className="text-left p-2 font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">Proveedor</th>
            <th className="text-left p-2 font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">Propósito</th>
            <th className="text-left p-2 font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">Duración</th>
            <th className="text-left p-2 font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, i) => (
            <tr key={i} className="hover:bg-white/30 dark:hover:bg-black/20">
              <td className="p-2 font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">{c.nombre}</td>
              <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{c.proveedor}</td>
              <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{c.proposito}</td>
              <td className="p-2 text-neutral-500 border border-neutral-200 dark:border-neutral-700">{c.duracion}</td>
              <td className="p-2 text-neutral-500 border border-neutral-200 dark:border-neutral-700">{c.tipo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
