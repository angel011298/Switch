'use client'

import { useState, useRef, Suspense, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Mail, MessageCircle, Link2, CheckCircle2, ArrowLeft, Smartphone } from 'lucide-react'

type Method = 'email-otp' | 'email-link' | 'whatsapp'

// ── Shared styles ────────────────────────────────────────────────────────────
const cardCls = 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/30 dark:border-neutral-700/40 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] p-8 transition-colors duration-300'

// ── SVG Logo ─────────────────────────────────────────────────────────────────
function LogoCifra() {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/25">
          <span className="text-xl font-black text-white leading-none select-none">Δ</span>
        </div>
        <span className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight">CIFRA</span>
      </div>
    </div>
  )
}

// ── Method Selection ──────────────────────────────────────────────────────────
function MethodSelector({ email, onSelect }: { email: string; onSelect: (m: Method) => void }) {
  const methods: { id: Method; icon: React.ElementType; label: string; sub: string; badge?: string }[] = [
    {
      id: 'email-otp',
      icon: Mail,
      label: 'Código por correo',
      sub: 'Te enviamos un código de 6 dígitos a tu email.',
      badge: 'Recomendado',
    },
    {
      id: 'email-link',
      icon: Link2,
      label: 'Link de verificación',
      sub: 'Recibe un enlace directo en tu correo para activar tu cuenta.',
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'Código por WhatsApp',
      sub: 'Recibe un código de 6 dígitos en tu número de WhatsApp.',
    },
  ]

  return (
    <div className={`${cardCls} w-full max-w-sm text-center`}>
      <LogoCifra />
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
        Verifica tu cuenta
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        ¿Cómo quieres verificar{' '}
        <span className="font-medium text-slate-700 dark:text-slate-300 break-all">{email}</span>?
      </p>

      <div className="space-y-3">
        {methods.map(({ id, icon: Icon, label, sub, badge }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-slate-50/80 dark:bg-neutral-800/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:border-blue-300 transition-colors">
              <Icon className="h-4.5 w-4.5 text-slate-500 dark:text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                {badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
            </div>
            <svg className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <button
        onClick={() => { window.location.href = '/login' }}
        className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mx-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Regresar al inicio de sesión
      </button>
    </div>
  )
}

// ── Email OTP ─────────────────────────────────────────────────────────────────
function EmailOtpFlow({ email, onBack }: { email: string; onBack: () => void }) {
  const [digits, setDigits]     = useState<string[]>(Array(6).fill(''))
  const [isLoading, setLoading] = useState(false)
  const [message, setMessage]   = useState('')
  const [success, setSuccess]   = useState(false)
  const [resending, setResend]  = useState(false)
  const [countdown, setCountdown] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const code = digits.join('')

  const handleChange = (index: number, value: string) => {
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setDigits(value.split(''))
      refs.current[5]?.focus()
      return
    }
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (code.length < 6) { setMessage('Ingresa los 6 dígitos del código.'); return }
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })

    if (error) {
      setMessage(
        error.message.includes('expired') || error.message.includes('invalid')
          ? 'Código incorrecto o expirado. Solicita uno nuevo.'
          : `Error: ${error.message}`
      )
      setDigits(Array(6).fill(''))
      refs.current[0]?.focus()
      setLoading(false)
    } else {
      setSuccess(true)
      setMessage('¡Cuenta verificada! Entrando a CIFRA...')
      setTimeout(() => { window.location.href = '/' }, 1800)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    setResend(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResend(false)
    if (!error) { setMessage('Código reenviado. Revisa tu correo.'); setCountdown(60) }
    else { setMessage('Error al reenviar. Intenta más tarde.') }
  }

  return (
    <div className={`${cardCls} w-full max-w-sm text-center`}>
      <LogoCifra />
      <div className="mb-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-6 w-6 text-blue-500" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Revisa tu correo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Enviamos un código de <strong className="text-slate-700 dark:text-slate-300">6 dígitos</strong> a<br />
          <span className="font-medium text-slate-800 dark:text-slate-200 break-all">{email}</span>
        </p>
      </div>

      {message && (
        <div className={`mt-4 p-3 text-sm rounded-xl border ${
          success
            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
            : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
        }`}>
          {success && <span className="mr-1">✓</span>}{message}
        </div>
      )}

      <form onSubmit={handleVerify} className="mt-7">
        <div className="flex justify-center gap-1.5 mb-6" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={isLoading || success}
              className={`w-9 h-12 text-center text-lg font-bold rounded-xl border-2 transition-all outline-none
                ${d
                  ? 'border-slate-900 dark:border-emerald-500 bg-slate-900 dark:bg-emerald-500/10 text-white dark:text-emerald-400'
                  : 'border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white'
                }
                focus:border-slate-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-emerald-500/20 disabled:opacity-40`}
            />
          ))}
        </div>
        <button type="submit" disabled={isLoading || success || code.length < 6}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl p-3.5 text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-40 shadow-md">
          {isLoading
            ? <div className="h-5 w-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
            : success ? '✓ Verificado' : 'Verificar Cuenta'}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        <button onClick={handleResend} disabled={resending || countdown > 0}
          className="w-full text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors disabled:opacity-40">
          {resending ? 'Reenviando...'
            : countdown > 0 ? `Reenviar en ${countdown}s`
            : '¿No recibiste el código? Reenviar'}
        </button>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mx-auto">
          <ArrowLeft className="h-3.5 w-3.5" /> Cambiar método
        </button>
      </div>
    </div>
  )
}

