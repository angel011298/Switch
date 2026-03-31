import Link from 'next/link'
import {
  FileText, BarChart3, Users, ShoppingCart, Brain, Package,
  CheckCircle2, ArrowRight, Zap, Shield, Globe, TrendingUp,
  Star, ChevronRight, Play, Building2, Receipt, PieChart,
  Clock, Lock, Headphones, Factory, FolderKanban,
} from 'lucide-react'

export const metadata = {
  title: 'CIFRA — ERP Integral para tu Empresa | México',
  description: 'Facturación CFDI 4.0, contabilidad, nómina, CRM, POS e inteligencia artificial. Todo integrado, todo en México.',
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULES = [
  {
    icon: FileText,
    color: '#3b82f6',
    bg: '#eff6ff',
    darkBg: '#1e3a5f',
    title: 'Facturación CFDI 4.0',
    desc: 'Timbrado real ante el SAT en menos de 2 segundos. Emisión, cancelación y envío automático.',
    bullets: ['CFDI ingreso, egreso, traslado y pago', 'Catálogo SAT 2026 integrado', 'Envío automático al receptor', 'Cancelación y sustitución fácil'],
  },
  {
    icon: BarChart3,
    color: '#10b981',
    bg: '#ecfdf5',
    darkBg: '#14532d',
    title: 'Contabilidad & Finanzas',
    desc: 'Balanzas, estados financieros y flujo de caja en tiempo real sin contadores adicionales.',
    bullets: ['Pólizas automáticas desde facturas', 'Flujo de caja a 13 semanas', 'Conciliación bancaria', 'ISR e IVA calculados al instante'],
  },
  {
    icon: Users,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    darkBg: '#3b0764',
    title: 'Nómina & Capital Humano',
    desc: 'ISR, IMSS, INFONAVIT 2026 calculados al centavo. CFDI de nómina timbrado.',
    bullets: ['Cálculo preciso de ISR vigente', 'Cuotas IMSS e INFONAVIT auto', 'Recibos CFDI 4.0 timbrados', 'Expediente digital por empleado'],
  },
  {
    icon: ShoppingCart,
    color: '#f97316',
    bg: '#fff7ed',
    darkBg: '#7c2d12',
    title: 'POS + CRM Integrado',
    desc: 'Punto de venta táctil conectado directamente a tu inventario y CRM.',
    bullets: ['POS táctil con lector de códigos', 'Inventario en tiempo real', 'Pipeline Kanban para ventas', 'Portal de clientes incluido'],
  },
  {
    icon: Brain,
    color: '#ec4899',
    bg: '#fdf2f8',
    darkBg: '#701a75',
    title: 'CIFRA AI Copilot',
    desc: 'Tu contador, analista financiero y asesor fiscal disponible 24/7.',
    bullets: ['Consultas en lenguaje natural', 'Detecta inconsistencias fiscales', 'Sugiere optimizaciones de impuestos', 'Reportes ejecutivos con un clic'],
  },
  {
    icon: Package,
    color: '#06b6d4',
    bg: '#ecfeff',
    darkBg: '#164e63',
    title: 'Inventario & Cadena de Suministro',
    desc: 'Control multi-almacén, órdenes de compra y logística integrada.',
    bullets: ['Stock multi-almacén en tiempo real', 'OC con aprobación por roles', 'Seguimiento de envíos', 'Historial de costos por proveedor'],
  },
]

const EXTRA_MODULES = [
  { icon: Factory, label: 'Manufactura MRP' },
  { icon: FolderKanban, label: 'Proyectos' },
  { icon: Headphones, label: 'Mesa de Soporte' },
  { icon: Globe, label: 'Multi-empresa' },
  { icon: Shield, label: 'Seguridad RBAC' },
  { icon: PieChart, label: 'BI & Reportes' },
]

const STATS = [
  { value: '+500', label: 'Empresas activas', icon: Building2 },
  { value: '1.2s', label: 'Timbrado promedio', icon: Zap },
  { value: '99.9%', label: 'Disponibilidad', icon: Clock },
  { value: '24/7', label: 'Soporte disponible', icon: Headphones },
]

const PLANS = [
  {
    name: 'Básico',
    price: '$799',
    period: '/mes',
    desc: 'Para emprendedores y startups',
    highlight: false,
    features: ['Facturación CFDI ilimitada', 'Contabilidad básica', 'Hasta 3 usuarios', 'Soporte por email', '5 GB almacenamiento'],
  },
  {
    name: 'Profesional',
    price: '$1,799',
    period: '/mes',
    desc: 'El más popular para PyMEs',
    highlight: true,
    features: ['Todo lo de Básico', 'Nómina + CRM + POS', 'Hasta 15 usuarios', 'CIFRA AI Copilot', 'Soporte prioritario 24/7', 'Inventario multi-almacén'],
  },
  {
    name: 'Empresarial',
    price: 'A consultar',
    period: '',
    desc: 'Para grandes organizaciones',
    highlight: false,
    features: ['Todo lo de Profesional', 'Multi-empresa', 'Usuarios ilimitados', 'Manufactura MRP', 'API + integraciones custom', 'Gerente de cuenta dedicado'],
  },
]

const TESTIMONIALS = [
  {
    name: 'Roberto Sánchez',
    role: 'Director General',
    company: 'Distribuidora Norteña S.A.',
    text: 'Antes tardábamos 3 días en cerrar el mes contable. Con CIFRA lo hacemos en 2 horas. El ROI fue inmediato desde el primer mes.',
    rating: 5,
  },
  {
    name: 'Laura Martínez',
    role: 'CFO',
    company: 'Tech Innovators MX',
    text: 'El módulo de nómina nos eliminó 3 errores mensuales de IMSS que nos costaban multas. El ahorro en sanciones pagó la suscripción anual.',
    rating: 5,
  },
  {
    name: 'Carlos Mendoza',
    role: 'Dueño',
    company: 'Ferretería El Clavo',
    text: 'El POS integrado con inventario y facturación es un sueño. Ya no tengo que usar 4 sistemas diferentes para vender.',
    rating: 5,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes slideLeft{ from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes float    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow:0 0 0 0 rgba(59,130,246,0.3); } 50% { box-shadow:0 0 0 16px rgba(59,130,246,0); } }
        @keyframes shimmer  { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes ticker   { from { transform:translateX(0); } to { transform:translateX(-50%); } }

        .anim-fade-up   { animation: fadeUp 0.8s ease-out both; }
        .anim-fade-in   { animation: fadeIn 0.8s ease-out both; }
        .anim-slide-left{ animation: slideLeft 0.8s ease-out both; }
        .anim-float     { animation: float 4s ease-in-out infinite; }
        .anim-pulse-glow{ animation: pulse-glow 2.5s ease-in-out infinite; }

        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .delay-6 { animation-delay: 0.6s; }
        .delay-7 { animation-delay: 0.7s; }

        .hero-gradient {
          background: linear-gradient(150deg, #020b1a 0%, #061830 35%, #0c2144 65%, #102857 100%);
        }
        .shimmer-text {
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 30%, #a78bfa 60%, #3b82f6 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 25s linear infinite;
        }
        .mesh-grid {
          background-image:
            linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .highlight-badge {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }
      `}</style>

      <div className="min-h-screen bg-white font-sans antialiased">

        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.png" alt="CIFRA" className="h-9 object-contain" />
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#modulos" className="hover:text-blue-600 transition-colors">Módulos</a>
              <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Cómo funciona</a>
              <a href="#precios" className="hover:text-blue-600 transition-colors">Precios</a>
              <a href="#testimonios" className="hover:text-blue-600 transition-colors">Clientes</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
                Iniciar Sesión
              </Link>
              <Link
                href="/login"
                className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-blue-500/25 hover:shadow-lg"
              >
                Prueba Gratis 14 días
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="hero-gradient mesh-grid min-h-screen flex items-center pt-16 overflow-hidden relative">
          {/* Ambient glows */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)' }} />

          <div className="max-w-7xl mx-auto px-5 py-20 md:py-28 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left copy */}
              <div>
                <div className="anim-fade-up inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
                  <Zap className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Nuevo: CIFRA AI Copilot disponible</span>
                </div>

                <h1 className="anim-fade-up delay-1 text-5xl md:text-6xl font-black text-white leading-[1.04] mb-6">
                  El ERP que <br />
                  <span className="shimmer-text">simplifica tu empresa</span>
                </h1>

                <p className="anim-fade-up delay-2 text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                  Facturación CFDI 4.0, contabilidad, nómina, CRM y punto de venta.
                  Todo en una sola plataforma diseñada para empresas mexicanas.
                </p>

                <div className="anim-fade-up delay-3 flex flex-col sm:flex-row gap-4 mb-10">
                  <Link
                    href="/login"
                    className="anim-pulse-glow inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-4 rounded-2xl text-base transition-all duration-200 shadow-xl shadow-blue-500/30"
                  >
                    Comenzar Gratis — 14 días
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#modulos"
                    className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-4 rounded-2xl text-base transition-all duration-200"
                  >
                    <Play className="h-4 w-4 text-blue-400" />
                    Ver módulos
                  </a>
                </div>

                <div className="anim-fade-up delay-4 flex flex-wrap gap-5">
                  {[
                    { icon: Shield, text: 'Certificado SAT' },
                    { icon: Lock, text: 'Datos encriptados' },
                    { icon: CheckCircle2, text: 'Sin contrato' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-slate-400 text-sm">
                      <Icon className="h-4 w-4 text-emerald-400" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — dashboard mockup */}
              <div className="anim-slide-left delay-2 hidden lg:block">
                <div className="anim-float relative">
                  {/* Outer glow frame */}
                  <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
                  {/* Dashboard card */}
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
                    {/* Fake top bar */}
                    <div className="bg-white/[0.06] border-b border-white/[0.06] px-4 py-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                      <span className="ml-3 text-slate-400 text-xs font-mono">cifra-mx.vercel.app/dashboard</span>
                    </div>
                    {/* Fake dashboard UI */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-xs mb-0.5">Panel principal</p>
                          <p className="text-white font-black text-xl leading-none">Centro de Mando</p>
                        </div>
                        <div className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                          En vivo
                        </div>
                      </div>
                      {/* KPI row */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Facturado hoy', value: '$48,200', trend: '+8%', color: '#3b82f6' },
                          { label: 'Nómina mes', value: '$94,800', trend: '+2%', color: '#8b5cf6' },
                          { label: 'IVA por pagar', value: '$18,432', trend: '-5%', color: '#10b981' },
                        ].map(kpi => (
                          <div key={kpi.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                            <p className="text-slate-500 text-[10px] mb-1 truncate">{kpi.label}</p>
                            <p className="text-white font-black text-sm">{kpi.value}</p>
                            <p className="text-[10px] font-bold mt-0.5" style={{ color: kpi.color }}>{kpi.trend}</p>
                          </div>
                        ))}
                      </div>
                      {/* Fake bar chart */}
                      <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-2">Ingresos · últimos 7 meses</p>
                        <div className="flex items-end gap-1.5 h-16">
                          {[45, 62, 55, 80, 68, 90, 78].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t-sm"
                              style={{
                                height: `${h}%`,
                                background: i === 6
                                  ? 'linear-gradient(to top, #3b82f6, #60a5fa)'
                                  : i >= 4 ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.15)',
                              }} />
                          ))}
                        </div>
                      </div>
                      {/* Recent invoices */}
                      <div className="space-y-2">
                        {[
                          { name: 'Distribuidora Norte S.A.', amount: '$12,800', status: 'Timbrado', color: '#10b981' },
                          { name: 'Servicios Integrales MX', amount: '$8,500', status: 'Pendiente', color: '#f59e0b' },
                          { name: 'Comercial Azteca', amount: '$22,400', status: 'Timbrado', color: '#10b981' },
                        ].map(inv => (
                          <div key={inv.name} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <p className="text-slate-300 text-xs truncate max-w-[140px]">{inv.name}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-white font-bold text-xs">{inv.amount}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                style={{ color: inv.color, borderColor: inv.color + '40', background: inv.color + '15' }}>
                                {inv.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS TICKER ────────────────────────────────────────────────── */}
        <section className="bg-slate-900 py-10 overflow-hidden border-y border-slate-800">
          <div className="flex overflow-hidden">
            <div className="ticker-track">
              {[...STATS, ...STATS, ...STATS, ...STATS].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex items-center gap-4 px-12 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-black text-2xl leading-none">{s.value}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-700 ml-4" />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── MODULES ─────────────────────────────────────────────────────── */}
        <section id="modulos" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-5">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-4">
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Plataforma completa</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                Todo lo que tu empresa necesita,<br />
                <span className="text-blue-600">en un solo lugar</span>
              </h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                11 módulos integrados que se comunican entre sí. Sin integraciones manuales, sin datos duplicados.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODULES.map((mod) => {
                const Icon = mod.icon
                return (
                  <div key={mod.title} className="card-hover bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                      style={{ background: mod.bg }}>
                      <Icon className="h-6 w-6" style={{ color: mod.color }} />
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mb-2">{mod.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">{mod.desc}</p>
                    <ul className="space-y-2">
                      {mod.bullets.map(b => (
                        <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: mod.color }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Extra modules pills */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-slate-400 font-semibold">Y además:</span>
              {EXTRA_MODULES.map(m => {
                const Icon = m.icon
                return (
                  <span key={m.label} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium shadow-sm">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    {m.label}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section id="como-funciona" className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-5">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                Listo en <span className="text-blue-600">menos de 10 minutos</span>
              </h2>
              <p className="text-slate-500 text-lg">Sin instalaciones, sin hardware, sin complicaciones.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { num: '01', title: 'Crea tu cuenta', desc: 'Regístrate con tu RFC y correo empresarial. 14 días gratis, sin tarjeta de crédito.', icon: Building2, color: '#3b82f6' },
                { num: '02', title: 'Configura tu empresa', desc: 'Importa tu catálogo de productos, empleados y clientes. Asistente paso a paso.', icon: Zap, color: '#8b5cf6' },
                { num: '03', title: 'Empieza a operar', desc: 'Emite tu primera factura, procesa nómina y analiza tus finanzas en tiempo real.', icon: TrendingUp, color: '#10b981' },
              ].map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.num} className="relative text-center">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-white font-black text-xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}aa)` }}>
                      {step.num}
                    </div>
                    <h3 className="font-black text-slate-900 text-xl mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────────── */}
        <section id="precios" className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                Precios <span className="text-blue-600">transparentes</span>
              </h2>
              <p className="text-slate-500 text-lg">Sin sorpresas. Sin letras pequeñas. Cancela cuando quieras.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlight
                      ? 'bg-slate-900 border-blue-500 shadow-2xl shadow-blue-500/20'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 highlight-badge text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                      MÁS POPULAR
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`font-black text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-4 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.desc}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className={`font-black text-4xl ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`text-sm mb-1 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-emerald-500'}`} />
                        <span className={plan.highlight ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                      plan.highlight
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-900 hover:bg-blue-600 text-white'
                    } ${plan.name === 'Empresarial' ? 'bg-white text-slate-900 border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600' : ''}`}
                  >
                    {plan.name === 'Empresarial' ? 'Contactar ventas' : 'Empezar gratis 14 días'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
        <section id="testimonios" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                Empresas que ya <span className="text-blue-600">confían en CIFRA</span>
              </h2>
              <p className="text-slate-500 text-lg">Resultados reales de clientes reales.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="card-hover bg-slate-50 border border-slate-100 rounded-2xl p-7">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm">
                      {t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
        <section className="hero-gradient mesh-grid py-28 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)' }} />
          <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Tu empresa merece el mejor ERP.<br />
              <span className="shimmer-text">Empieza hoy gratis.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              14 días sin costo, sin tarjeta de crédito, sin compromiso.
              Migración asistida incluida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-9 py-4 rounded-2xl text-lg transition-all duration-200 shadow-2xl shadow-blue-500/30 hover:scale-[1.02]"
              >
                Crear cuenta gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="mailto:ventas@cifra-mx.com"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-9 py-4 rounded-2xl text-lg transition-all duration-200"
              >
                <Headphones className="h-5 w-5 text-blue-400" />
                Hablar con ventas
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
              {['Sin tarjeta de crédito', '14 días gratis', 'Cancela cuando quieras', 'Soporte en español'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="bg-slate-950 border-t border-slate-800 py-14">
          <div className="max-w-7xl mx-auto px-5">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-dark.png" alt="CIFRA" className="h-10 object-contain mb-4" />
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  ERP integral para empresas mexicanas. Facturación CFDI, contabilidad, nómina y más. Todo en la nube, todo en México.
                </p>
                <div className="flex items-center gap-2 mt-4 text-slate-500 text-xs">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Certificado por el SAT · CFDI 4.0 · Datos en México</span>
                </div>
              </div>
              <div>
                <h4 className="text-slate-300 font-bold text-sm mb-4 uppercase tracking-wider">Producto</h4>
                <ul className="space-y-2.5 text-slate-500 text-sm">
                  {['Facturación CFDI', 'Contabilidad', 'Nómina', 'POS & CRM', 'CIFRA AI', 'Inventario'].map(t => (
                    <li key={t}><a href="#modulos" className="hover:text-slate-300 transition-colors">{t}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-slate-300 font-bold text-sm mb-4 uppercase tracking-wider">Empresa</h4>
                <ul className="space-y-2.5 text-slate-500 text-sm">
                  {[['Precios', '#precios'], ['Clientes', '#testimonios'], ['Iniciar Sesión', '/login'], ['Crear cuenta', '/login']].map(([label, href]) => (
                    <li key={label}><a href={href} className="hover:text-slate-300 transition-colors">{label}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
              <p>© {new Date().getFullYear()} CIFRA ERP. Todos los derechos reservados.</p>
              <div className="flex gap-6">
                <a href="/terminos" className="hover:text-slate-400 transition-colors">Términos</a>
                <a href="/privacidad" className="hover:text-slate-400 transition-colors">Privacidad</a>
                <a href="/cookies" className="hover:text-slate-400 transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
