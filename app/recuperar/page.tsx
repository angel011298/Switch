'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react'

export default function RecuperarPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('53angelortiz@gmail.com')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="mb-8">
          <img src="/logo-dark.png" alt="CIFRA" className="h-12 w-auto object-contain hidden dark:block" />
          <img src="/logo-light.png" alt="CIFRA" className="h-12 w-auto object-contain block dark:hidden" />
        </div>

        <h2 className="text-center text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
          Recuperar contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium">
          Te enviaremos un enlace para restablecer tu acceso.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-900 py-8 px-4 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-neutral-200 dark:border-neutral-800">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-500 text-sm font-bold">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                Si el correo existe, te llegará un enlace para restablecer la contraseña.
              </div>
              <Link
                href="/login"
                className="w-full inline-flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-black text-white dark:text-black bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="admin@tuempresa.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-black text-white dark:text-black bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar enlace'}
              </button>

              <Link
                href="/login"
                className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-2xl text-sm font-black text-neutral-900 dark:text-white bg-transparent border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