// ── Email Link ────────────────────────────────────────────────────────────────
function EmailLinkFlow({ email, onBack }: { email: string; onBack: () => void }) {
  const [resending, setResend] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0) return
    setResend(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResend(false)
    if (!error) { setMsg('Link reenviado. Revisa tu correo.'); setCountdown(60) }
    else { setMsg('Error al reenviar. Intenta más tarde.') }
  }

  return (
    <div className={`${cardCls} w-full max-w-sm text-center`}>
      <LogoCifra />
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
        <Link2 className="h-7 w-7 text-indigo-500" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        Revisa tu correo
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
        Enviamos un <strong className="text-slate-700 dark:text-slate-300">link de verificación</strong> a
      </p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all mb-6">{email}</p>

      <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 text-left mb-6">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Pasos:</p>
        {['Abre tu correo electrónico', 'Busca el mensaje de CIFRA', 'Haz clic en "Confirmar mi cuenta"'].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5 mb-1.5 last:mb-0">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400">{step}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className="mb-4 p-3 text-sm rounded-xl text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
          {msg}
        </div>
      )}

      <button onClick={handleResend} disabled={resending || countdown > 0}
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl p-3.5 text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all active:scale-[0.98] h-12 disabled:opacity-40 shadow-md">
        {resending ? 'Enviando...'
          : countdown > 0 ? `Reenviar en ${countdown}s`
          : '¿No llegó el correo? Reenviar link'}
      </button>

      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mx-auto mt-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Cambiar método
      </button>
    </div>
  )
}

