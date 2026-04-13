import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, Section } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Política de Cookies · CIFRA ERP',
  description: 'Política de Cookies de CIFRA ERP — qué cookies usamos, para qué y cómo gestionarlas.',
}

export default function CookiesPage() {
  const lastUpdated = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  })

  return (
    <LegalLayout>
      <article>
        <div className="mb-10 pb-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            Cookies
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
            Política de Cookies
          </h1>
          <p className="text-neutral-500 text-sm">
            Última actualización: <strong>{lastUpdated}</strong>
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            Describe las tecnologías de almacenamiento local que CIFRA ERP utiliza, su finalidad y
            cómo puede gestionarlas, conforme al Aviso de Privacidad Integral.
          </p>
        </div>

        <Section id="1" title="1. ¿Qué son las cookies y el almacenamiento local?">
          <p>
            Las <strong>cookies</strong> son pequeños archivos de texto que un sitio web deposita
            en su navegador al visitarlo. El <strong>almacenamiento local</strong> (
            <code>localStorage</code> / <code>sessionStorage</code>) es una API del navegador que
            permite guardar datos de forma persistente sin fecha de expiración automática. Ambas
            tecnologías se usan para mantener sesiones, recordar preferencias y mejorar la
            experiencia de uso.
          </p>
        </Section>

        <Section id="2" title="2. Inventario de Cookies y Almacenamiento Local">

          <p className="font-semibold text-neutral-800 dark:text-neutral-200">
            A. Cookies de Sesión — Estrictamente Necesarias (Supabase Auth)
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            No requieren consentimiento. Son indispensables para el funcionamiento de la
            autenticación. Sin ellas no es posible iniciar sesión.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Nombre</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Tipo</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Duración</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Propósito</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['sb-[project]-auth-token', 'Cookie HttpOnly / Secure', 'Sesión / 1 h', 'JWT de acceso Supabase. Autentica cada solicitud al servidor.'],
                  ['sb-[project]-auth-token-code-verifier', 'Cookie HttpOnly / Secure', 'Sesión', 'Verifier PKCE para el flujo OAuth seguro de Supabase Auth.'],
                  ['__cifra_cookie_consent', 'localStorage', 'Permanente', 'Guarda el nivel de consentimiento de cookies elegido (versión + categorías aceptadas + timestamp).'],
                ].map(([name, type, duration, purpose], i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-2 font-mono text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700">{name}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{type}</td>
                    <td className="p-2 text-neutral-500 border border-neutral-200 dark:border-neutral-700">{duration}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-6">
            B. Almacenamiento de Preferencias (Analíticas)
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            Requieren consentimiento. Recuerdan configuraciones visuales del usuario. No se
            comparten con terceros.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Nombre</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Tipo</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Duración</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Propósito</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['theme', 'localStorage', 'Permanente', 'Tema de la interfaz seleccionado por el usuario (claro / oscuro / sistema).'],
                  ['sidebar_collapsed', 'localStorage', 'Permanente', 'Estado colapsado o expandido del menú lateral del dashboard.'],
                ].map(([name, type, duration, purpose], i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-2 font-mono text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700">{name}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{type}</td>
                    <td className="p-2 text-neutral-500 border border-neutral-200 dark:border-neutral-700">{duration}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-6">
            C. Caché del Service Worker (PWA)
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            Técnico, necesario para funcionamiento offline. No contiene datos personales
            identificables.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Caché</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Tipo</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Propósito</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['cifra-v5-static', 'Cache API (Service Worker)', 'Assets estáticos (JS, CSS, fuentes) para carga rápida y soporte offline.'],
                  ['cifra-v5-pages', 'Cache API (Service Worker)', 'Páginas HTML bajo estrategia Network-First; fallback offline.'],
                ].map(([name, type, purpose], i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-2 font-mono text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700">{name}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{type}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-6">
            D. Cookies de Terceros
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            Establecidas por proveedores externos necesarios para el funcionamiento del servicio.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Proveedor</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Cookie / Storage</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Propósito</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Política</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Stripe', '__stripe_mid, __stripe_sid', 'Prevención de fraude y seguridad de transacciones de pago (PCI-DSS Level 1). Solo se activan en páginas de pago.', 'stripe.com/privacy'],
                  ['Vercel', '_vercel_jwt (Edge)', 'Enrutamiento de Edge Functions. No contiene datos personales del usuario.', 'vercel.com/legal/privacy'],
                ].map(([provider, name, purpose, policy], i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-2 font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">{provider}</td>
                    <td className="p-2 font-mono text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700">{name}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{purpose}</td>
                    <td className="p-2 text-neutral-500 border border-neutral-200 dark:border-neutral-700">{policy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            CIFRA ERP <strong>no instala cookies de rastreo publicitario</strong> (Google Ads,
            Meta Pixel u otras redes) ni comparte datos con redes de publicidad de terceros.
          </p>
        </Section>

        <Section id="3" title="3. Cómo Rechazarlas — Gestión del Consentimiento">
          <p>
            Al ingresar por primera vez, se muestra un banner de consentimiento con tres opciones:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Aceptar todas:</strong> activa cookies esenciales, de preferencias y analíticas.</li>
            <li><strong>Solo esenciales:</strong> activa únicamente las cookies estrictamente necesarias para autenticación.</li>
            <li><strong>Personalizar:</strong> permite elegir individualmente las categorías opcionales.</li>
          </ul>
          <p className="mt-3">
            Su elección se persiste en <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">__cifra_cookie_consent</code> (localStorage).
            Puede <strong>revocar o modificar</strong> su consentimiento en cualquier momento
            eliminando dicha clave desde las herramientas de desarrollo del navegador
            (<kbd className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">F12</kbd>{' '}
            → Aplicación → Local Storage → eliminar la clave). Al recargar la página, el banner
            reaparecerá.
          </p>
        </Section>

        <Section id="4" title="4. Control desde el Navegador">
          <p>
            Adicionalmente, puede gestionar o eliminar cookies directamente desde la configuración
            de su navegador:
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              ['Chrome', 'Configuración → Privacidad y seguridad → Cookies y otros datos de sitios'],
              ['Firefox', 'Opciones → Privacidad y seguridad → Cookies y datos del sitio'],
              ['Safari', 'Preferencias → Privacidad → Gestionar datos del sitio web'],
              ['Edge', 'Configuración → Privacidad, búsqueda y servicios → Cookies y permisos del sitio'],
            ].map(([browser, path], i) => (
              <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">{browser}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{path}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            <strong>Aviso:</strong> Bloquear las cookies estrictamente necesarias (
            <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">sb-*</code>)
            impedirá el inicio de sesión y el acceso al ERP.
          </p>
        </Section>

        <Section id="5" title="5. Actualizaciones a Esta Política">
          <p>
            Cualquier cambio relevante en el uso de cookies se notificará mediante banner en el
            dashboard y/o correo electrónico, con al menos 15 días de anticipación. La fecha de
            &quot;Última actualización&quot; en la cabecera de esta página reflejará la versión
            vigente.
          </p>
        </Section>

        <div className="mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="font-black text-neutral-900 dark:text-white mb-2">Contacto</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Para consultas sobre esta política:{' '}
            <a
              href="mailto:angelortizsanchez0112@gmail.com"
              className="text-blue-600 dark:text-blue-400 underline"
            >
              angelortizsanchez0112@gmail.com
            </a>
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <Link href="/terminos" className="text-blue-600 dark:text-blue-400 underline">Términos y Condiciones</Link>
            <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 underline">Aviso de Privacidad</Link>
          </div>
        </div>
      </article>
    </LegalLayout>
  )
}
