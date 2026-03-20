'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'

function VerifyForm() {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      email: email!,
      token: otp,
      type: 'email', // O 'sms' según corresponda
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="w-full max-w-md p-10 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
      <h1 className="text-2xl font-semibold mb-4 text-slate-900">Verifica tu cuenta</h1>
      <p className="text-sm text-slate-500 mb-8">
        Hemos enviado un código de 6 dígitos a <span className="font-semibold">{email}</span>.
        Ingrésalo a continuación para continuar.
      </p>

      {message && (
        <div className={`mb-6 p-3 text-sm rounded-xl border ${message.includes('Error') ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="000000"
          className="w-full text-center text-3xl tracking-[1rem] bg-slate-100/50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-900 text-white font-medium rounded-xl p-3.5 text-sm hover:bg-slate-800 transition-all active:scale-[0.98] flex justify-center items-center h-12"
        >
          {isLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verificar Cuenta'}
        </button>
      </form>

      <button
        onClick={() => window.location.href = '/login'}
        className="mt-6 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
      >
        Regresar al Inicio de Sesión
      </button>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900 py-10">
      <Suspense fallback={<div>Cargando...</div>}>
         <VerifyForm />
      </Suspense>
    </div>
  )
}