// ── WhatsApp OTP ──────────────────────────────────────────────────────────────
function WhatsAppFlow({ email, onBack }: { email: string; onBack: () => void }) {
  const [step, setStep]         = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone]       = useState('')
  const [digits, setDigits]     = useState<string[]>(Array(6).fill(''))
  const [isLoading, setLoading] = useState(false)
  const [message, setMessage]   = useState('')
  const [success, setSuccess]   = useState(false)
  const [countdown, setCountdown] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const code = digits.join('')

  const sendCode = async () => {
    if (!phone || phone.length < 8) { setMessage('Ingresa un número de WhatsApp válido.'); return }
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/auth/whatsapp-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: `+52${phone.replace(/\D/g, '')}`, email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setMessage(data.error || 'Error al enviar el código.'); return }
    setStep('otp')
    setCountdown(60)
    setMessage('')
  }

  const verifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (code.length < 6) { setMessage('Ingresa los 6 dígitos.'); return }
    setLoading(true)
    setMessage('')

    // Verify WhatsApp OTP
    const waRes  = await fetch('/api/auth/whatsapp-otp', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const waData = await waRes.json()

    if (!waRes.ok) {
      setMessage(waData.error || 'Código incorrecto.')
      setDigits(Array(6).fill(''))
      refs.current[0]?.focus()
      setLoading(false)
      return
    }

    // El servidor genera un magic link con el service role key de Supabase,
    // que confirma el email y establece la sesión en un solo paso.
    if (waData.magicLink) {
      setSuccess(true)
      setMessage('¡WhatsApp verificado! Entrando a CIFRA...')
      setTimeout(() => { window.location.href = waData.magicLink }, 1500)
    } else {
      setSuccess(true)
      setMessage('¡Verificado! Redirigiendo...')
      setTimeout(() => { window.location.href = '/' }, 2000)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setDigits(value.split(''))
      refs.current[5]?.focus()
      return
    }
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
  }

  return (
    <div className={`${cardCls} w-full max-w-sm text-center`}>
      <LogoCifra />
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="h-6 w-6 text-emerald-500" />
      </div>

      {step === 'phone' ? (
        <>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Verificación por WhatsApp
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Ingresa tu número de WhatsApp para recibir el código.
          </p>

          {message && (
            <div className="mb-4 p-3 text-sm rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
              {message}
            </div>
          )}

          <div className="text-left mb-4">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Número de WhatsApp
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-3 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                <Smartphone className="h-4 w-4" />
                +52
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setMessage('') }}
                placeholder="55 1234 5678"
                className="flex-1 bg-slate-100/60 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
              />
            </div>
          </div>

          <button onClick={sendCode} disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl p-3.5 text-sm transition-all active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-50 shadow-md">
            {isLoading
              ? <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : 'Enviar código por WhatsApp'}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
            Código de WhatsApp
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Ingresa el código de 6 dígitos enviado a WhatsApp{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">+52 {phone}</span>
          </p>

          {message && (
            <div className={`mb-4 p-3 text-sm rounded-xl border ${
              success
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
            }`}>
              {success && <span className="mr-1">✓</span>}{message}
            </div>
          )}

          <form onSubmit={verifyCode} className="mt-2">
            <div className="flex justify-center gap-1.5 mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={isLoading || success}
                  className={`w-9 h-12 text-center text-lg font-bold rounded-xl border-2 transition-all outline-none
                    ${d
                      ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white'
                    }
                    focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-40`}
                />
              ))}
            </div>
            <button type="submit" disabled={isLoading || success || code.length < 6}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl p-3.5 text-sm transition-all active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-40 shadow-md">
              {isLoading
                ? <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : success ? '✓ Verificado' : 'Verificar'}
            </button>
          </form>

          <button
            onClick={() => {
              if (countdown > 0) return
              setStep('phone')
              setDigits(Array(6).fill(''))
              setMessage('')
            }}
            disabled={countdown > 0}
            className="mt-4 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
          >
            {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
          </button>
        </>
      )}

      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mx-auto mt-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Cambiar método
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function VerifyForm() {
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''
  const [method, setMethod] = useState<Method | null>(null)

  return (
    <div className="w-full max-w-sm">
      {!method && (
        <MethodSelector email={email} onSelect={setMethod} />
      )}
      {method === 'email-otp' && (
        <EmailOtpFlow email={email} onBack={() => setMethod(null)} />
      )}
      {method === 'email-link' && (
        <EmailLinkFlow email={email} onBack={() => setMethod(null)} />
      )}
      {method === 'whatsapp' && (
        <WhatsAppFlow email={email} onBack={() => setMethod(null)} />
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 font-sans text-slate-900 dark:text-white py-10 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400/8 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-emerald-400/8 dark:bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
