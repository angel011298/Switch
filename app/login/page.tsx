'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { login, syncUserWithPrisma, signInWithGoogle } from './actions'
import { useRouter } from 'next/navigation'

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [clientError, setClientError] = useState('')
  const router = useRouter()

  // Nuevos estados para el formulario
  const [personType, setPersonType] = useState('moral') // 'fisica' o 'moral'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setClientError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!isLogin) {
      if (formData.get('email') !== formData.get('confirmEmail')) {
        setClientError('Los correos electrónicos no coinciden.')
        return
      }
      if (formData.get('password') !== formData.get('confirmPassword')) {
        setClientError('Las contraseñas no coinciden.')
        return
      }
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await login(formData)
        if (response?.error) {
          setClientError(response.error)
          setIsLoading(false)
        }
      } else {
        // CLIENT-SIDE SIGNUP
        const supabase = createClient()
        const fullName = formData.get('fullName') as string
        const rfc = formData.get('rfc') as string
        const phone = `${formData.get('phoneCode')}${formData.get('phone')}`
        const age = formData.get('age') ? parseInt(formData.get('age') as string) : null
        const gender = formData.get('gender') as string

        // Lógica Super Admin
        const isSuperAdmin = email === '553angelortiz@gmail.com'

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: fullName,
              person_type: personType,
              rfc: rfc,
              phone_number: phone,
              age: age,
              gender: gender,
              is_super_admin: isSuperAdmin
            }
          }
        })

        if (authError) {
          setClientError(authError.message)
          setIsLoading(false)
          return
        }

        if (authData.user) {
          // SYNC WITH PRISMA
          const syncRes = await syncUserWithPrisma(authData.user.id, {
            email,
            fullName,
            personType,
            rfc,
            phone,
            age,
            gender
          })

          if (syncRes.error) {
            setClientError(syncRes.error)
            setIsLoading(false)
            return
          }

          // Redirección segura o OTP
          if (authData.session) {
            window.location.href = '/'
          } else {
            // Requiere verificación OTP
            window.location.href = `/auth/verify?email=${encodeURIComponent(email)}`
          }
        }
      }
    } catch (err) {
      console.error(err)
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    const res = await signInWithGoogle()
    if (res?.url) {
      window.location.href = res.url
    } else {
      setClientError(res?.error || 'Error con Google')
    }
  }



  return (
    <div className="w-full max-w-md p-10 bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 my-8">
      <div className="text-center space-y-3 mb-8">
        <div className="mx-auto h-16 w-auto flex items-center justify-center mb-6">
          <img src="/logo-light.png" alt="Switch OS Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isLogin ? 'Iniciar Sesión' : 'Prueba Gratuita (14 días)'}
        </h1>
      </div>

      {clientError && (
        <div className="mb-6 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl text-center">
          {clientError}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Tipo de Persona</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="personType" value="fisica" checked={personType === 'fisica'} onChange={() => setPersonType('fisica')} className="accent-slate-900" />
                  Física
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="personType" value="moral" checked={personType === 'moral'} onChange={() => setPersonType('moral')} className="accent-slate-900" />
                  Moral
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                {personType === 'moral' ? 'Razón Social' : 'Nombre Completo'}
              </label>
              <input name="fullName" type="text" required={!isLogin} placeholder={personType === 'moral' ? 'Ej. Empresa S.A. de C.V.' : 'Ej. Juan Pérez'} className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">RFC</label>
              <input name="rfc" type="text" required={!isLogin} placeholder="Ingrese su RFC" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 uppercase" />
            </div>

            {personType === 'fisica' && (
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Edad</label>
                  <input name="age" type="number" min="18" max="100" placeholder="Años" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Género</label>
                  <select name="gender" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400">
                    <option value="">Selecciona...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Teléfono</label>
              <div className="flex gap-2">
                <select name="phoneCode" className="w-24 bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400">
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+54">🇦🇷 +54</option>
                </select>
                <input name="phone" type="tel" required={!isLogin} placeholder="123 456 7890" className="flex-1 bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Correo electrónico</label>
            <input name="email" type="email" required placeholder="usuario@empresa.com" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Confirma tu correo electrónico</label>
              <input name="confirmEmail" type="email" required={!isLogin} placeholder="usuario@empresa.com" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none">
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
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Confirma tu contraseña</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required={!isLogin} placeholder="••••••••" className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none">
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

        <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-medium rounded-xl p-3.5 text-sm hover:bg-slate-800 transition-all active:scale-[0.98] flex justify-center items-center h-12">
          {isLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isLogin ? 'ENTRAR' : 'Comenzar Prueba Gratuita'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="px-4 bg-white text-slate-400 font-medium">accedo con</span></div>
      </div>

      <button type="button" onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl p-3.5 text-sm hover:bg-slate-50 transition-all active:scale-[0.98] mb-6">
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1 23 23"/></svg>
        Google
      </button>

      <button type="button" onClick={() => { setIsLogin(!isLogin); setClientError(''); }} className="w-full text-center text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors">
        {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes una cuenta? Inicia Sesión'}
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500/30 overflow-y-auto py-10">
      <Suspense fallback={<div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}