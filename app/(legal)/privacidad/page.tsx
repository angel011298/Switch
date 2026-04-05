import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad · CIFRA ERP',
  description: 'Aviso de Privacidad Integral de CIFRA ERP conforme a la LFPDPPP.',
}

const LAST_UPDATED = '2 de abril de 2026'

export default function PrivacidadPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="not-prose mb-10 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
          LFPDPPP
        </div>
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
          Aviso de Privacidad Integral
        </h1>
        <p className="text-neutral-500">Última actualización: <strong>{LAST_UPDATED}</strong></p>
        <p className="text-sm text-neutral-400 mt-2">
          En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y demás normatividad aplicable.
        </p>
      </div>

      <Section id="1" title="1. Identidad y Domicilio del Responsable">
        <p>
          El responsable del tratamiento de sus datos personales es <strong>Angel Alberto Ortiz Sánchez</strong> (en adelante, <strong>&quot;CIFRA ERP&quot;</strong> o <strong>&quot;El Responsable&quot;</strong>), con domicilio legal para oír y recibir notificaciones en:
        </p>
        <div className="not-prose my-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400">
          <strong>Calle 33 No. 53</strong>, Col. Estado de México, C.P. 57210<br />
          Nezahualcóyotl, Estado de México, México<br />
          Correo: <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">angelortizsanchez0112@gmail.com</a>
        </div>
      </Section>

      <Section id="2" title="2. Datos Personales Recabados">
        <p>CIFRA ERP recabará las siguientes categorías de datos personales según el módulo utilizado:</p>
        <table className="not-prose w-full text-sm mt-4 border-collapse">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800">
              <th className="text-left p-3 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Categoría</th>
              <th className="text-left p-3 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Datos</th>
              <th className="text-left p-3 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Módulo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[
              ['Identificación y Fiscales', 'Nombre completo, RFC, Régimen Fiscal, CURP, Constancia de Situación Fiscal', 'Registro, Facturación, Nómina'],
              ['Contacto', 'Correo electrónico, número telefónico', 'Todos los módulos'],
              ['Patrimoniales y Financieros', 'Datos de pago de suscripción (procesados por Stripe), información contable y transaccional', 'Facturación, Tesorería, Contabilidad'],
              ['Laborales', 'CURP, NSS IMSS, salario, banco, CLABE, datos de asistencia', 'RRHH, Nómina, Reloj Checador'],
              ['Geolocalización', 'Coordenadas GPS (latitud/longitud) al momento de registrar asistencia', 'Reloj Checador'],
              ['Técnicos', 'Dirección IP, tipo de dispositivo, navegador, cookies de sesión', 'Todos los módulos'],
            ].map(([cat, datos, mod], i) => (
              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <td className="p-3 font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">{cat}</td>
                <td className="p-3 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{datos}</td>
                <td className="p-3 text-neutral-500 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-700">{mod}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-neutral-500 mt-3">
          <strong>Nota:</strong> CIFRA ERP no recaba datos personales catalogados como <em>sensibles</em> (biometría, estado de salud, origen racial, filiación religiosa o política, preferencias sexuales) en los términos del Artículo 3, fracción VI de la LFPDPPP.
        </p>
      </Section>

      <Section id="3" title="3. Finalidades del Tratamiento">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-2">A. Finalidades Primarias (necesarias para la prestación del servicio)</h3>
        <ul>
          <li>Creación, gestión y administración de la cuenta Tenant en la plataforma SaaS.</li>
          <li>Prestación de los servicios del ERP: facturación CFDI 4.0, contabilidad, POS, CRM, SCM, MRP, nómina, BI y portal del cliente.</li>
          <li>Procesamiento del cobro de la suscripción (vía Stripe).</li>
          <li>Timbrado y cancelación de CFDI ante el SAT a través del PAC autorizado (SW Sapien).</li>
          <li>Cálculo y generación de recibos de nómina con retenciones ISR/IMSS conforme a la legislación vigente.</li>
          <li>Validación de asistencia mediante geolocalización en el módulo Reloj Checador.</li>
          <li>Gestión de soporte técnico y mantenimiento de la plataforma.</li>
          <li>Cumplimiento de obligaciones contractuales, fiscales y laborales aplicables.</li>
          <li>Envío de correos transaccionales (confirmación de cuenta, facturas, alertas de seguridad) mediante Resend.</li>
        </ul>

        <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-2 mt-4">B. Finalidades Secundarias (no esenciales — puede oponerse)</h3>
        <ul>
          <li>Envío de boletines informativos, actualizaciones del sistema y novedades de CIFRA ERP.</li>
          <li>Análisis estadístico y métricas de uso <strong>anonimizadas</strong> para mejora de la plataforma.</li>
          <li>Investigación y desarrollo de nuevas funcionalidades basadas en patrones de uso agregados.</li>
        </ul>
        <p className="text-sm text-neutral-500 mt-2">
          Si no desea que sus datos sean tratados para las finalidades secundarias, puede enviar un correo a{' '}
          <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">angelortizsanchez0112@gmail.com</a>{' '}
          con el asunto &quot;Oposición Finalidades Secundarias&quot;.
        </p>
      </Section>

      <Section id="4" title="4. Transferencia de Datos Personales">
        <p>Para cumplir con las finalidades primarias, CIFRA ERP realiza transferencias a los siguientes terceros, para las cuales <strong>no se requiere su consentimiento expreso</strong> conforme al Artículo 37 de la LFPDPPP:</p>
        <div className="not-prose space-y-3 mt-4">
          {[
            {
              dest: 'SAT y PAC (SW Sapien)',
              purpose: 'Timbrado, validación y cancelación de CFDI conforme al Art. 29 CFF.',
              policy: 'https://www.swsapien.com/privacidad',
            },
            {
              dest: 'Stripe',
              purpose: 'Procesamiento seguro del cobro de suscripciones (PCI-DSS Level 1). CIFRA nunca almacena datos de tarjetas bancarias.',
              policy: 'https://stripe.com/es-mx/privacy',
            },
            {
              dest: 'Supabase',
              purpose: 'Infraestructura de base de datos PostgreSQL con aislamiento por Tenant y cifrado en reposo.',
              policy: 'https://supabase.com/privacy',
            },
            {
              dest: 'Vercel',
              purpose: 'Hospedaje de la aplicación y entrega de contenido (CDN). No procesa datos personales del usuario final.',
              policy: 'https://vercel.com/legal/privacy-policy',
            },
            {
              dest: 'Resend',
              purpose: 'Envío de correos transaccionales (confirmaciones, alertas). Solo recibe el correo de destino y el contenido del mensaje.',
              policy: 'https://resend.com/legal/privacy-policy',
            },
          ].map((t, i) => (
            <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{t.dest}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{t.purpose}</p>
              <a href={t.policy} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                Ver política de privacidad →
              </a>
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-500 mt-4">
          CIFRA ERP no realiza transferencias a autoridades financieras (CNBV, UIF) para prevención de lavado de dinero, dado que la plataforma opera exclusivamente como herramienta de gestión administrativa y no funge como entidad financiera regulada.
        </p>
      </Section>

      <Section id="5" title="5. Conservación y Período de Bloqueo">
        <p>
          En caso de terminación del servicio o cancelación de la suscripción:
        </p>
        <ul>
          <li>Los datos se conservarán en <strong>modo bloqueado</strong> por un período de <strong>5 (cinco) años</strong>, en cumplimiento al Artículo 30 del Código Fiscal de la Federación (CFF).</li>
          <li>Durante el bloqueo, los datos no estarán sujetos a tratamiento activo y solo podrán ser consultados ante requerimiento de autoridad fiscal, legal o administrativa competente.</li>
          <li>Transcurrido dicho plazo, se procederá a la <strong>eliminación y destrucción segura e irrecuperable</strong> de la información.</li>
        </ul>
        <p className="text-sm text-neutral-500 mt-2">
          <strong>Excepción:</strong> En caso de impago prolongado (más de 30 días) sin regularización, CIFRA podrá proceder a la eliminación anticipada conforme a los <Link href="/terminos#sec-10" className="text-blue-600 dark:text-blue-400 underline">Términos y Condiciones</Link>.
        </p>
      </Section>

      <Section id="6" title="6. Derechos ARCO">
        <p>
          Usted tiene derecho a <strong>Acceder</strong>, <strong>Rectificar</strong>, <strong>Cancelar</strong> y <strong>Oponerse</strong> (derechos ARCO) al tratamiento de sus datos personales. Para ejercerlos:
        </p>
        <div className="not-prose p-5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 mt-4">
          <p className="font-bold text-emerald-800 dark:text-emerald-200 mb-2">Procedimiento de solicitud ARCO</p>
          <ol className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1 list-decimal list-inside">
            <li>Envíe su solicitud a <a href="mailto:angelortizsanchez0112@gmail.com" className="underline">angelortizsanchez0112@gmail.com</a> con asunto &quot;Solicitud ARCO&quot;.</li>
            <li>Incluya: su nombre completo, correo registrado en CIFRA y copia de identificación oficial vigente.</li>
            <li>Describa de forma clara y precisa los datos respecto a los que desea ejercer su derecho.</li>
          </ol>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3">
            Recibirá respuesta en un plazo máximo de <strong>20 (veinte) días hábiles</strong>.
          </p>
        </div>
      </Section>

      <Section id="7" title="7. Uso de Cookies y Tecnologías de Rastreo">
        <p>
          CIFRA ERP utiliza cookies y tecnologías similares. Para información detallada, consulte nuestra{' '}
          <Link href="/cookies" className="text-blue-600 dark:text-blue-400 underline">Política de Cookies</Link>.
        </p>
        <p>
          En resumen, utilizamos:
        </p>
        <ul>
          <li><strong>Cookies esenciales:</strong> Para mantener su sesión activa en la plataforma (obligatorias — no pueden desactivarse).</li>
          <li><strong>Cookies de preferencias:</strong> Tema (claro/oscuro), idioma y configuración de interfaz.</li>
          <li><strong>Cookies analíticas:</strong> Métricas de uso anonimizadas para mejorar la plataforma.</li>
        </ul>
      </Section>

      <Section id="8" title="8. Medidas de Seguridad">
        <p>Para proteger sus datos personales, CIFRA ERP implementa:</p>
        <ul>
          <li><strong>Cifrado en tránsito:</strong> TLS 1.3 en todas las comunicaciones entre el navegador y los servidores.</li>
          <li><strong>Cifrado en reposo:</strong> Base de datos PostgreSQL cifrada gestionada por Supabase.</li>
          <li><strong>Aislamiento multi-tenant:</strong> Cada empresa tiene su propia instancia lógica de datos; ningún Tenant puede acceder a datos de otro.</li>
          <li><strong>Autenticación de dos factores (2FA):</strong> TOTP compatible con Google Authenticator, disponible para todos los usuarios.</li>
          <li><strong>Control de acceso por roles (RBAC):</strong> Permisos granulares por usuario (ADMIN, MANAGER, OPERATIVE).</li>
          <li><strong>Auditoría de acciones:</strong> Registro inmutable de todas las operaciones críticas (AuditLog).</li>
          <li><strong>API Keys con hash SHA-256:</strong> Las claves de API nunca se almacenan en texto plano.</li>
          <li><strong>Rate limiting:</strong> Limitación de solicitudes por IP para prevenir ataques de fuerza bruta.</li>
        </ul>
      </Section>

      <Section id="9" title="9. Autoridad Competente">
        <p>
          Si considera que su derecho a la protección de datos personales ha sido lesionado, puede presentar queja o denuncia ante la{' '}
          <strong>Secretaría Anticorrupción y Buen Gobierno</strong> (o la autoridad que asuma sus funciones conforme a la legislación vigente), sin perjuicio de los recursos legales ante los tribunales competentes.
        </p>
      </Section>

      <Section id="10" title="10. Modificaciones al Aviso de Privacidad">
        <p>
          El presente Aviso puede modificarse por requerimientos legales, cambios en el servicio o evolución de nuestras prácticas de privacidad. Cualquier modificación se notificará mediante:
        </p>
        <ul>
          <li>Banner destacado en el dashboard principal de CIFRA ERP, y/o</li>
          <li>Correo electrónico al dirección registrada en la cuenta.</li>
        </ul>
      </Section>

      <div className="not-prose mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="font-black text-neutral-900 dark:text-white mb-2">Contacto para Privacidad</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Correo:{' '}
          <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">
            angelortizsanchez0112@gmail.com
          </a>
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          También puede encontrarnos en:{' '}
          <Link href="/terminos" className="text-blue-600 dark:text-blue-400 underline">Términos y Condiciones</Link>{' · '}
          <Link href="/cookies" className="text-blue-600 dark:text-blue-400 underline">Política de Cookies</Link>
        </p>
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
