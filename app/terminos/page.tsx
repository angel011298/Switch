import Link from 'next/link'
import { FileText, CreditCard, Lock, Scale, AlertTriangle, ShieldCheck, Database, Zap } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones — CIFRA ERP',
  description: 'Contrato de servicios para el uso de la plataforma CIFRA ERP.',
}

export default function TermsPage() {
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
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Términos y Condiciones de Uso</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Fecha de última actualización: 2 de abril de 2026
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-justify">
          
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Scale className="w-6 h-6 text-zinc-400" />
              1. Aceptación, Naturaleza del Servicio y Relación Comercial
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                <strong>1.1. Aceptación Expresa:</strong> Al registrarse, crear una cuenta y/o hacer clic en "Acepto", el usuario (en adelante "El Cliente") consiente y acepta expresamente estos Términos y Condiciones (TyC), constituyendo un acuerdo legalmente vinculante.
              </p>
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm">
                <h3 className="font-bold mb-3">1.2. Definiciones Clave:</h3>
                <ul className="space-y-2">
                  <li><strong>SaaS:</strong> Software as a Service. Modalidad donde CIFRA aloja el sistema en la nube y El Cliente accede vía internet.</li>
                  <li><strong>Tenant:</strong> Instancia lógica, privada y aislada de bases de datos asignada exclusivamente a El Cliente.</li>
                  <li><strong>Usuario Final:</strong> Cualquier empleado, colaborador o tercero a quien El Cliente otorgue credenciales.</li>
                  <li><strong>Datos del Cliente:</strong> Toda información, XMLs, registros y datos personales ingresados por El Cliente.</li>
                </ul>
              </div>
              <p className="leading-relaxed">
                <strong>1.3. Naturaleza Tecnológica B2B:</strong> CIFRA ERP es una plataforma SaaS diseñada para la gestión administrativa, facturación (CFDI), control de asistencia (Reloj Checador), punto de venta (POS) y conciliación. No somos un despacho contable, fiscal, legal, ni asesor financiero.
              </p>
              <p className="leading-relaxed">
                <strong>1.4. Licencia de Uso:</strong> CIFRA otorga a El Cliente una licencia de uso limitada, no exclusiva, intransferible, revocable y temporal, sujeta al pago de la suscripción. Esto no constituye una venta del software ni del código fuente.
              </p>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-2xl flex gap-3 text-sm font-medium text-rose-800 dark:text-rose-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p><strong>1.5. Cláusula de No Asesoría:</strong> Las automatizaciones del sistema son sugerencias algorítmicas. Ningún reporte o cálculo generado constituye asesoría legal o fiscal. La validación final ante autoridades recae exclusiva y totalmente en El Cliente.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-zinc-400" />
              2. Credenciales Fiscales y Cumplimiento Tributario (CFF)
            </h2>
            <p className="leading-relaxed mb-4">
              <strong>2.1. Uso de CSD y e.firma:</strong> Para los módulos de facturación y "Mis CFDI", El Cliente autoriza el uso de sus Certificados de Sello Digital (CSD) y/o e.firma, otorgando a CIFRA un mandato estrictamente tecnológico y automatizado para la descarga, validación y emisión de comprobantes ante el Servicio de Administración Tributaria (SAT).
            </p>
            <p className="leading-relaxed text-sm text-zinc-500">
              <strong>2.2. Exención por Operaciones Simuladas (Art. 69-B CFF):</strong> El Cliente se obliga a no utilizar CIFRA ERP para simular operaciones o evadir impuestos. CIFRA no será responsable si El Cliente emite o recibe facturas de Empresas Facturadoras de Operaciones Simuladas (EFOS) o si sus CSD son restringidos (Art. 17-H Bis CFF).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">3. Privacidad y Protección de Datos Personales (LFPDPPP)</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold mb-2">3.1. Roles Legales:</h3>
                <ul className="text-sm space-y-2">
                  <li><strong>Responsable:</strong> CIFRA respecto a datos de registro y pagos.</li>
                  <li><strong>Encargado:</strong> CIFRA respecto a info de terceros del Cliente.</li>
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold mb-2">3.2. Vulneraciones:</h3>
                <p className="text-xs text-zinc-500">Notificaremos a El Cliente para que cumpla con su rol de Responsable ante los titulares y la autoridad.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-zinc-400" />
              4. Obligaciones Laborales y Geolocalización (LFT)
            </h2>
            <p className="leading-relaxed mb-4">
              <strong>4.1. Módulo de Reloj Checador:</strong> CIFRA proporciona herramientas de control de asistencia mediante captura de ubicación geográfica.
            </p>
            <p className="leading-relaxed font-bold text-sm">
              4.2. Indemnidad Laboral: Conforme a la Ley Federal del Trabajo, el patrón es El Cliente. El Cliente libera a CIFRA de cualquier contingencia ante la STPS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Conservación de Mensajes de Datos y Seguridad (NOM-151-SCFI-2016)</h2>
            <div className="space-y-4 text-sm">
              <p><strong>5.1. Limitación de Certificación:</strong> CIFRA no actúa como Prestador de Servicios de Certificación (PSC). La conservación normativa es responsabilidad de El Cliente.</p>
              <p><strong>5.2. Firma Electrónica Simple:</strong> El uso de credenciales constituye una Firma Electrónica Simple (Art. 89 C.Comercio).</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Propiedad Intelectual y de los Datos</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl"><strong>6.1. Software:</strong> Propiedad exclusiva de CIFRA.</div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl"><strong>6.2. Datos:</strong> El Cliente conserva la titularidad; CIFRA es depositario.</div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Niveles de Servicio (SLA) y Mantenimiento</h2>
            <p className="leading-relaxed text-sm">7.1. SLA operativo del 99.0% mensual. El servicio se presta "as is".</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Derechos del Consumidor (LFPC)</h2>
            <p className="leading-relaxed text-sm">8.2. Derecho de Cancelación: En cualquier momento sin reembolsos proporcionales.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Limitación de Responsabilidad</h2>
            <div className="p-6 rounded-3xl bg-zinc-900 text-white dark:bg-blue-900/20 border dark:border-blue-800">
              <h3 className="font-black text-xl mb-4">9.3. Tope Legal</h3>
              <p className="text-sm leading-relaxed">
                La responsabilidad total de CIFRA está limitada al monto pagado por El Cliente durante los últimos <strong>tres (3) meses</strong>. No se responderá por lucro cesante ni multas.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <Database className="w-6 h-6" />
              10. Falta de Pago y Purga de Datos
            </h2>
            <div className="space-y-4">
              <p className="font-bold underline text-sm">10.3. Purga Definitiva (30 días de impago):</p>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-200">
                CIFRA procederá a la eliminación irrecuperable de toda la información y Tenant de El Cliente tras 30 días de impago. CIFRA no será responsable por pérdida de información tras la purga.
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Jurisdicción y Ley Aplicable</h2>
            <p className="leading-relaxed text-sm">
              Sujeto a Tribunales competentes en la <strong>Ciudad de México</strong>, renunciando a cualquier otro fuero.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
