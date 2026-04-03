import Link from 'next/link'
import { ShieldAlert, BookOpen, UserCheck, Mail, MapPin, Clock } from 'lucide-react'

export const metadata = {
  title: 'Aviso de Privacidad — CIFRA ERP',
  description: 'Aviso de privacidad integral para el cumplimiento de la LFPDPPP.',
}

export default function PrivacyPage() {
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
              <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Aviso de Privacidad Integral</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Fecha de última actualización: 2 de abril de 2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-justify">
          
          <p className="leading-relaxed">
            En cumplimiento a lo establecido por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y demás normatividad aplicable, se emite el presente Aviso de Privacidad para informar sobre el tratamiento de los datos personales.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-zinc-400" />
              1. Identidad y Domicilio del Responsable
            </h2>
            <p className="leading-relaxed">
              El responsable del tratamiento de sus datos personales es <strong>Ángel Alberto Ortiz Sánchez</strong> (en adelante, "CIFRA ERP" o "El Responsable"), con domicilio legal para oír y recibir notificaciones en: Calle 33 53, Col. Estado de México, C.P. 57210, Nezahualcóyotl, Estado de México.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">2. Datos Personales Recabados</h2>
            <p className="mb-6 leading-relaxed">Para llevar a cabo las finalidades descritas en el presente aviso, CIFRA ERP recabará las siguientes categorías de datos personales:</p>
            
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold mb-2">Datos de Identificación y Fiscales</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Nombre completo, Registro Federal de Contribuyentes (RFC), Régimen Fiscal, Clave Única de Registro de Población (CURP), y Constancia de Situación Fiscal.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold mb-2">Datos de Contacto</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Correo electrónico y número telefónico.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold mb-2">Datos Patrimoniales y Financieros</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Datos de tarjetas bancarias para el pago de la suscripción al software e información transaccional necesaria para la generación de la contabilidad y facturación.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-blue-700 dark:text-blue-300">Datos de Geolocalización</h3>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  Coordenadas geográficas (latitud y longitud) recabadas exclusivamente al momento de utilizar el módulo de "Reloj Checador", con el fin de validar la ubicación del registro de asistencia.
                </p>
              </div>
            </div>
            <p className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-sm italic">
              <strong>Nota:</strong> CIFRA ERP no recaba datos personales catalogados como sensibles (como biometría, origen racial, estado de salud, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Finalidades del Tratamiento</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-blue-600 dark:text-blue-400">A. Finalidades Primarias (Necesarias para el servicio):</h3>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300 text-sm">
                  <li>Creación, gestión y administración de la cuenta de usuario (Tenant) dentro de la plataforma SaaS.</li>
                  <li>Prestación de los servicios del ERP, incluyendo módulos de facturación, contabilidad, punto de venta y control de asistencia (reloj checador).</li>
                  <li>Procesamiento del cobro de la suscripción de los servicios.</li>
                  <li>Gestión de soporte técnico y mantenimiento de la plataforma.</li>
                  <li>Cumplimiento de las obligaciones contractuales y fiscales vigentes aplicables a la relación comercial.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3 text-zinc-500">B. Finalidades Secundarias (No esenciales):</h3>
                <ul className="list-disc pl-6 space-y-2 text-zinc-500 dark:text-zinc-400 text-sm">
                  <li>Envío de boletines informativos, actualizaciones del sistema y publicidad relacionada con CIFRA ERP.</li>
                  <li>Análisis estadístico y métricas de uso (de forma anonimizada) para la mejora de la plataforma.</li>
                </ul>
                <p className="mt-4 text-xs">Si no desea que sus datos sean tratados para las finalidades secundarias, puede enviar un correo a la dirección de contacto indicada en el numeral 6.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Transferencia de Datos Personales</h2>
            <p className="leading-relaxed mb-4">Para cumplir con las finalidades primarias, CIFRA ERP realiza transferencias de datos a los siguientes terceros necesarios, para lo cual no se requiere su consentimiento expreso conforme al Artículo 37 de la LFPDPPP:</p>
            <ul className="list-disc pl-6 space-y-3 text-zinc-700 dark:text-zinc-300 text-sm">
              <li><strong>Servicio de Administración Tributaria (SAT) y Proveedores Autorizados de Certificación (PAC):</strong> Para el timbrado, validación y cancelación de Comprobantes Fiscales Digitales por Internet (CFDI).</li>
              <li><strong>Stripe:</strong> Pasarela de pagos para procesar el cobro seguro de las suscripciones. Sus datos financieros son procesados directamente por esta entidad bajo estrictos estándares de seguridad (PCI-DSS).</li>
            </ul>
            <p className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 text-sm italic">
              CIFRA ERP no realiza transferencias a autoridades financieras para prevención de lavado de dinero (como CNBV o UIF), dado que la plataforma opera exclusivamente como una herramienta de gestión administrativa y no funge como entidad financiera regulada ni realiza actividades vulnerables bajo este modelo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-zinc-400" />
              5. Conservación y Periodo de Bloqueo
            </h2>
            <p className="leading-relaxed mb-4">
              En caso de terminación del servicio o cancelación de su suscripción, sus datos no serán eliminados de manera inmediata. CIFRA ERP procederá al <strong>Bloqueo de sus datos personales</strong> y transaccionales (incluyendo registros contables y XMLs) por un periodo de <strong>5 (cinco) años</strong>, en estricto cumplimiento al Artículo 30 del Código Fiscal de la Federación (CFF).
            </p>
            <p className="leading-relaxed text-sm text-zinc-500">
              Durante este periodo de bloqueo, sus datos serán resguardados bajo altas medidas de seguridad, no estarán sujetos a tratamiento activo, y solo podrán ser extraídos o consultados ante el requerimiento de una autoridad fiscal, legal o administrativa competente. Transcurrido dicho plazo, se procederá a la eliminación y destrucción segura e irrecuperable de la información.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-zinc-400" />
              6. Medios para Ejercer los Derechos ARCO
            </h2>
            <p className="leading-relaxed mb-6">
              Usted tiene derecho a conocer qué datos personales tenemos, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación); que la eliminemos de nuestros registros cuando considere que no se requiere para los fines señalados (Cancelación); así como oponerse al uso de sus datos para fines específicos (Oposición).
            </p>
            <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-bold mb-4">Para el ejercicio de cualquiera de los derechos ARCO, envíe un correo a:</p>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-lg">
                <Mail className="w-5 h-5" />
                angelortizsanchez0112@gmail.com
              </div>
              <div className="mt-6 space-y-2 text-xs text-zinc-500">
                <p>La solicitud deberá contener:</p>
                <p>(I) Su nombre y correo electrónico para comunicarle la respuesta;</p>
                <p>(II) Copia de su identificación oficial vigente;</p>
                <p>(III) La descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO.</p>
                <p className="mt-4 font-bold text-zinc-700 dark:text-zinc-300">CIFRA ERP le comunicará la determinación adoptada en un plazo máximo de 20 (veinte) días hábiles.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Uso de Tecnologías de Rastreo (Cookies)</h2>
            <p className="leading-relaxed lg:text-base text-sm">
              Le informamos que en la plataforma web de CIFRA ERP utilizamos cookies y tecnologías similares para mantener la sesión activa, recordar sus preferencias de usuario y medir el rendimiento del sistema. Estas cookies son esenciales para el funcionamiento del SaaS. Usted puede deshabilitar el uso de cookies desde la configuración de su navegador de internet, en el entendido de que esto podría afectar significativamente el funcionamiento del ERP.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Medidas de Seguridad</h2>
            <p className="leading-relaxed mb-4">
              Para garantizar la protección de sus datos y evitar su alteración, pérdida, acceso o tratamiento no autorizado, CIFRA ERP implementa medidas de seguridad administrativas, técnicas y físicas, incluyendo:
            </p>
            <ul className="grid md:grid-cols-3 gap-4 text-xs font-bold">
              <li className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">Cifrado SSL/TLS de datos en tránsito y en reposo.</li>
              <li className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">Aislamiento de bases de datos por cada Tenant.</li>
              <li className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">Controles de acceso mediante roles (RBAC).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Autoridad Competente</h2>
            <p className="leading-relaxed">
              Si usted considera que su derecho a la protección de datos personales ha sido lesionado o presume alguna violación a las disposiciones previstas en la LFPDPPP, podrá interponer su queja o denuncia ante la <strong>Secretaría Anticorrupción y Buen Gobierno</strong> (o la autoridad competente que asuma sus funciones).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Modificaciones al Aviso de Privacidad</h2>
            <p className="leading-relaxed">
              El presente aviso de privacidad puede sufrir modificaciones derivadas de nuevos requerimientos legales o de nuestras propias necesidades. Cualquier modificación será notificada oportunamente mediante un aviso destacado en el dashboard o por correo electrónico.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
