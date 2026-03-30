'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { syncUserWithPrisma, getGoogleOAuthUrl, checkSignupDuplicates } from './actions'
import { useRouter } from 'next/navigation'
import {
  FileText, BarChart3, Users, ShoppingCart,
  Brain, Shield, CheckCircle2, TrendingUp,
} from 'lucide-react'

// ─── Panel de Marketing (izquierdo) ──────────────────────────────────────────

function MarketingPanel() {
  const features = [
    { icon: FileText,    label: 'Facturación CFDI 4.0',       sub: 'Timbrado real ante el SAT' },
    { icon: BarChart3,   label: 'Contabilidad automática',    sub: 'Balanza, pólizas y flujo' },
    { icon: Users,       label: 'Nómina ISR / IMSS 2026',     sub: 'Cálculo preciso y cumplimiento' },
    { icon: ShoppingCart,label: 'POS + CRM integrado',        sub: 'Ventas, clientes y pipeline' },
    { icon: Brain,       label: 'CIFRA AI Copilot',           sub: 'Asistente fiscal inteligente' },
    { icon: Shield,      label: 'Seguridad empresarial',      sub: 'Multitenancy y roles RBAC' },
  ]

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[58%] bg-[#060f1e] relative overflow-hidden p-12 select-none">
      {/* Orbes decorativos */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div className="mb-10 relative z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.png"
          alt="CIFRA"
          className="h-11 object-contain object-left rounded-xl"
        />
      </div>

      {/* Headline */}
      <div className="relative z-10 mb-8">
        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
          ERP Fiscal para México
        </p>
        <h2 className="text-4xl font-black text-white leading-tight mb-4">
          Finanzas bajo<br />
          <span className="text-blue-400">control total.</span>
        </h2>
        <p className="text-slate-400 text-base leading-relaxed max-w-sm">
          CFDI 4.0 · SAT · IMSS · Contabilidad · Nómina · CRM. Todo integrado, todo en México.
        </p>
      </div>

      {/* Mock Dashboard */}
      <div className="relative z-10 rounded-2xl bg-slate-900/70 border border-slate-800/60 backdrop-blur p-5 mb-8 shadow-xl">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { label: 'Ingresos / mes',  value: '$425K',  badge: '↑ 12.4%', color: 'text-emerald-400' },
            { label: 'CFDIs emitidos',  value: '1,847',  badge: '↑ 8.2%',  color: 'text-emerald-400' },
            { label: 'Nómina',          value: '$89K',   badge: '24 emp.',  color: 'text-blue-400'    },
          ].map(m => (
            <div key={m.label} className="bg-slate-800/80 rounded-xl p-3">
              <p className="text-slate-500 text-[10px] mb-1 truncate">{m.label}</p>
              <p className="text-white font-black text-lg leading-none">{m.value}</p>
              <p className={`${m.color} text-[10px] mt-1 font-semibold`}>{m.badge}</p>
            </div>
          ))}
        </div>

        {/* Gráfica de barras (CSS art) */}
        <div className="flex items-end gap-1 h-14 mb-2">
          {[35, 52, 41, 68, 48, 75, 58, 82, 63, 88, 71, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${h}%`,
                background: i === 11
                  ? 'linear-gradient(to top, #1d4ed8, #60a5fa)'
                  : i >= 9
                  ? 'rgba(96,165,250,0.6)'
                  : 'rgba(96,165,250,0.25)',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-slate-600 text-[10px]">Flujo de efectivo · últimos 12 meses</p>
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
            <TrendingUp className="h-3 w-3" />
            Record este mes
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5">
        {features.map(f => {
          const Icon = f.icon
          return (
            <div key={f.label} className="flex items-start gap-2.5 bg-slate-900/40 rounded-xl p-3 border border-slate-800/40">
              <div className="h-7 w-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-bold truncate">{f.label}</p>
                <p className="text-slate-500 text-[10px] truncate">{f.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust bar */}
      <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/60 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Certificado SAT
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          CFDI 4.0 válido
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Datos cifrados
        </div>
      </div>
    </aside>
  )
}

// ─── Formulario de Login / Registro ──────────────────────────────────────────

function LoginForm() {
  const [isLogin, setIsLogin]         = useState(true)
  const [isLoading, setIsLoading]     = useState(false)
  const [clientError, setClientError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [personType, setPersonType]           = useState('moral')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false)

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

        // ── Verificar duplicados antes de crear en Supabase ──────────────
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

  const inputCls  = 'w-full bg-slate-100/60 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 transition-shadow'
  const labelCls  = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider'
  const eyePath   = (show: boolean) => show
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
    <div className="w-full max-w-md opacity-0 animate-fade-up">
      <div className="p-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/30 dark:border-neutral-700/40 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] my-8 transition-colors duration-300">

        {/* Logo — imagen real, día/noche */}
        <div className="flex flex-col items-center mb-7 opacity-0 animate-scale-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="CIFRA" className="h-11 object-contain rounded-2xl mb-4 block dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png"  alt="CIFRA" className="h-11 object-contain rounded-2xl mb-4 hidden dark:block" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isLogin ? 'Iniciar Sesión' : 'Prueba Gratuita · 14 días'}
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {isLogin ? 'Accede a tu panel de control' : 'Sin tarjeta de crédito requerida'}
          </p>
        </div>

        {/* Error */}
        {clientError && (
          <div className="mb-5 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-center animate-slide-down">
            {clientError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* ── Campos exclusivos de registro ───────────────────────── */}
          {!isLogin && (
            <div className="space-y-4 opacity-0 animate-fade-up-1">

              {/* Tipo de persona */}
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

              {/* Nombre / Razón Social */}
              <div>
                <label className={labelCls}>{personType === 'moral' ? 'Razón Social' : 'Nombre Completo'}</label>
                <input name="fullName" type="text" required
                  placeholder={personType === 'moral' ? 'Ej. Empresa S.A. de C.V.' : 'Ej. Juan Pérez'}
                  className={`${inputCls} ${personType === 'moral' ? 'uppercase' : ''}`} />
                {personType === 'moral' && (
                  <p className="text-xs text-slate-400 mt-1">Exactamente como aparece en el SAT</p>
                )}
              </div>

              {/* RFC */}
              <div>
                <label className={labelCls}>RFC</label>
                <input name="rfc" type="text" required placeholder="XAXX010101000"
                  maxLength={13} className={`${inputCls} uppercase tracking-widest`} />
              </div>

              {/* Teléfono */}
              <div>
                <label className={labelCls}>Teléfono</label>
                <div className="flex gap-2">
                  <select name="phoneCode"
                    className="w-24 bg-slate-100/60 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
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

          {/* ── Email + contraseñas ──────────────────────────────────── */}
          <div className={`space-y-4 opacity-0 ${isLogin ? 'animate-fade-up-1' : 'animate-fade-up-2'}`}>
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

          {/* ── Aceptar Términos (solo registro) ────────────────────── */}
          {!isLogin && (
            <div className={`opacity-0 animate-fade-up-3`}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="sr-only"
                  />
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
                  <a href="/terminos" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Términos y Condiciones
                  </a>
                  {', '}el{' '}
                  <a href="/privacidad" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Aviso de Privacidad
                  </a>
                  {' '}y la{' '}
                  <a href="/cookies" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Política de Cookies
                  </a>
                  {' '}de CIFRA.
                </span>
              </label>
            </div>
          )}

          {/* ── Botón submit ─────────────────────────────────────────── */}
          <div className={`opacity-0 pt-1 ${isLogin ? 'animate-fade-up-2' : 'animate-fade-up-4'}`}>
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

        {/* ── Google + toggle ──────────────────────────────────────────── */}
        <div className={`opacity-0 ${isLogin ? 'animate-fade-up-3' : 'animate-fade-up-5'}`}>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 bg-white/80 dark:bg-neutral-900/80 text-slate-400 font-medium">
                acceso con
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

          <button type="button" onClick={() => { setIsLogin(!isLogin); setClientError(''); setAcceptTerms(false) }}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
            {isLogin ? '¿No tienes cuenta? Regístrate aquí →' : '¿Ya tienes una cuenta? Inicia Sesión →'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Página raíz ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex font-sans">

      {/* Columna izquierda: Panel de marketing */}
      <MarketingPanel />

      {/* Columna derecha: Formulario */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white selection:bg-blue-500/30 overflow-y-auto py-10 transition-colors duration-300 relative">
        {/* Orbes decorativos sutiles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden lg:hidden" aria-hidden>
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400/8 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-400/8 dark:bg-indigo-500/5 rounded-full blur-3xl" />
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
