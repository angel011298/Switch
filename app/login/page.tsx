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
      if (email !== confirmEmail) { setClientError('Los correos electrónicos no coinciden.'); return }
      if (password !== formData.get('confirmPassword')) { setClientError('Las contraseñas no coinciden.'); return }
      if (password.length < 8) { setClientError('La contraseña debe tener al menos 8 caracteres.'); return }
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
            data: { full_name: fullName, person_type: personType, rfc, phone_number: phone, age, gender, is_super_admin: isSuperAdmin },
          },
        })

        if (authError) { setClientError(authError.message); setIsLoading(false); return }

        if (authData.user) {
          const syncRes = await syncUserWithPrisma(authData.user.id, { email, fullName, personType, rfc, phone, age, gender })
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

  const inputCls = 'w-full bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30 transition-shadow'
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider'

  return (
    <div className="w-full max-w-md opacity-0 animate-fade-up">
      <div className="p-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/30 dark:border-neutral-700/40 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] my-8 transition-colors duration-300">

        {/* ── Isologo con esquinas redondeadas — SIN texto "CIFRA" ── */}
        <div className="flex flex-col items-center mb-8 opacity-0 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10 mb-4 flex items-center justify-center bg-white dark:bg-neutral-800">
            <img src="/isologo-dark.png" alt="CIFRA" className="w-12 h-12 object-contain dark:hidden" />
            <img src="/isologo-white.png" alt="CIFRA" className="w-12 h-12 object-contain hidden dark:block" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isLogin ? 'Iniciar Sesión' : 'Prueba Gratuita (14 días)'}
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {isLogin ? 'Accede a tu panel de control' : 'Sin tarjeta de crédito requerida'}
          </p>
        </div>

        {/* Error */}
        {clientError && (
          <div className="mb-6 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-center animate-slide-down">
            {clientError}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Campos exclusivos de registro */}
          {!isLogin && (
            <div className="space-y-5 opacity-0 animate-fade-up-1">
              <div>
                <label className={labelCls}>Tipo de Persona</label>
                <div className="flex gap-4">
                  {['fisica', 'moral'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                      <input type="radio" name="personType" value={t} checked={personType === t} onChange={() => setPersonType(t)} className="accent-slate-900 dark:accent-emerald-500" />
                      {t === 'fisica' ? 'Física' : 'Moral'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>{personType === 'moral' ? 'Razón Social' : 'Nombre Completo'}</label>
                <input name="fullName" type="text" required placeholder={personType === 'moral' ? 'Ej. Empresa S.A. de C.V.' : 'Ej. Juan Pérez'} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>RFC</label>
                <input name="rfc" type="text" required placeholder="XAXX010101000" maxLength={13} className={inputCls + ' uppercase'} />
              </div>
              {personType === 'fisica' && (
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className={labelCls}>Edad</label>
                    <input name="age" type="number" min="18" max="100" placeholder="Años" className={inputCls} />
                  </div>
                  <div className="w-2/3">
                    <label className={labelCls}>Género</label>
                    <select name="gender" className={inputCls}>
                      <option value="">Selecciona...</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className={labelCls}>Teléfono</label>
                <div className="flex gap-2">
                  <select name="phoneCode" className="w-24 bg-slate-100/50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-emerald-500/30">
                    <option value="+52">+52</option><option value="+1">+1</option><option value="+34">+34</option><option value="+57">+57</option>
                  </select>
                  <input name="phone" type="tel" required placeholder="123 456 7890" className={inputCls + ' flex-1'} />
                </div>
              </div>
            </div>
          )}

          {/* Email + contraseñas */}
          <div className={`space-y-5 opacity-0 ${isLogin ? 'animate-fade-up-1' : 'animate-fade-up-2'}`}>
            <div>
              <label className={labelCls}>Correo electrónico</label>
              <input name="email" type="email" required placeholder="usuario@empresa.com" autoComplete="email" className={inputCls} />
            </div>
            {!isLogin && (
              <div>
                <label className={labelCls}>Confirma tu correo</label>
                <input name="confirmEmail" type="email" required placeholder="usuario@empresa.com" className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Contraseña</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" tabIndex={-1}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} /></svg>
                </button>
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className={labelCls}>Confirma tu contraseña</label>
                <div className="relative">
                  <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••" autoComplete="new-password" className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" tabIndex={-1}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showConfirmPassword ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botón submit */}
          <div className={`opacity-0 ${isLogin ? 'animate-fade-up-2' : 'animate-fade-up-3'}`}>
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl p-3.5 text-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all duration-200 active:scale-[0.98] flex justify-center items-center h-12 disabled:opacity-50 shadow-md hover:shadow-lg">
              {isLoading
                ? <div className="h-5 w-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                : isLogin ? 'ENTRAR' : 'Comenzar Prueba Gratuita'}
            </button>
            {isLogin && (
              <div className="mt-3 text-center">
                <a href="/recuperar" className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
            )}
          </div>
        </form>

        {/* Google + toggle */}
        <div className={`opacity-0 ${isLogin ? 'animate-fade-up-3' : 'animate-fade-up-4'}`}>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-neutral-700" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 bg-white/80 dark:bg-neutral-900/80 text-slate-400 font-medium">accedo con</span>
            </div>
          </div>
          <button type="button" onClick={handleGoogleAuth} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl p-3.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all active:scale-[0.98] mb-6 disabled:opacity-50 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button type="button" onClick={() => { setIsLogin(!isLogin); setClientError('') }} className="w-full text-center text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes una cuenta? Inicia Sesión'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 font-sans text-slate-900 dark:text-white selection:bg-emerald-500/30 overflow-y-auto py-10 transition-colors duration-300">
      {/* Orbes decorativos — blur CSS puro, sin impacto en rendimiento */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
      </div>
      <Suspense fallback={<div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
