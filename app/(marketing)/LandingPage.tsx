'use client';

/**
 * CIFRA — Landing Page
 * =====================
 * Audiencia : PyMEs, Contadores, Empresas medianas
 * CTA       : Prueba gratis 14 días + WhatsApp ventas
 * Secciones : Navbar · Hero · Stats · Perfiles · Módulos · Precios · CTA · Footer
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText, ShoppingCart, Users, Calculator,
  BarChart3, Package, Truck, UserCheck,
  Building2, Briefcase, Globe,
  Check, MessageCircle, ChevronRight, ArrowRight,
} from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────

const WA_URL =
  'https://wa.me/525532005195?text=Hola%2C%20me%20interesa%20conocer%20m%C3%A1s%20sobre%20CIFRA';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    desc: 'Para empresas que inician su digitalización',
    monthly: 499,
    annual: 4990,
    highlighted: false,
    features: [
      'Facturación CFDI 4.0 ilimitada',
      'Punto de Venta (POS)',
      'CRM básico',
      'Control de inventario',
      'Finanzas e impuestos',
      'Soporte por correo',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    desc: 'Para empresas en crecimiento con operaciones completas',
    monthly: 999,
    annual: 9990,
    highlighted: true,
    features: [
      'Todo lo de Starter',
      'BI y reportes avanzados',
      'SCM y compras',
      'Nómina ISR/IMSS 2026',
      'Recursos Humanos',
      'Gestión de proyectos',
      'Soporte prioritario',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    desc: 'Solución completa para empresas medianas y grandes',
    monthly: 1999,
    annual: 19990,
    highlighted: false,
    features: [
      'Todo lo de Pro',
      'MRP y manufactura',
      'Marketing y soporte CRM',
      'Logística avanzada',
      'Todos los módulos incluidos',
      'Soporte dedicado + SLA',
    ],
  },
];

const MODULES = [
  { icon: FileText,   title: 'Facturación CFDI 4.0', desc: 'Timbrado directo al SAT, ilimitado y en segundos.' },
  { icon: ShoppingCart, title: 'Punto de Venta',     desc: 'POS con desglose IVA inverso en tiempo real.' },
  { icon: Users,      title: 'CRM & Ventas',         desc: 'Pipeline kanban, seguimiento y cierre de clientes.' },
  { icon: Calculator, title: 'Nómina ISR/IMSS',      desc: 'Cálculo automático conforme a tabla SAT 2026.' },
  { icon: Package,    title: 'Inventario & SCM',     desc: 'Control de almacén, compras y cadena de suministro.' },
  { icon: BarChart3,  title: 'BI & Analytics',       desc: 'Dashboards en tiempo real con datos de toda la empresa.' },
  { icon: UserCheck,  title: 'Recursos Humanos',     desc: 'Empleados, contratos, vacaciones y documentos.' },
  { icon: Truck,      title: 'MRP & Manufactura',    desc: 'Planeación de producción, BOM y control de calidad.' },
];

const PROFILES = [
  {
    icon: Building2,
    title: 'PyME y negocios',
    desc: 'Factura sin complicaciones, controla tu inventario y POS desde un solo lugar. Sin necesidad de un contador de planta.',
    cta: 'Ver plan Starter',
  },
  {
    icon: Briefcase,
    title: 'Contadores y despachos',
    desc: 'Gestiona múltiples empresas, automatiza declaraciones y mantén todo en orden ante el SAT. Facturación masiva incluida.',
    cta: 'Ver plan Pro',
  },
  {
    icon: Globe,
    title: 'Empresas medianas',
    desc: 'ERP completo: nómina, MRP, SCM, proyectos y BI — todo conectado, auditado y conforme a normativa mexicana.',
    cta: 'Ver Enterprise',
  },
];

const STATS = [
  { value: 'CFDI 4.0',  label: 'Timbrado ilimitado' },
  { value: '14 días',   label: 'Prueba gratis' },
  { value: '8+',        label: 'Módulos integrados' },
  { value: '100%',      label: 'Hecho para México' },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#05050a] text-white font-sans antialiased">

      {/* ════════════════════════════════════════════════════ NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05050a]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <img src="/logo-dark.png" alt="CIFRA" className="h-7 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
            <a href="#modulos"  className="hover:text-white transition-colors">Módulos</a>
            <a href="#perfiles" className="hover:text-white transition-colors">¿Para quién?</a>
            <a href="#precios"  className="hover:text-white transition-colors">Precios</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg transition-colors"
            >
              Prueba gratis →
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════ HERO */}
      <section className="relative overflow-hidden pt-24 pb-20 px-5">
        {/* Glow bg */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-500/8 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full mb-9 tracking-wide">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            CFDI 4.0 · Nómina ISR/IMSS 2026 · SAT actualizado
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.07] mb-7">
            Cumple con el SAT.{' '}
            <br className="hidden sm:block" />
            <span className="text-emerald-400">Domina tu empresa.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CIFRA es el ERP y CRM fiscal diseñado para México.{' '}
            Facturación CFDI&nbsp;4.0, POS, Nómina, Inventario, CRM y más —
            todo en una sola plataforma.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base
                         px-8 py-4 rounded-xl transition-all
                         shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            >
              Empieza gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         bg-white/5 hover:bg-white/10 border border-white/10
                         text-white font-semibold text-base px-8 py-4 rounded-xl transition-all"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Hablar con ventas
            </a>
          </div>

          <p className="text-xs text-zinc-600">
            Sin tarjeta de crédito · Sin contratos · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ STATS BAR */}
      <section className="border-y border-white/5 bg-white/[0.018] py-8 px-5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-black text-emerald-400">{value}</p>
              <p className="text-sm text-zinc-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ PERFILES */}
      <section id="perfiles" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              ¿Para quién es CIFRA?
            </h2>
            <p className="text-zinc-500 text-lg">
              Una plataforma diseñada para cada etapa de tu negocio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PROFILES.map(({ icon: Icon, title, desc, cta }) => (
              <div
                key={title}
                className="group border border-white/8 bg-white/[0.03] hover:bg-white/[0.055]
                           hover:border-emerald-500/30 rounded-2xl p-7 transition-all"
              >
                <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-5">{desc}</p>
                <a
                  href="#precios"
                  className="text-sm text-emerald-400 font-semibold inline-flex items-center
                             gap-1 group-hover:gap-2 transition-all"
                >
                  {cta}
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ MÓDULOS */}
      <section id="modulos" className="py-24 px-5 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Todo lo que tu empresa necesita
            </h2>
            <p className="text-zinc-500 text-lg">
              8 módulos integrados. Cero integraciones externas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MODULES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="border border-white/8 bg-white/[0.03] hover:border-emerald-500/25
                           hover:bg-white/[0.05] rounded-xl p-5 transition-all"
              >
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="font-bold text-sm mb-1.5">{title}</h3>
                <p className="text-zinc-600 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ PRECIOS */}
      <section id="precios" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Precios simples y transparentes
            </h2>
            <p className="text-zinc-500 text-lg mb-8">
              14 días gratis en cualquier plan. Sin tarjeta de crédito.
            </p>

            {/* Toggle mensual / anual */}
            <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`text-sm font-semibold px-5 py-2 rounded-lg transition-all ${
                  !annual ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg transition-all ${
                  annual ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Anual
                <span className="text-xs bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded-md">
                  −17%
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={`relative rounded-2xl p-7 border transition-all ${
                  plan.highlighted
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-[1.02]'
                    : 'bg-white/[0.03] border-white/8'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black
                                  text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                    Más popular
                  </div>
                )}

                <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                <p className="text-zinc-500 text-sm mb-5">{plan.desc}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black">
                    ${(annual ? plan.annual : plan.monthly).toLocaleString('es-MX')}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1.5">
                    MXN / {annual ? 'año' : 'mes'}
                  </span>
                  {annual && (
                    <p className="text-emerald-400 text-xs mt-1.5 font-semibold">
                      Equivale a ${Math.round(plan.annual / 12).toLocaleString('es-MX')} MXN/mes
                    </p>
                  )}
                </div>

                <Link
                  href="/login"
                  className={`block w-full text-center font-bold py-3 rounded-xl mb-6 transition-all text-sm ${
                    plan.highlighted
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30'
                      : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  Empezar con {plan.name}
                </Link>

                <ul className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ CTA BOTTOM */}
      <section className="py-20 px-5 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-zinc-500 text-lg mb-8">
            14 días gratis, sin compromisos. Configúrate en menos de 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2
                         bg-emerald-500 hover:bg-emerald-400 text-black font-black
                         px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2
                         border border-white/10 hover:bg-white/5
                         text-white font-semibold px-8 py-4 rounded-xl transition-all"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ FOOTER */}
      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src="/logo-dark.png" alt="CIFRA" className="h-6 object-contain" />

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-600">
            <Link href="/login"                      className="hover:text-zinc-300 transition-colors">Iniciar sesión</Link>
            <a    href="#precios"                    className="hover:text-zinc-300 transition-colors">Precios</a>
            <a    href="#modulos"                    className="hover:text-zinc-300 transition-colors">Módulos</a>
            <a    href={WA_URL} target="_blank" rel="noopener noreferrer"
                                                     className="hover:text-zinc-300 transition-colors">Contacto</a>
          </nav>

          <p className="text-xs text-zinc-700">
            © {new Date().getFullYear()} CIFRA. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════ WHATSAPP FAB */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Hablar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white
                   p-4 rounded-full shadow-2xl shadow-black/50 transition-all hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
