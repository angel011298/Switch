'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { syncUserWithPrisma, getGoogleOAuthUrl } from './actions'
import { useRouter } from 'next/navigation'

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [clientError, setClientError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [personType, setPersonType] = useState('moral')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setClientError('')

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string).trim().toLowerCase()
    const password = formData.get('password') as string

    if (!isLogin) {
      const confirmEmail = (formData.get('confirmEmail') as string).trim().toLowerCase()
      if (email !== confirmEmail) {
        setClientError('Los correos electrónicos no coinciden.')
        return
      }
      if (password !== formData.get('confirmPassword')) {
        setClientError('Las contraseñas no coinciden.')
        return
      }
      if (password.length < 8) {
        setClientError('La contraseña debe tener al menos 8 caracteres.')
        return
      }
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        // ── LOGIN: Client-side para inyección nativa de cookie ──
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

        // Debug: verificar que la sesión se haya creado
        console.log('[login] signIn OK | session:', loginData.session ? 'EXISTS' : 'NULL')
        console.log('[login] cookies:', document.cookie)

        if (!loginData.session) {
          setClientError('Login exitoso pero no se generó sesión. Verifica la configuración de Supabase Auth.')
          setIsLoading(false)
          return
        }

        // Esperar un momento para que las cookies se escriban
        await new Promise(resolve => setTimeout(resolve, 200))

        console.log('[login] cookies after wait:', document.cookie)

        // Navegar al dashboard
        window.location.href = '/'
      } else {
        // ── SIGNUP: Client-side + Server Action para Prisma ──
        const fullName = (formData.get('fullName') as string).trim()
        const rfc = (formData.get('rfc') as string).trim().toUpperCase()
        const phone = `${formData.get('phoneCode')}${formData.get('phone')}`
        const age = formData.get('age') ? parseInt(formData.get('age') as string) : null
        const gender = formData.get('gender') as string

        const isSuperAdmin = email === '553angelortiz@gmail.com'

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
              age,
              gender,
              is_super_admin: isSuperAdmin,
            },
          },
        })

        if (authError) {
          setClientError(authError.message)
          setIsLoading(false)
          return
        }

        if (authData.user) {
          // Sync con Prisma vía Server Action
          const syncRes = await syncUserWithPrisma(authData.user.id, {
            email,
            fullName,
            personType,
            rfc,
            phone,
            age,
            gender,
          })

          if (syncRes.error) {
            setClientError(syncRes.error)
            setIsLoading(false)
            return
          }

          if (authData.session) {
            // Auto-confirmado → ir al dashboard
            router.push('/')
            router.refresh()
          } else {
            // Requiere verificación OTP por email
            router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
          }
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
    if (res?.url) {
      window.location.href = res.url
    } else {
      setClientError(res?.error || 'Error con Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/20 dark:border-neutral-700/30 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 my-8">
      <div className="text-center space-y-3 mb-8">
        <div className="mx-auto h-16 w-auto flex items-center justify-center mb-6">
          <img src="/logo-light.png" alt="CIFRA" className="max-h-full max-w-full object-contain dark:hidden" />
          <img src="/logo-dark.png" alt="CIFRA" className="max-h-full max-w-full object-contain hidden dark:block" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {isLogin ? 'Iniciar Sesión' : 'Prueba Gratuita (14 días)'}
        </h1>
      </div>

      {clientError && (
        <div className="mb-6 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-center">
          {clientError}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="space-y-5">
            {/* Tipo de Persona */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Tipo de Persona</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="radio" name="personType" value="fisica" checked={personType === 'fisica'} onChange={() => setPersonType('fisica')} className="accent-slate-900 dark:accent-emerald-500" />
                  Física
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="radio" name="personType" value="moral" checked={personType === 'moral'} onChange={() => setPersonType('moral')} className="accent-slate-900 dark:accent-emerald-500" />
                  Moral
                </label>
              </div>
            </div>

            {/* Nombre / Razón Social */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                {personType === 'moral' ? 'Razón Social' : 'Nombre Completo'}
              </label>
              <input name="fullName" type="text" required placeholder={personType === 'moral' ? 'Ej. Empresa S.A. de C.V.' : 'Ej. Juan Pérez'} className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 focus:border-slate-400 dark:focus:border-emerald-500" />
            </div>

            {/* RFC */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">RFC</label>
              <input name="rfc" type="text" required placeholder="Ingrese su RFC" maxLength={13} className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 focus:border-slate-400 dark:focus:border-emerald-500 uppercase" />
            </div>

            {/* Edad & Género (solo persona física) */}
            {personType === 'fisica' && (
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Edad</label>
                  <input name="age" type="number" min="18" max="100" placeholder="Años" className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30" />
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Género</label>
                  <select name="gender" className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30">
                    <option value="">Selecciona...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            )}

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Teléfono</label>
              <div className="flex gap-2">
                <select name="phoneCode" className="w-24 bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30">
                  <option value="+52">+52</option>
                  <option value="+1">+1</option>
                  <option value="+34">+34</option>
                  <option value="+57">+57</option>
                  <option value="+54">+54</option>
                </select>
                <input name="phone" type="tel" required placeholder="123 456 7890" className="flex-1 bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30" />
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Correo electrónico</label>
            <input name="email" type="email" required placeholder="usuario@empresa.com" autoComplete="email" className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 focus:border-slate-400 dark:focus:border-emerald-500" />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Confirma tu correo electrónico</label>
              <input name="confirmEmail" type="email" required placeholder="usuario@empresa.com" className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 focus:border-slate-400 dark:focus:border-emerald-500" />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none" tabIndex={-1}>
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Confirma tu contraseña</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••" autoComplete="new-password" className="w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none" tabIndex={-1}>
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-medium rounded-xl p-3.5 text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-50">
          {isLoading ? <div className="h-5 w-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" /> : isLogin ? 'ENTRAR' : 'Comenzar Prueba Gratuita'}
        </button>
      </form>

      {isLogin && (
        <div className="mt-3 text-center">
          <a href="/recuperar" className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-neutral-700"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="px-4 bg-white/70 dark:bg-neutral-900/70 text-slate-400 font-medium">accedo con</span></div>
      </div>

      <button type="button" onClick={handleGoogleAuth} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl p-3.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all active:scale-[0.98] mb-6 disabled:opacity-50">
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google
      </button>

      <button type="button" onClick={() => { setIsLogin(!isLogin); setClientError('') }} className="w-full text-center text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
        {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes una cuenta? Inicia Sesión'}
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 font-sans text-slate-900 dark:text-white selection:bg-emerald-500/30 overflow-y-auto py-10 transition-colors">
      <Suspense fallback={<div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
