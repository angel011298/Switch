'use client'

/**
 * Root page — maneja el callback de confirmación de email de Supabase (PKCE).
 *
 * Supabase redirige aquí con /?code=... cuando el Site URL del proyecto
 * está configurado como la raíz del dominio. Esta página intercambia el
 * código por una sesión y redirige al dashboard.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Suspense } from 'react'

function AuthCodeHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  useEffect(() => {
    async function exchange() {
      const supabase = createClient()

      try {
        if (code) {
          // PKCE flow — delegate to the server Route Handler so ensurePrismaUser
          // and the onboarding DB check always run regardless of how the user arrived.
          window.location.href = `/auth/callback?code=${encodeURIComponent(code)}`
          return
        } else if (tokenHash && type) {
          // OTP token hash flow (email confirmation, magic link)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          })
          if (error) throw error
        } else {
          // Sin params de auth → redirigir al dashboard (sesión existente)
          window.location.href = '/dashboard'
          return
        }

        setStatus('success')
        setTimeout(() => { window.location.href = '/dashboard' }, 1200)
      } catch (err) {
        console.error('[auth callback]', err)
        setStatus('error')
        setTimeout(() => { window.location.href = '/login?error=confirmation' }, 2500)
      }
    }

    exchange()
  }, [code, tokenHash, type])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 transition-colors">
      <div className="text-center space-y-4 animate-fade-up opacity-0">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center bg-white dark:bg-neutral-800">
            <img src="/isologo-dark.png" alt="CIFRA" className="w-10 h-10 object-contain dark:hidden" />
            <img src="/isologo-white.png" alt="CIFRA" className="w-10 h-10 object-contain hidden dark:block" />
          </div>
        </div>

        {status === 'loading' && (
          <>
            <div className="h-8 w-8 border-3 border-slate-200 border-t-slate-900 dark:border-neutral-700 dark:border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Verificando tu cuenta...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">¡Cuenta verificada! Entrando a CIFRA...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-rose-600 dark:text-rose-400">Enlace inválido o expirado. Redirigiendo al login...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function RootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    }>
      <AuthCodeHandler />
    </Suspense>
  )
}
