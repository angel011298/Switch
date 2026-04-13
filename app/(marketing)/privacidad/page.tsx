import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, Section } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad · CIFRA ERP',
  description: 'Aviso de Privacidad Integral de CIFRA ERP conforme a la LFPDPPP.',
}

export default function PrivacidadPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            LFPDPPP
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
            Aviso de Privacidad Integral
          </h1>
          <p className="text-neutral-500 text-sm">
            Última actualización: <strong>{lastUpdated}</strong>
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares (LFPDPPP) y su Reglamento.
          </p>
        </div>

        <Section id="1" title="1. Identidad y Domicilio del Responsable">
          <p>
            El responsable del tratamiento de sus datos personales es{' '}
            <strong>Ángel Alberto Ortiz Sánchez</strong> (en adelante{' '}
            <strong>&quot;CIFRA ERP&quot;</strong>):
          </p>
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 not-prose space-y-0.5">
            <p><strong>Ángel Alberto Ortiz Sánchez</strong></p>
            <p><strong>RFC:</strong> OISA981201PTA</p>
            <p>Calle 33 No. 53, Col. Estado de México, C.P. 57210</p>
            <p>Nezahualcóyotl, Estado de México, México</p>
            <p>
              Correo:{' '}
              <a
                href="mailto:angelortizsanchez0112@gmail.com"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                angelortizsanchez0112@gmail.com
              </a>
            </p>
          </div>
        </Section>

        <Section id="2" title="2. Datos Personales Recabados">
          <p>CIFRA ERP recabará las siguientes categorías según el módulo utilizado:</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Categoría</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Datos</th>
                  <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Módulo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Identificación y Fiscales', 'Nombre completo, RFC, Régimen Fiscal, CURP, Constancia de Situación Fiscal', 'Registro, Facturación, Nómina'],
                  ['Contacto', 'Correo electrónico, número telefónico', 'Todos los módulos'],
                  ['Patrimoniales y Financieros', 'Datos de pago de suscripción (procesados por Stripe), información contable y transaccional', 'Facturación, Tesorería, Contabilidad'],
                  ['Laborales', 'CURP, NSS IMSS, salario, banco, CLABE, datos de asistencia', 'RRHH, Nómina, Reloj Checador'],
                  ['Geolocalización', 'Coordenadas GPS (latitud/longitud) al registrar asistencia', 'Reloj Checador'],
                  ['Logs de Uso', 'Dirección IP, tipo de dispositivo, navegador, registro de acciones en AuditLog', 'Todos los módulos'],
                ].map(([cat, datos, mod], i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-2 font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">{cat}</td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">{datos}</td>
                    <td className="p-2 text-neutral-500 border border-neutral-200 dark:border-neutral-700">{mod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            CIFRA ERP <strong>no recaba datos sensibles</strong> (biometría, estado de salud,
            origen racial, filiación política o religiosa) en los términos del Art. 3, fracción VI
            de la LFPDPPP.
          </p>
        </Section>

        <Section id="3" title="3. Finalidades del Tratamiento">
          <p><strong>A. Finalidades Primarias (necesarias para la prestación del servicio):</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Creación y gestión de la cuenta Tenant en la plataforma SaaS.</li>
            <li>Prestación de todos los módulos del ERP: facturación CFDI 4.0, contabilidad, POS, CRM, SCM, MRP, nómina, BI y portal del cliente.</li>
            <li>Procesamiento del cobro de la suscripción vía Stripe.</li>
            <li>Timbrado y cancelación de CFDI ante el SAT a través del PAC autorizado (SW Sapien).</li>
            <li>Cálculo y generación de recibos de nómina con retenciones ISR/IMSS.</li>
            <li>Validación de asistencia mediante geolocalización en el Reloj Checador.</li>
            <li>Envío de correos transaccionales mediante Resend (confirmación, alertas, facturas).</li>
            <li>Cumplimiento de obligaciones contractuales, fiscales y laborales.</li>
          </ul>
          <p className="mt-3"><strong>B. Finalidades Secundarias (puede oponerse):</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Envío de boletines informativos y novedades de CIFRA ERP.</li>
            <li>Análisis estadístico <strong>anonimizado</strong> para mejora de la plataforma.</li>
          </ul>
          <p className="text-xs text-neutral-500 mt-2">
            Para oponerse a finalidades secundarias, envíe correo a{' '}
            <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">
              angelortizsanchez0112@gmail.com
            </a>{' '}
            con asunto &quot;Oposición Finalidades Secundarias&quot;.
          </p>
        </Section>

        <Section id="4" title="4. Transferencia de Datos Personales">
          <p>
            Transferencias necesarias para la prestación del servicio (no requieren consentimiento
            conforme al Art. 37 LFPDPPP):
          </p>
          <div className="space-y-2 mt-3">
            {[
              {
                dest: 'SAT y PAC (SW Sapien)',
                purpose: 'Timbrado, validación y cancelación de CFDI conforme al Art. 29 CFF. Datos transferidos: RFC emisor, RFC receptor, monto, XML del comprobante.',
              },
              {
                dest: 'Stripe',
                purpose: 'Procesamiento seguro del cobro de suscripciones (PCI-DSS Level 1). CIFRA nunca almacena datos de tarjetas. Datos transferidos: correo de facturación, nombre del titular.',
              },
              {
                dest: 'Supabase (Sentry, Inc.)',
                purpose: 'Infraestructura de base de datos PostgreSQL con aislamiento por Tenant, cifrado en reposo AES-256 y TLS 1.3 en tránsito. Hosting: AWS us-east-1.',
              },
              {
                dest: 'Vercel, Inc.',
                purpose: 'Hospedaje de la aplicación web y CDN global. Procesa exclusivamente metadatos de tráfico HTTP; no accede a contenido de datos personales del usuario final.',
              },
              {
                dest: 'Resend',
                purpose: 'Envío de correos transaccionales (confirmaciones, alertas, reportes). Solo recibe la dirección de correo de destino y el contenido del mensaje generado por el sistema.',
              },
            ].map((t, i) => (
              <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">{t.dest}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{t.purpose}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="5" title="5. Conservación y Período de Bloqueo">
          <ul className="list-disc list-inside space-y-1">
            <li>Al cancelar el servicio, los datos se conservan en <strong>modo bloqueado por 5 años</strong> conforme al Art. 30 del CFF.</li>
            <li>Durante el bloqueo, los datos no están sujetos a tratamiento activo y solo se accede ante requerimiento de autoridad competente.</li>
            <li>Transcurrido el plazo, se procede a la <strong>eliminación y destrucción segura e irrecuperable</strong> de la información.</li>
          </ul>
        </Section>

        <Section id="6" title="6. Derechos ARCO">
          <p>
            Usted tiene derecho a <strong>A</strong>cceder, <strong>R</strong>ectificar,{' '}
            <strong>C</strong>ancelar y <strong>O</strong>ponerse al tratamiento de sus datos
            personales, conforme a los Arts. 28–37 de la LFPDPPP.
          </p>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 mt-3">
            <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm mb-2">
              Mecanismo para ejercer derechos ARCO
            </p>
            <ol className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1 list-decimal list-inside">
              <li>
                Envíe su solicitud a{' '}
                <a href="mailto:angelortizsanchez0112@gmail.com" className="underline">
                  angelortizsanchez0112@gmail.com
                </a>{' '}
                con asunto <strong>&quot;Solicitud ARCO&quot;</strong>.
              </li>
              <li>Incluya: nombre completo, correo registrado en CIFRA y copia de identificación oficial vigente.</li>
              <li>Describa claramente los datos sobre los que desea ejercer su derecho y el tipo de acción (Acceso, Rectificación, Cancelación u Oposición).</li>
            </ol>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              Recibirá respuesta en máximo <strong>20 días hábiles</strong> a partir de la recepción
              de su solicitud completa.
            </p>
          </div>
        </Section>

        <Section id="7" title="7. Uso de Cookies y Tecnologías de Rastreo">
          <p>
            CIFRA ERP utiliza cookies esenciales para mantener su sesión activa, y cookies
            opcionales de preferencias y analíticas. Para información detallada, consulte nuestra{' '}
            <Link href="/cookies" className="text-blue-600 dark:text-blue-400 underline">
              Política de Cookies
            </Link>.
          </p>
        </Section>

        <Section id="8" title="8. Medidas de Seguridad">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Cifrado en tránsito:</strong> TLS 1.3 en todas las comunicaciones.</li>
            <li><strong>Cifrado en reposo:</strong> Base de datos PostgreSQL cifrada (Supabase AES-256).</li>
            <li><strong>Aislamiento multi-tenant:</strong> Cada empresa tiene su propia instancia lógica de datos con filtros obligatorios por <code>tenantId</code>.</li>
            <li><strong>Autenticación de dos factores (2FA):</strong> TOTP compatible con Google Authenticator.</li>
            <li><strong>Control de acceso por roles (RBAC):</strong> Permisos granulares por usuario (ADMIN, MANAGER, OPERATIVE).</li>
            <li><strong>AuditLog inmutable:</strong> Registro de todas las operaciones críticas con IP, agente y marca de tiempo.</li>
            <li><strong>API Keys con hash SHA-256:</strong> Las claves de API nunca se almacenan en texto plano.</li>
          </ul>
        </Section>

        <Section id="9" title="9. Autoridad Competente">
          <p>
            Si considera que su derecho a la protección de datos ha sido lesionado, puede presentar
            queja ante la <strong>Secretaría Anticorrupción y Buen Gobierno</strong> (o la
            autoridad que asuma sus funciones), conforme al Art. 94 de la LFPDPPP.
          </p>
        </Section>

        <Section id="10" title="10. Modificaciones al Aviso">
          <p>
            Cualquier modificación material se notificará mediante banner destacado en el dashboard
            y/o correo electrónico al correo registrado, con al menos <strong>15 días naturales
            de anticipación</strong>. La fecha de &quot;Última actualización&quot; reflejará la
            versión vigente.
          </p>
        </Section>

        <div className="mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="font-black text-neutral-900 dark:text-white mb-2">Contacto para Privacidad</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong>Ángel Alberto Ortiz Sánchez · RFC: OISA981201PTA</strong>
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            <a
              href="mailto:angelortizsanchez0112@gmail.com"
              className="text-blue-600 dark:text-blue-400 underline"
            >
              angelortizsanchez0112@gmail.com
            </a>
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <Link href="/terminos" className="text-blue-600 dark:text-blue-400 underline">Términos y Condiciones</Link>
            <Link href="/cookies" className="text-blue-600 dark:text-blue-400 underline">Política de Cookies</Link>
          </div>
        </div>
      </article>
    </LegalLayout>
  )
}
