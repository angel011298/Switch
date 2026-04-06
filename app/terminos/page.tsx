import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, Section, Sub } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · CIFRA ERP',
  description: 'Términos y Condiciones de Uso del Software ERP CIFRA para empresas mexicanas.',
}

const LAST_UPDATED = '2 de abril de 2026'

export default function TerminosPage() {
  return (
    <LegalLayout>
      <article>
        <div className="mb-10 pb-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            Documento Legal
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-neutral-500 text-sm">Última actualización: <strong>{LAST_UPDATED}</strong></p>
          <p className="text-sm text-neutral-400 mt-2">
            Aplica a todos los usuarios de <strong>CIFRA ERP</strong> (cifra-mx.vercel.app) operado por Angel Alberto Ortiz Sánchez.
          </p>
        </div>

        <Section id="1" title="1. Aceptación, Naturaleza del Servicio y Relación Comercial">
          <Sub title="1.1 Aceptación Expresa">
            Al registrarse, crear una cuenta y/o hacer clic en &quot;Acepto&quot;, el usuario (en adelante <strong>&quot;El Cliente&quot;</strong>) consiente y acepta expresamente estos Términos y Condiciones (TyC), constituyendo un acuerdo legalmente vinculante conforme al Artículo 89 del Código de Comercio.
          </Sub>
          <Sub title="1.2 Definiciones Clave">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>SaaS:</strong> Software como Servicio. CIFRA aloja el sistema en la nube y El Cliente accede vía internet.</li>
              <li><strong>Tenant:</strong> Instancia lógica, privada y aislada de base de datos asignada exclusivamente a El Cliente.</li>
              <li><strong>Usuario Final:</strong> Cualquier empleado, colaborador o tercero a quien El Cliente otorgue credenciales.</li>
              <li><strong>Datos del Cliente:</strong> Toda información, XMLs, registros contables y datos personales ingresados por El Cliente.</li>
              <li><strong>CFDI:</strong> Comprobante Fiscal Digital por Internet conforme al Artículo 29 del CFF.</li>
              <li><strong>CSD:</strong> Certificado de Sello Digital emitido por el SAT.</li>
            </ul>
          </Sub>
          <Sub title="1.3 Naturaleza Tecnológica B2B">
            CIFRA ERP es una plataforma SaaS diseñada para la gestión administrativa integral de empresas mexicanas: facturación electrónica (CFDI 4.0), contabilidad de partida doble, punto de venta (POS), control de asistencia con geolocalización, nómina ISR/IMSS, CRM, SCM, MRP y Business Intelligence. <strong>No somos un despacho contable, fiscal, legal ni asesor financiero.</strong>
          </Sub>
          <Sub title="1.4 Licencia de Uso">
            CIFRA otorga a El Cliente una licencia de uso <strong>limitada, no exclusiva, intransferible, revocable y temporal</strong>, sujeta al pago de la suscripción activa. No constituye venta del software ni del código fuente.
          </Sub>
          <Sub title="1.5 Cláusula de No Asesoría">
            Las automatizaciones del sistema son <strong>sugerencias algorítmicas</strong>. Ningún reporte o cálculo generado constituye asesoría legal o fiscal. La validación final ante el SAT, IMSS o cualquier autoridad recae exclusivamente en El Cliente.
          </Sub>
        </Section>

        <Section id="2" title="2. Credenciales Fiscales y Cumplimiento Tributario (CFF)">
          <Sub title="2.1 Uso de CSD y e.firma">
            Para los módulos de Facturación (CFDI) y timbrado vía PAC (SW Sapien), El Cliente autoriza el uso de sus CSD y/o e.firma, otorgando a CIFRA un <strong>mandato estrictamente tecnológico y automatizado</strong> para la descarga, validación y emisión de comprobantes ante el SAT.
          </Sub>
          <Sub title="2.2 Confidencialidad de Credenciales">
            Las credenciales del CSD se almacenan cifradas con aislamiento por Tenant. El Cliente asume la responsabilidad de no compartirlas con terceros ajenos a CIFRA.
          </Sub>
          <Sub title="2.3 Exención por Operaciones Simuladas (Art. 69-B CFF)">
            El Cliente se obliga a no utilizar CIFRA para simular operaciones o evadir impuestos. CIFRA no será responsable si El Cliente emite o recibe facturas de EFOS o si sus CSD son restringidos conforme al Art. 17-H Bis del CFF.
          </Sub>
          <Sub title="2.4 Cancelación de CFDI">
            Las cancelaciones se realizan conforme a la regla 2.7.1.3 de la RMF vigente. CIFRA facilita el proceso técnico; la responsabilidad fiscal recae en El Cliente.
          </Sub>
        </Section>

        <Section id="3" title="3. Privacidad y Protección de Datos Personales (LFPDPPP)">
          <Sub title="3.1 Roles Legales">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong>Como Responsable:</strong> CIFRA es responsable exclusivo de los datos de registro y facturación de la suscripción.</li>
              <li><strong>Como Encargado:</strong> Respecto a información de terceros que El Cliente suba, CIFRA actúa únicamente como Encargado.</li>
            </ul>
          </Sub>
          <Sub title="3.2 Aviso de Privacidad">
            El tratamiento completo se detalla en nuestro{' '}
            <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 underline">Aviso de Privacidad Integral</Link>.
          </Sub>
        </Section>

        <Section id="4" title="4. Módulo de Reloj Checador y Geolocalización (LFT)">
          <Sub title="4.1 Funcionalidad">
            El módulo captura la ubicación geográfica únicamente al momento de registrar asistencia para validar la presencia en el lugar de trabajo designado.
          </Sub>
          <Sub title="4.2 Indemnidad Laboral">
            El patrón es El Cliente. Es su obligación recabar el consentimiento informado de sus trabajadores antes de activar este módulo, liberando a CIFRA de cualquier contingencia ante la STPS.
          </Sub>
        </Section>

        <Section id="5" title="5. Conservación de Datos y Firma Electrónica">
          <Sub title="5.1 Limitación de Certificación">
            CIFRA facilita el almacenamiento de XMLs y PDFs pero no actúa como PSC autorizado. La conservación normativa (Art. 30 CFF — 5 años) es responsabilidad de El Cliente.
          </Sub>
          <Sub title="5.2 Firma Electrónica Simple">
            Conforme al Art. 89 del Código de Comercio, el uso de credenciales de acceso (correo/contraseña, 2FA TOTP) constituye una <strong>Firma Electrónica Simple</strong>. Toda acción bajo una sesión iniciada será legalmente vinculante.
          </Sub>
          <Sub title="5.3 Registro de Auditoría">
            CIFRA mantiene un AuditLog inmutable de todas las acciones críticas, accesible desde el panel de Auditoría del dashboard.
          </Sub>
        </Section>

        <Section id="6" title="6. Propiedad Intelectual y de los Datos">
          <Sub title="6.1 Propiedad del Software">
            El código fuente, algoritmos, interfaces (UI/UX), marca CIFRA y logotipos son propiedad exclusiva de Angel Alberto Ortiz Sánchez. El Cliente no tiene derecho a realizar ingeniería inversa, copiar, sublicenciar ni distribuir el software.
          </Sub>
          <Sub title="6.2 Propiedad de los Datos">
            El Cliente conserva la titularidad sobre sus datos. CIFRA es depositario tecnológico y no reclamará propiedad. Al término del servicio, El Cliente podrá exportar en los formatos disponibles.
          </Sub>
        </Section>

        <Section id="7" title="7. Niveles de Servicio (SLA) y Mantenimiento">
          <Sub title="7.1 Disponibilidad">
            CIFRA procurará un SLA del <strong>99.0% mensual</strong>, excluyendo mantenimientos programados. No se otorgan garantías absolutas por depender de infraestructura de terceros (Vercel, Supabase, SW Sapien).
          </Sub>
          <Sub title="7.2 Intermitencias de Terceros">
            CIFRA no asume responsabilidad por caídas de los Webservices del SAT, fallas en la nube ni interrupciones del PAC.
          </Sub>
        </Section>

        <Section id="8" title="8. Planes, Precios y Cancelación (LFPC)">
          <Sub title="8.1 Precios">
            Los planes se exhiben con todos los impuestos aplicables. El precio final es el mostrado al momento de la contratación.
          </Sub>
          <Sub title="8.2 Derecho de Cancelación">
            El Cliente puede cancelar en cualquier momento. La cancelación evita cargos futuros, pero <strong>no genera reembolsos proporcionales</strong> por el período en curso.
          </Sub>
        </Section>

        <Section id="9" title="9. Limitación de Responsabilidad">
          <Sub title="9.1 Errores de Usuario (GIGO)">
            CIFRA no es responsable por cálculos erróneos, recargos o multas derivados de datos mal ingresados o configuraciones incorrectas.
          </Sub>
          <Sub title="9.2 Tope de Responsabilidad">
            La responsabilidad total de CIFRA se limita al <strong>monto pagado durante los últimos 3 meses</strong>. No se responde por lucro cesante, daño moral ni multas administrativas.
          </Sub>
        </Section>

        <Section id="10" title="10. Suspensión y Retención de Datos">
          <Sub title="10.1 Período de Gracia">
            Si el cobro falla: <strong>5 días naturales</strong> de operación normal.
          </Sub>
          <Sub title="10.2 Solo Lectura">
            Días 6–30 de impago: acceso de solo lectura para exportar datos.
          </Sub>
          <Sub title="10.3 Purga Definitiva">
            A los 30 días de impago: <strong>eliminación definitiva e irrecuperable</strong> de toda la información y el Tenant, previa notificación.
          </Sub>
        </Section>

        <Section id="11" title="11. Compliance, Anticorrupción y LFPIORPI">
          <Sub title="11.1 Prevención de Lavado de Dinero">
            El Cliente garantiza fondos de origen lícito y se obliga a no usar CIFRA para operaciones relacionadas con la LFPIORPI.
          </Sub>
        </Section>

        <Section id="12" title="12. Rescisión Inmediata">
          CIFRA puede bloquear la cuenta sin período de gracia ante: (a) ingeniería inversa; (b) fraudes fiscales o simulación de operaciones; (c) reventa de licencia; (d) violaciones a la LFPIORPI.
        </Section>

        <Section id="13" title="13. Modificaciones">
          Los cambios materiales se notificarán con <strong>15 días naturales de anticipación</strong> por correo y/o banner en el dashboard. El uso continuo constituirá aceptación.
        </Section>

        <Section id="14" title="14. Jurisdicción y Ley Aplicable">
          Estos TyC se rigen por el Código de Comercio, Código Civil Federal y leyes federales de los Estados Unidos Mexicanos. Las controversias se someterán a los Tribunales Federales con residencia en la Ciudad de México, agotando primero 30 días de negociación directa.
        </Section>

        <div className="mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="font-black text-neutral-900 dark:text-white mb-2">Contacto Legal</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">
              angelortizsanchez0112@gmail.com
            </a>
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Angel Alberto Ortiz Sánchez · Calle 33 No. 53, Col. Estado de México, C.P. 57210, Nezahualcóyotl, Estado de México
          </p>
        </div>
      </article>
    </LegalLayout>
  )
}
