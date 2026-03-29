'use client'

import { useState, useRef, Suspense, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'

function VerifyForm() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  // Cuenta regresiva para reenviar
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const code = digits.join('')

  const handleChange = (index: number, value: string) => {
    // Pegar código completo
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setDigits(value.split(''))
      refs.current[5]?.focus()
      return
    }
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
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
    setIsLoading(true)
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
      setIsLoading(false)
    } else {
      setSuccess(true)
      setMessage('¡Cuenta verificada! Entrando a CIFRA...')
      setTimeout(() => { window.location.href = '/' }, 1800)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (!error) {
      setMessage('Código reenviado. Revisa tu correo.')
      setCountdown(60)
    } else {
      setMessage('Error al reenviar. Intenta más tarde.')
    }
  }

  return (
    <div className="w-full max-w-sm opacity-0 animate-fade-up">
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/30 dark:border-neutral-700/40 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] p-8 text-center transition-colors duration-300">

        {/* Isologo */}
        <div className="flex justify-center mb-6 opacity-0 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center bg-white dark:bg-neutral-800">
            <img src="/isologo-dark.png" alt="CIFRA" className="w-10 h-10 object-contain dark:hidden" />
            <img src="/isologo-white.png" alt="CIFRA" className="w-10 h-10 object-contain hidden dark:block" />
          </div>
        </div>

        <div className="opacity-0 animate-fade-up-1">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Verifica tu cuenta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Enviamos un código de <strong className="text-slate-700 dark:text-slate-300">6 dígitos</strong> a<br />
            <span className="font-medium text-slate-800 dark:text-slate-200">{email}</span>
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`mt-5 p-3 text-sm rounded-xl border animate-slide-down ${
            success
              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
              : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
          }`}>
            {success && <span className="mr-1">✓</span>}
            {message}
          </div>
        )}

        {/* ── 6 cajas de dígitos ── */}
        <form onSubmit={handleVerify} className="mt-7 opacity-0 animate-fade-up-2">
          <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
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
                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-150 outline-none
                  ${d
                    ? 'border-slate-900 dark:border-emerald-500 bg-slate-900 dark:bg-emerald-500/10 text-white dark:text-emerald-400'
                    : 'border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white'
                  }
                  focus:border-slate-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-emerald-500/20
                  disabled:opacity-40`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || success || code.length < 6}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl p-3.5 text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-40 shadow-md hover:shadow-lg"
          >
            {isLoading
              ? <div className="h-5 w-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              : success ? '✓ Verificado' : 'Verificar Cuenta'}
          </button>
        </form>

        {/* Reenviar + regresar */}
        <div className="mt-6 opacity-0 animate-fade-up-3 space-y-3">
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="w-full text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors disabled:opacity-40"
          >
            {resending
              ? 'Reenviando...'
              : countdown > 0
                ? `Reenviar código en ${countdown}s`
                : '¿No recibiste el correo? Reenviar código'}
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            ← Regresar al inicio de sesión
          </button>
        </div>

      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 font-sans text-slate-900 dark:text-white py-10 transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
