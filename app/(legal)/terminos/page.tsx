import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · CIFRA ERP',
  description: 'Términos y Condiciones de Uso del Software ERP CIFRA para empresas mexicanas.',
}

const LAST_UPDATED = '2 de abril de 2026'

export default function TerminosPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {/* Encabezado */}
      <div className="not-prose mb-10 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
          Documento Legal
        </div>
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
          Términos y Condiciones de Uso
        </h1>
        <p className="text-neutral-500">Última actualización: <strong>{LAST_UPDATED}</strong></p>
        <p className="text-sm text-neutral-400 mt-2">
          Aplica a todos los usuarios de <strong>CIFRA ERP</strong> (cifra-mx.vercel.app) operado por Angel Alberto Ortiz Sánchez.
        </p>
      </div>

      {/* Secciones */}
      <Section id="1" title="1. Aceptación, Naturaleza del Servicio y Relación Comercial">
        <Sub title="1.1 Aceptación Expresa">
          Al registrarse, crear una cuenta y/o hacer clic en &quot;Acepto&quot;, el usuario (en adelante <strong>&quot;El Cliente&quot;</strong>) consiente y acepta expresamente estos Términos y Condiciones (TyC), constituyendo un acuerdo legalmente vinculante conforme al Artículo 89 del Código de Comercio.
        </Sub>
        <Sub title="1.2 Definiciones Clave">
          <ul>
            <li><strong>SaaS:</strong> Software como Servicio. CIFRA aloja el sistema en la nube y El Cliente accede vía internet.</li>
            <li><strong>Tenant:</strong> Instancia lógica, privada y aislada de base de datos asignada exclusivamente a El Cliente.</li>
            <li><strong>Usuario Final:</strong> Cualquier empleado, colaborador o tercero a quien El Cliente otorgue credenciales de acceso.</li>
            <li><strong>Datos del Cliente:</strong> Toda información, XMLs, registros contables y datos personales ingresados por El Cliente en la plataforma.</li>
            <li><strong>CFDI:</strong> Comprobante Fiscal Digital por Internet conforme al Artículo 29 del CFF.</li>
            <li><strong>CSD:</strong> Certificado de Sello Digital emitido por el SAT.</li>
          </ul>
        </Sub>
        <Sub title="1.3 Naturaleza Tecnológica B2B">
          CIFRA ERP es una plataforma SaaS diseñada para la gestión administrativa integral de empresas mexicanas, incluyendo: facturación electrónica (CFDI 4.0), contabilidad de partida doble, punto de venta (POS), control de asistencia (Reloj Checador con geolocalización), nómina con cálculo de ISR/IMSS, CRM, SCM, MRP y Business Intelligence. <strong>No somos un despacho contable, fiscal, legal ni asesor financiero.</strong>
        </Sub>
        <Sub title="1.4 Licencia de Uso">
          CIFRA otorga a El Cliente una licencia de uso <strong>limitada, no exclusiva, intransferible, revocable y temporal</strong>, sujeta al pago de la suscripción activa. Esto no constituye una venta del software ni del código fuente, los cuales permanecen como propiedad exclusiva de CIFRA.
        </Sub>
        <Sub title="1.5 Cláusula de No Asesoría">
          Las automatizaciones del sistema, incluyendo cálculos de ISR, IMSS, IVA, nómina y conciliación contable, son <strong>sugerencias algorítmicas</strong>. Ningún reporte o cálculo generado constituye asesoría legal o fiscal. La validación final ante el SAT, el IMSS, el INFONAVIT o cualquier autoridad recae exclusiva y totalmente en El Cliente.
        </Sub>
      </Section>

      <Section id="2" title="2. Credenciales Fiscales y Cumplimiento Tributario (CFF)">
        <Sub title="2.1 Uso de CSD y e.firma">
          Para los módulos de Facturación (CFDI), Mis CFDI y timbrado vía PAC (SW Sapien), El Cliente autoriza el uso de sus Certificados de Sello Digital (CSD) y/o e.firma, otorgando a CIFRA un <strong>mandato estrictamente tecnológico y automatizado</strong> para la descarga, validación y emisión de comprobantes ante el Servicio de Administración Tributaria (SAT).
        </Sub>
        <Sub title="2.2 Confidencialidad de Credenciales">
          Las credenciales del CSD (archivo .cer, .key y contraseña) y e.firma se almacenan cifradas en la infraestructura de CIFRA utilizando aislamiento por Tenant. El Cliente asume la responsabilidad de no compartir dichas credenciales con terceros ajenos a CIFRA.
        </Sub>
        <Sub title="2.3 Exención por Operaciones Simuladas (Art. 69-B CFF)">
          El Cliente se obliga a no utilizar CIFRA ERP para simular operaciones o evadir impuestos. CIFRA no será responsable si El Cliente emite o recibe facturas de Empresas Facturadoras de Operaciones Simuladas (EFOS) o si sus CSD son restringidos conforme al Artículo 17-H Bis del CFF.
        </Sub>
        <Sub title="2.4 Cancelación de CFDI">
          Las cancelaciones de CFDI se realizan conforme a la regla 2.7.1.3 de la RMF vigente. CIFRA facilita el proceso técnico; sin embargo, la responsabilidad fiscal de las cancelaciones recae en El Cliente.
        </Sub>
      </Section>

      <Section id="3" title="3. Privacidad y Protección de Datos Personales (LFPDPPP)">
        <Sub title="3.1 Roles Legales">
          <ul>
            <li><strong>Como Responsable:</strong> CIFRA es responsable exclusivo de los datos de registro, facturación y pago de la suscripción.</li>
            <li><strong>Como Encargado:</strong> Respecto a la información de terceros que El Cliente suba (empleados, clientes, proveedores), CIFRA actúa únicamente como Encargado. El Cliente garantiza tener el consentimiento expreso de dichos terceros.</li>
          </ul>
        </Sub>
        <Sub title="3.2 Vulneraciones de Seguridad">
          Cualquier vulneración será notificada a El Cliente en el plazo previsto por la LFPDPPP, para que, en su rol de Responsable, notifique a los titulares y a la Secretaría Anticorrupción y Buen Gobierno (o la autoridad competente que asuma sus funciones).
        </Sub>
        <Sub title="3.3 Aviso de Privacidad">
          El tratamiento completo de datos personales se detalla en nuestro{' '}
          <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 underline">Aviso de Privacidad Integral</Link>.
        </Sub>
      </Section>

      <Section id="4" title="4. Módulo de Reloj Checador y Geolocalización (LFT)">
        <Sub title="4.1 Funcionalidad">
          El módulo de Reloj Checador captura la ubicación geográfica (latitud y longitud) del dispositivo del Trabajador únicamente al momento de registrar su asistencia, con el propósito de validar su presencia en el lugar de trabajo designado.
        </Sub>
        <Sub title="4.2 Indemnidad Laboral">
          Conforme a la Ley Federal del Trabajo, el patrón es El Cliente. Es su obligación recabar el consentimiento informado y expreso de sus trabajadores para la captura de geolocalización, antes de activar este módulo. El Cliente libera a CIFRA de cualquier contingencia ante la STPS o cualquier autoridad laboral.
        </Sub>
      </Section>

      <Section id="5" title="5. Conservación de Datos y Firma Electrónica (NOM-151 / Código de Comercio)">
        <Sub title="5.1 Limitación de Certificación">
          CIFRA facilita el almacenamiento de XMLs y PDFs de CFDI, pero no actúa como Prestador de Servicios de Certificación (PSC) autorizado por la Secretaría de Economía. La conservación normativa de la contabilidad electrónica (Art. 30 CFF — 5 años) es responsabilidad de El Cliente.
        </Sub>
        <Sub title="5.2 Firma Electrónica Simple">
          Conforme al Artículo 89 del Código de Comercio, el uso de credenciales de acceso (correo/contraseña, 2FA TOTP) por los Usuarios Finales constituye una <strong>Firma Electrónica Simple</strong>. Toda acción realizada bajo una sesión iniciada será legalmente vinculante y atribuible a El Cliente.
        </Sub>
        <Sub title="5.3 Registro de Auditoría">
          CIFRA mantiene un registro de auditoría (AuditLog) de todas las acciones críticas realizadas en la plataforma, incluyendo creación, modificación y eliminación de registros contables, facturas y nóminas. Dicho registro es accesible por El Cliente desde el panel de Auditoría.
        </Sub>
      </Section>

      <Section id="6" title="6. Propiedad Intelectual y de los Datos">
        <Sub title="6.1 Propiedad del Software">
          El código fuente, algoritmos, interfaces (UI/UX), marca CIFRA, logotipos y cualquier elemento de la plataforma son propiedad exclusiva de Angel Alberto Ortiz Sánchez, protegidos por las leyes de propiedad intelectual vigentes en los Estados Unidos Mexicanos. El Cliente no tiene derecho a realizar ingeniería inversa, copiar, sublicenciar ni distribuir el software.
        </Sub>
        <Sub title="6.2 Propiedad de los Datos del Cliente">
          El Cliente conserva la titularidad sobre sus &quot;Datos del Cliente&quot;. CIFRA funge como depositario tecnológico y no reclamará propiedad sobre dichos datos. Al término del servicio, El Cliente podrá exportar sus datos en los formatos disponibles.
        </Sub>
        <Sub title="6.3 Uso Anonimizado">
          CIFRA podrá utilizar datos estadísticos <strong>anonimizados y agregados</strong> (sin identificadores personales ni empresariales) para mejorar los algoritmos y funcionalidades de la plataforma.
        </Sub>
      </Section>

      <Section id="7" title="7. Niveles de Servicio (SLA) y Mantenimiento">
        <Sub title="7.1 Disponibilidad">
          CIFRA procurará un SLA operativo del <strong>99.0% mensual</strong>, excluyendo ventanas de mantenimiento programado. El servicio depende de infraestructura de terceros (Vercel, Supabase, SW Sapien), por lo que no se otorgan garantías absolutas de disponibilidad continua.
        </Sub>
        <Sub title="7.2 Mantenimiento Programado">
          Los mantenimientos programados se notificarán con al menos 24 horas de anticipación mediante banner en la plataforma y/o correo electrónico. No se considerarán tiempo de inactividad para efectos del SLA.
        </Sub>
        <Sub title="7.3 Intermitencias de Terceros">
          CIFRA no asume responsabilidad por caídas en los Webservices del SAT, fallas de la infraestructura en la nube (Vercel, Supabase), caídas del PAC (SW Sapien), ni interrupciones de Open Banking o proveedores de pago (Stripe).
        </Sub>
      </Section>

      <Section id="8" title="8. Planes, Precios y Derecho del Consumidor (LFPC)">
        <Sub title="8.1 Planes de Suscripción">
          Los planes y precios vigentes se exhiben en la página de precios de CIFRA con todos los impuestos aplicables (IVA incluido donde corresponda). El precio final es el mostrado al momento de la contratación.
        </Sub>
        <Sub title="8.2 Período de Prueba">
          Cuando se ofrezca un período de prueba gratuito (TRIAL), este tendrá una duración definida al momento del registro. Al concluir el período de prueba, El Cliente deberá contratar un plan de pago para continuar operando.
        </Sub>
        <Sub title="8.3 Derecho de Cancelación">
          El Cliente podrá cancelar su suscripción en cualquier momento desde el portal de facturación. La cancelación evitará cargos futuros, pero <strong>no generará reembolsos proporcionales</strong> por el período en curso ya pagado.
        </Sub>
        <Sub title="8.4 Cambios de Plan">
          Los cambios de plan surtirán efecto al inicio del siguiente período de facturación, salvo que se indique lo contrario en la interfaz de actualización.
        </Sub>
      </Section>

      <Section id="9" title="9. Limitación de Responsabilidad">
        <Sub title="9.1 Errores de Usuario (GIGO)">
          CIFRA no será responsable por cálculos erróneos, recargos, multas o sanciones derivados de datos mal ingresados, configuraciones incorrectas o uso inadecuado de la plataforma realizados por El Cliente o sus Usuarios Finales.
        </Sub>
        <Sub title="9.2 Fuerza Mayor">
          CIFRA queda eximido de responsabilidad por eventos de fuerza mayor, incluyendo ataques cibernéticos, fallas eléctricas, desastres naturales, pandemias o indisponibilidad de proveedores externos fuera de nuestro control.
        </Sub>
        <Sub title="9.3 Tope de Responsabilidad">
          La responsabilidad total y acumulada de CIFRA ante El Cliente por cualquier causa estará estrictamente limitada al <strong>monto total pagado por El Cliente durante los últimos tres (3) meses</strong> anteriores al evento que generó el reclamo. CIFRA no responderá por lucro cesante, daño moral, pérdida de datos por causas atribuibles a El Cliente, ni multas administrativas.
        </Sub>
        <Sub title="9.4 Servicio &quot;Tal Cual&quot;">
          El servicio se proporciona &quot;tal cual&quot; (<em>as is</em>). CIFRA no garantiza que la plataforma sea ininterrumpida, libre de errores o que satisfaga todos los requisitos específicos de cada industria.
        </Sub>
      </Section>

      <Section id="10" title="10. Suspensión, Falta de Pago y Retención de Datos">
        <Sub title="10.1 Período de Gracia">
          Si el cobro automático falla, se otorgará un período de gracia de <strong>5 (cinco) días naturales</strong> con operación normal del sistema.
        </Sub>
        <Sub title="10.2 Solo Lectura">
          Del día 6 al 30 de impago, la cuenta entrará en modo &quot;Solo Lectura&quot;: El Cliente podrá acceder únicamente para consultar y exportar sus datos (XMLs, PDFs, Excel). No se podrán crear ni modificar registros.
        </Sub>
        <Sub title="10.3 Purga Definitiva">
          Al cumplirse 30 días continuos de impago, en apego al Principio de Cancelación de la LFPDPPP y previa notificación, CIFRA procederá a la <strong>eliminación y destrucción definitiva e irrecuperable</strong> de toda la información y el Tenant de El Cliente.
        </Sub>
        <Sub title="10.4 Liberación">
          El Cliente reconoce que, tras la purga definitiva, CIFRA no será responsable por ninguna pérdida de información.
        </Sub>
      </Section>

      <Section id="11" title="11. Compliance y Anticorrupción">
        <Sub title="11.1 Prevención de Lavado de Dinero (LFPIORPI)">
          El Cliente garantiza que sus fondos son de origen lícito y se obliga a no usar CIFRA ERP para facilitar, encubrir o simular operaciones relacionadas con delitos contemplados en la Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita.
        </Sub>
        <Sub title="11.2 Anticorrupción">
          El uso de CIFRA para registrar, facilitar o encubrir actos de corrupción en términos de la Ley General del Sistema Nacional Anticorrupción constituye causa inmediata de rescisión del contrato.
        </Sub>
      </Section>

      <Section id="12" title="12. Terminación y Rescisión">
        <Sub title="12.1 Causas de Rescisión Inmediata por CIFRA">
          CIFRA podrá bloquear la cuenta sin período de gracia si El Cliente: (a) intenta realizar ingeniería inversa del software; (b) utiliza el sistema para cometer fraudes fiscales o simular operaciones ante el SAT; (c) revende o sublicencia su acceso a terceros; (d) viola las disposiciones de la LFPIORPI.
        </Sub>
        <Sub title="12.2 Exportación de Datos Previo a Terminación">
          Ante cualquier causa de terminación no atribuible a incumplimiento grave de El Cliente, CIFRA otorgará un plazo razonable (mínimo 5 días hábiles) para que El Cliente exporte sus datos antes de la eliminación definitiva del Tenant.
        </Sub>
      </Section>

      <Section id="13" title="13. Modificaciones a los TyC">
        <Sub title="13.1 Derecho de Modificación">
          CIFRA se reserva el derecho de modificar estos TyC en cualquier momento, motivado por cambios en la legislación aplicable, actualizaciones del servicio o decisiones de negocio.
        </Sub>
        <Sub title="13.2 Notificación">
          Las modificaciones materiales se notificarán con al menos <strong>15 días naturales de anticipación</strong> mediante correo electrónico al correo registrado y/o banner destacado en el dashboard. El uso continuo de CIFRA ERP tras el período de notificación constituirá la aceptación expresa de los nuevos términos.
        </Sub>
      </Section>

      <Section id="14" title="14. Jurisdicción y Ley Aplicable">
        <Sub title="14.1 Ley Aplicable">
          Estos TyC se rigen e interpretan conforme al Código de Comercio, el Código Civil Federal, la LFPDPPP, el CFF y demás leyes federales vigentes de los Estados Unidos Mexicanos.
        </Sub>
        <Sub title="14.2 Jurisdicción">
          Cualquier controversia derivada de estos TyC se someterá a los Tribunales Federales competentes con residencia en la Ciudad de México, renunciando expresamente las partes a cualquier otro fuero que pudiere corresponderles por razón de sus domicilios presentes o futuros.
        </Sub>
        <Sub title="14.3 Solución Amigable">
          Antes de iniciar cualquier procedimiento legal, las partes se comprometen a agotar un período de negociación directa de 30 días naturales contados desde la notificación formal del conflicto.
        </Sub>
      </Section>

      {/* Contacto */}
      <div className="not-prose mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="font-black text-neutral-900 dark:text-white mb-2">Contacto Legal</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Para dudas sobre estos Términos y Condiciones, escríbenos a{' '}
          <a href="mailto:angelortizsanchez0112@gmail.com" className="text-blue-600 dark:text-blue-400 underline">
            angelortizsanchez0112@gmail.com
          </a>
        </p>
        <p className="text-xs text-neutral-400 mt-3">
          Angel Alberto Ortiz Sánchez · Calle 33 No. 53, Col. Estado de México, C.P. 57210, Nezahualcóyotl, Estado de México
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
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{title}</h3>
      <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">{children}</div>
    </div>
  )
}
