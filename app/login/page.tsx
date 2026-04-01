'use client'

import { useState, Suspense, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { syncUserWithPrisma, getGoogleOAuthUrl, checkSignupDuplicates } from './actions'
import { useRouter } from 'next/navigation'
import {
  FileText, BarChart3, Users, ShoppingCart,
  Brain, Package, CheckCircle2, TrendingUp, Lock,
  Calendar, Headphones, Factory, FolderKanban, Shield,
  ArrowRight,
} from 'lucide-react'

// ─── Module showcase data (6 main) ──────────────────────────────────────────

const MODULES = [
  {
    id: 'cfdi',
    icon: FileText,
    accent: '#3b82f6',
    label: 'Facturación CFDI 4.0',
    tagline: 'Timbrado real ante el SAT',
    bullets: [
      'Emisión instantánea de CFDI ingreso, egreso, traslado y pago',
      'Cancelación y sustitución con un clic',
      'Catálogo SAT 2026 integrado (productos, unidades, regímenes)',
      'Envío automático por correo al receptor',
    ],
    stats: [
      { label: 'CFDIs emitidos', value: '1,847', trend: '+8.2%' },
      { label: 'Tiempo promedio', value: '1.2s' },
      { label: 'Tasa cancelación', value: '0.3%' },
    ],
    demo: [35, 52, 41, 68, 48, 75, 58, 82, 63, 88, 71, 95],
  },
  {
    id: 'finanzas',
    icon: BarChart3,
    accent: '#10b981',
    label: 'Contabilidad & Finanzas',
    tagline: 'Control financiero total',
    bullets: [
      'Balanza de comprobación y estados financieros automáticos',
      'Pólizas contables generadas desde facturas y nómina',
      'Flujo de caja proyectado a 13 semanas',
      'Conciliación bancaria y gestión de gastos',
    ],
    stats: [
      { label: 'Ingresos / mes', value: '$425K', trend: '+12.4%' },
      { label: 'Pólizas auto', value: '342' },
      { label: 'IVA neto', value: '$38K' },
    ],
    demo: [60, 45, 70, 55, 80, 65, 90, 72, 85, 78, 92, 88],
  },
  {
    id: 'nomina',
    icon: Users,
    accent: '#8b5cf6',
    label: 'Nómina & Capital Humano',
    tagline: 'ISR, IMSS, INFONAVIT 2026',
    bullets: [
      'Cálculo preciso de ISR según tablas vigentes',
      'Cuotas IMSS e INFONAVIT automáticas',
      'Timbrado de recibos de nómina (CFDI 4.0)',
      'Directorio de empleados con documentos y expedientes',
    ],
    stats: [
      { label: 'Empleados', value: '24' },
      { label: 'Nómina quincenal', value: '$89K' },
      { label: 'ISR retenido', value: '$11K' },
    ],
    demo: [50, 50, 52, 51, 55, 53, 58, 56, 60, 59, 62, 64],
  },
  {
    id: 'pos',
    icon: ShoppingCart,
    accent: '#f97316',
    label: 'POS + CRM Integrado',
    tagline: 'Vende, cobra, fideliza',
    bullets: [
      'Punto de venta táctil con escáner de código de barras',
      'Inventario en tiempo real con alertas de restock',
      'Pipeline de ventas tipo Kanban con seguimiento CRM',
      'Marketing por segmentos y portal de clientes',
    ],
    stats: [
      { label: 'Ventas hoy', value: '$12.4K', trend: '+15%' },
      { label: 'Tickets diarios', value: '186' },
      { label: 'Clientes CRM', value: '1,240' },
    ],
    demo: [30, 48, 36, 62, 44, 71, 52, 78, 59, 83, 67, 90],
  },
  {
    id: 'ai',
    icon: Brain,
    accent: '#ec4899',
    label: 'CIFRA AI Copilot',
    tagline: 'Inteligencia fiscal a tu servicio',
    bullets: [
      'Pregunta sobre tus finanzas en lenguaje natural',
      'Detecta inconsistencias contables y fiscales',
      'Sugiere optimizaciones de impuestos',
      'Genera reportes ejecutivos con un clic',
    ],
    stats: [
      { label: 'Consultas / mes', value: '2,341' },
      { label: 'Ahorro detectado', value: '$24K' },
      { label: 'Precisión', value: '97.8%' },
    ],
    demo: [20, 35, 45, 60, 55, 72, 68, 80, 75, 88, 85, 95],
  },
  {
    id: 'scm',
    icon: Package,
    accent: '#06b6d4',
    label: 'Inventario & Cadena de Suministro',
    tagline: 'Stock, compras y logística',
    bullets: [
      'Control de inventarios multi-almacén en tiempo real',
      'Órdenes de compra con aprobación por roles',
      'Seguimiento de envíos y logística integrada',
      'Gestión de proveedores con historial de costos',
    ],
    stats: [
      { label: 'SKUs activos', value: '847' },
      { label: 'Rotación', value: '4.2x' },
      { label: 'OCs pendientes', value: '23' },
    ],
    demo: [55, 62, 48, 70, 58, 75, 65, 80, 70, 85, 78, 88],
  },
]

// Additional modules (brief mention)
const EXTRA_MODULES = [
  { icon: Calendar, label: 'Calendario & Citas' },
  { icon: FolderKanban, label: 'Gestión de Proyectos' },
  { icon: Factory, label: 'Manufactura (MRP)' },
  { icon: Headphones, label: 'Soporte & Tickets' },
  { icon: Shield, label: 'Seguridad RBAC' },
]

// ─── CSS animation keyframes (injected once) ─────────────────────────────────

const PANEL_STYLES = `
  @keyframes mktFadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes mktFadeLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
  @keyframes mktPop      { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
`

// ─── Marketing Panel ─────────────────────────────────────────────────────────

function MarketingPanel() {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  const panelRef            = useRef<HTMLDivElement>(null)
  const spotlightRef        = useRef<HTMLDivElement>(null)
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null)

  const mod  = MODULES[active]
  const Icon = mod.icon

  // ── Cursor spotlight (plain JS, no GSAP) ──
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!spotlightRef.current || !panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    spotlightRef.current.style.transform = `translate(${x - 200}px, ${y - 200}px)`
    spotlightRef.current.style.opacity   = '1'
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = '0'
  }, [])

  // ── Auto-rotate ──
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActive(p => (p + 1) % MODULES.length)
        setFading(false)
      }, 250)
    }, 5000)
  }, [])

  useEffect(() => {
    startInterval()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [startInterval])

  const switchTo = (idx: number) => {
    if (idx === active) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    setFading(true)
    setTimeout(() => { setActive(idx); setFading(false) }, 250)
    startInterval()
  }

  return (
    <aside
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex lg:flex-col lg:w-[56%] relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(155deg, #020a18 0%, #061224 40%, #0a1a35 75%, #0d2040 100%)' }}
    >
      {/* CSS keyframe definitions */}
      <style>{PANEL_STYLES}</style>

      {/* Mesh grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${mod.accent}22 0%, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${mod.accent}18 0%, transparent 65%)`,
          transition: 'background 1s',
        }}
      />
      <div
        className="absolute -bottom-40 -left-20 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${mod.accent}0c 0%, transparent 70%)` }}
      />

      {/* ── Main content ── */}
      <div
        className="relative z-10 flex flex-col h-full p-10 overflow-y-auto"
        style={{ animation: 'mktFadeLeft 0.8s ease-out both' }}
      >

        {/* Logo — always dark variant (panel background is always dark) */}
        <div
          className="mb-8 flex-shrink-0"
          style={{ animation: 'mktFadeUp 0.6s ease-out both', animationDelay: '0.1s' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="CIFRA" className="h-14 object-contain object-left" />
        </div>

        {/* Headline */}
        <div
          className="mb-6 flex-shrink-0"
          style={{ animation: 'mktFadeUp 0.7s ease-out both', animationDelay: '0.2s' }}
        >
          <p
            className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 transition-colors duration-700"
            style={{ color: mod.accent }}
          >
            ERP Integral para tu Empresa
          </p>
          <h2 className="text-[2.5rem] font-black text-white leading-[1.08] mb-3">
            Tu empresa,<br />
            <span className="transition-colors duration-700" style={{ color: mod.accent }}>sin límites.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[360px]">
            Facturación CFDI, contabilidad, nómina, CRM, punto de venta e inteligencia artificial.
            Todo integrado, todo en México.
          </p>
        </div>

        {/* Module tabs */}
        <div
          className="flex flex-wrap gap-2 mb-5 flex-shrink-0"
          style={{ animation: 'mktFadeUp 0.7s ease-out both', animationDelay: '0.35s' }}
        >
          {MODULES.map((m, idx) => {
            const MIcon    = m.icon
            const isActive = idx === active
            return (
              <button
                key={m.id}
                onClick={() => switchTo(idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300 border"
                style={
                  isActive
                    ? { background: `${m.accent}20`, borderColor: `${m.accent}50`, color: m.accent }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#64748b' }
                }
              >
                <MIcon className="h-3 w-3 flex-shrink-0" />
                <span>{m.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Module content card */}
        <div
          className="flex-1 rounded-2xl border backdrop-blur-sm p-5 flex flex-col min-h-0"
          style={{
            background: 'rgba(6,14,30,0.85)',
            borderColor: `${mod.accent}28`,
            animation: 'mktFadeUp 0.8s ease-out both',
            animationDelay: '0.5s',
            transition: 'border-color 0.4s, opacity 0.25s, transform 0.25s',
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(6px) scale(0.985)' : 'translateY(0) scale(1)',
          }}
        >
          {/* Module header */}
          <div className="flex items-start gap-3.5 mb-4 flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${mod.accent}18` }}
            >
              <Icon className="h-6 w-6" style={{ color: mod.accent }} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base">{mod.label}</h3>
              <p className="text-sm mt-0.5 font-medium" style={{ color: mod.accent }}>{mod.tagline}</p>
            </div>
          </div>

          {/* Bullet points */}
          <ul className="space-y-2 mb-4 flex-shrink-0">
            {mod.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.8rem] text-slate-300 leading-relaxed">
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: mod.accent }} />
                {b}
              </li>
            ))}
          </ul>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
            {mod.stats.map(s => (
              <div key={s.label} className="rounded-xl p-2.5 border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.035)' }}>
                <p className="text-slate-500 text-[10px] mb-0.5 truncate">{s.label}</p>
                <p className="text-white font-black text-base leading-none">{s.value}</p>
                {s.trend && <p className="text-[10px] mt-0.5 font-bold" style={{ color: mod.accent }}>{s.trend}</p>}
              </div>
            ))}
          </div>

          {/* Mini bar chart */}
          <div className="flex items-end gap-[3px] h-12 mt-auto flex-shrink-0">
            {mod.demo.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[3px]"
                style={{
                  height: `${h}%`,
                  transition: 'height 0.5s ease',
                  background:
                    i === mod.demo.length - 1
                      ? `linear-gradient(to top, ${mod.accent}, ${mod.accent}cc)`
                      : i >= mod.demo.length - 3
                      ? `${mod.accent}55`
                      : `${mod.accent}1a`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center mt-1.5 flex-shrink-0">
            <p className="text-slate-600 text-[10px]">Tendencia · 12 meses</p>
            <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: mod.accent }}>
              <TrendingUp className="h-3 w-3" />
              Crecimiento
            </div>
          </div>
        </div>

        {/* Extra modules */}
        <div
          className="flex items-center gap-3 mt-5 flex-shrink-0"
          style={{ animation: 'mktFadeUp 0.6s ease-out both', animationDelay: '0.65s' }}
        >
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">
            Y más:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXTRA_MODULES.map(m => {
              const EIcon = m.icon
              return (
                <span
                  key={m.label}
                  className="flex items-center gap-1 px-2 py-1 rounded-full border text-slate-400 text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <EIcon className="h-2.5 w-2.5" />
                  {m.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Progress dots + trust badges */}
        <div
          className="flex items-center gap-2 mt-5 flex-shrink-0"
          style={{ animation: 'mktFadeUp 0.6s ease-out both', animationDelay: '0.75s' }}
        >
          {MODULES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => switchTo(idx)}
              className="h-[3px] rounded-full"
              style={{
                width: idx === active ? 24 : 6,
                background: idx === active ? mod.accent : 'rgba(255,255,255,0.14)',
                transition: 'width 0.3s, background 0.3s',
              }}
            />
          ))}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Certificado SAT
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              CFDI 4.0
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Lock className="h-3 w-3 text-emerald-500" />
              Cifrado
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}

// ─── Login / Register Form ───────────────────────────────────────────────────

function LoginForm() {
  const [isLogin, setIsLogin]         = useState(true)
  const [isLoading, setIsLoading]     = useState(false)
  const [clientError, setClientError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [personType, setPersonType]         = useState('moral')
  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  // Form entrance: CSS animation, no GSAP dependency

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setClientError('')

    const formData   = new FormData(e.currentTarget)
    const email      = (formData.get('email') as string).trim().toLowerCase()
    const password   = formData.get('password') as string

    if (!isLogin) {
      const confirmEmail = (formData.get('confirmEmail') as string).trim().toLowerCase()
      if (email !== confirmEmail) { setClientError('Los correos electrónicos no coinciden.'); return }
      if (password !== formData.get('confirmPassword')) { setClientError('Las contraseñas no coinciden.'); return }
      if (password.length < 8) { setClientError('La contraseña debe tener al menos 8 caracteres.'); return }
      if (!acceptTerms) { setClientError('Debes aceptar los Términos y Condiciones para continuar.'); return }
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setClientError(
            error.message === 'Invalid login credentials'
              ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
              : error.message === 'Email not confirmed'
                ? 'Tu correo no ha sido verificado. Revisa tu bandeja de entrada.'
                : error.message
          )
          setIsLoading(false)
          return
        }
        if (!loginData.session) {
          setClientError('Login exitoso pero no se generó sesión. Verifica la configuración de Supabase Auth.')
          setIsLoading(false)
          return
        }
        await new Promise(r => setTimeout(r, 200))
        window.location.href = '/'
      } else {
        const fullName = (formData.get('fullName') as string).trim()
        const rfc      = (formData.get('rfc') as string).trim().toUpperCase()
        const phone    = `${formData.get('phoneCode')}${formData.get('phone')}`
        const isSuperAdmin = email === '553angelortiz@gmail.com'

        const dupCheck = await checkSignupDuplicates({ email, rfc, fullName, personType })
        if (dupCheck.error) { setClientError(dupCheck.error); setIsLoading(false); return }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: fullName,
              person_type: personType,
              rfc,
              phone_number: phone,
              is_super_admin: isSuperAdmin,
            },
          },
        })

        if (authError) { setClientError(authError.message); setIsLoading(false); return }

        if (authData.user) {
          const syncRes = await syncUserWithPrisma(authData.user.id, { email, fullName, personType, rfc, phone })
          if (syncRes.error) { setClientError(syncRes.error); setIsLoading(false); return }
          if (authData.session) { router.push('/'); router.refresh() }
          else { router.push(`/auth/verify?email=${encodeURIComponent(email)}`) }
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setClientError('Ocurrió un error inesperado. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    const res = await getGoogleOAuthUrl()
    if (res?.url) window.location.href = res.url
    else { setClientError(res?.error || 'Error con Google'); setIsLoading(false) }
  }

  const inputCls = 'w-full bg-slate-100/60 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:focus:ring-blue-500/30 transition-all'
  const labelCls = 'block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider'

  const eyePath = (show: boolean) => show
    ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
    : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'

  function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
    return (
      <button type="button" onClick={toggle} tabIndex={-1}
        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={eyePath(show)} />
        </svg>
      </button>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div
        className="p-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/30 dark:border-neutral-700/40 rounded-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55)] my-8 transition-colors duration-300"
        style={{ animation: 'mktFadeUp 0.7s ease-out both', animationDelay: '0.1s' }}
      >

        {/* Logo — siempre modo día en login */}
        <div className="flex flex-col items-center mb-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="CIFRA" className="h-12 object-contain mb-4" />
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isLogin ? 'Iniciar Sesión' : 'Prueba Gratuita · 14 días'}
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {isLogin ? 'Accede a tu panel de control' : 'Sin tarjeta de crédito requerida'}
          </p>
        </div>

        {/* Error */}
        {clientError && (
          <div className="mb-5 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-center">
            {clientError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Registration-only fields */}
          {!isLogin && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Tipo de Persona</label>
                <div className="flex gap-4">
                  {['fisica', 'moral'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                      <input type="radio" name="personType" value={t} checked={personType === t}
                        onChange={() => setPersonType(t)} className="accent-blue-600" />
                      {t === 'fisica' ? 'Persona Física' : 'Persona Moral'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>{personType === 'moral' ? 'Razón Social' : 'Nombre Completo'}</label>
                <input name="fullName" type="text" required
                  placeholder={personType === 'moral' ? 'Ej. Empresa S.A. de C.V.' : 'Ej. Juan Pérez'}
                  className={`${inputCls} ${personType === 'moral' ? 'uppercase' : ''}`} />
                {personType === 'moral' && (
                  <p className="text-xs text-slate-400 mt-1">Exactamente como aparece en el SAT</p>
                )}
              </div>

              <div>
                <label className={labelCls}>RFC</label>
                <input name="rfc" type="text" required placeholder="XAXX010101000"
                  maxLength={13} className={`${inputCls} uppercase tracking-widest`} />
              </div>

              <div>
                <label className={labelCls}>Teléfono</label>
                <div className="flex gap-2">
                  <select name="phoneCode"
                    className="w-24 bg-slate-100/60 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                    <option value="+52">+52</option>
                    <option value="+1">+1</option>
                    <option value="+34">+34</option>
                    <option value="+57">+57</option>
                  </select>
                  <input name="phone" type="tel" required placeholder="123 456 7890"
                    className={`${inputCls} flex-1`} />
                </div>
              </div>
            </div>
          )}

          {/* Email + passwords */}
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Correo electrónico</label>
              <input name="email" type="email" required placeholder="usuario@empresa.com"
                autoComplete="email" className={inputCls} />
            </div>
            {!isLogin && (
              <div>
                <label className={labelCls}>Confirma tu correo</label>
                <input name="confirmEmail" type="email" required placeholder="usuario@empresa.com"
                  className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Contraseña</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required
                  placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className={`${inputCls} pr-10`} />
                <EyeBtn show={showPassword} toggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className={labelCls}>Confirma tu contraseña</label>
                <div className="relative">
                  <input name="confirmPassword" type={showConfirmPwd ? 'text' : 'password'} required
                    placeholder="••••••••" autoComplete="new-password" className={`${inputCls} pr-10`} />
                  <EyeBtn show={showConfirmPwd} toggle={() => setShowConfirmPwd(!showConfirmPwd)} />
                </div>
              </div>
            )}
          </div>

          {/* Terms (register only) */}
          {!isLogin && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)} className="sr-only" />
                <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                  acceptTerms
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 group-hover:border-blue-400'
                }`}>
                  {acceptTerms && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Acepto los{' '}
                <a href="/terminos" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Términos y Condiciones</a>
                {', '}el{' '}
                <a href="/privacidad" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Aviso de Privacidad</a>
                {' '}y la{' '}
                <a href="/cookies" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Política de Cookies</a>
                {' '}de CIFRA.
              </span>
            </label>
          )}

          {/* Submit */}
          <div className="pt-1">
            <button type="submit" disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl p-3.5 text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all duration-200 active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-50 shadow-md hover:shadow-lg">
              {isLoading
                ? <div className="h-5 w-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                : isLogin ? 'ENTRAR' : 'Comenzar Prueba Gratuita'}
            </button>
            {isLogin && (
              <div className="mt-3 text-center">
                <a href="/recuperar" className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}
          </div>
        </form>

        {/* Google + toggle */}
        <div>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 bg-white/80 dark:bg-neutral-900/80 text-slate-400 font-medium tracking-wider">
                o continúa con
              </span>
            </div>
          </div>

          <button type="button" onClick={handleGoogleAuth} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl p-3.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all active:scale-[0.98] mb-5 disabled:opacity-50 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <button type="button"
            onClick={() => { setIsLogin(!isLogin); setClientError(''); setAcceptTerms(false) }}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
            {isLogin ? '¿No tienes cuenta? Regístrate aquí →' : '¿Ya tienes una cuenta? Inicia Sesión →'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex font-sans">
      {/* Shared keyframes for form side too */}
      <style>{PANEL_STYLES}</style>
      <MarketingPanel />

      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white selection:bg-blue-500/30 overflow-y-auto py-10 transition-colors duration-300 relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden lg:hidden" aria-hidden>
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400/6 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-400/6 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <Suspense fallback={
          <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
