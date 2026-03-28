'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { AlertCircle, Loader2, Lock, ArrowLeft } from 'lucide-react'

export default function RestablecerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  useEffect(() => {
    async function ensureSession() {
      // Para recovery, Supabase suele enviar tokens en el hash (#access_token=...).
      // Los leemos aquí (client-side) y creamos sesión.
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace(/^#/, '')
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        const errorDesc = params.get('error_description') || params.get('error')

        if (errorDesc) {
          setError(decodeURIComponent(errorDesc))
          router.replace('/login?message=No%20se%20pudo%20validar%20el%20enlace.%20Intenta%20de%20nuevo.')
          return
        }

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) {
            setError(error.message)
            router.replace('/login?message=No%20se%20pudo%20validar%20el%20enlace.%20Intenta%20de%20nuevo.')
            return
          }

          // Limpia el hash para evitar exponer tokens al copiar URL.
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login?message=Tu%20enlace%20ya%20expir%C3%B3%20o%20no%20es%20v%C3%A1lido')
        return
      }

      setLoading(false)
    }
    ensureSession()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/login?message=Contrase%C3%B1a%20actualizada.%20Inicia%20sesi%C3%B3n%20de%20nuevo.')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="mb-8">
          <img src="/logo-dark.png" alt="CIFRA" className="h-12 w-auto object-contain hidden dark:block" />
          <img src="/logo-light.png" alt="CIFRA" className="h-12 w-auto object-contain block dark:hidden" />
        </div>

        <h2 className="text-center text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
          Restablecer contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium">
          Define una nueva contraseña para tu cuenta.
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-black text-white dark:text-black bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar nueva contraseña'}
            </button>

            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-2xl text-sm font-black text-neutral-900 dark:text-white bg-transparent border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}

