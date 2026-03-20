'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function login(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }
  }

  redirect('/')
}

export async function signup(formData: FormData): Promise<{ success?: boolean; error?: string; message?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const personType = formData.get('personType') as string
  const rfc = formData.get('rfc') as string
  const phone = `${formData.get('phoneCode')}${formData.get('phone')}`
  const age = formData.get('age') ? parseInt(formData.get('age') as string) : null
  const gender = formData.get('gender') as string

  const supabase = createClient()

  // 1. Crear el usuario en Supabase Auth con Metadata
  console.log(`[Signup Action] Attempting signup for ${email}`)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        person_type: personType,
        rfc: rfc,
        phone_number: phone,
        age: age,
        gender: gender,
      }
    }
  })

  if (authError || !authData.user) {
    console.error(`[Signup Action] Auth Error:`, authError?.message)
    return { error: authError?.message || 'Error en el servidor de seguridad.' }
  }

  console.log(`[Signup Action] Auth User Created: ${authData.user.id}`)

  // 2. Crear el Tenant y el User en Prisma
  try {
    const tenantName = personType === 'moral' ? fullName : `ERP - ${fullName}`
    
    await prisma.tenant.create({
      data: {
        name: tenantName,
        rfc: rfc,
        users: {
          create: {
            id: authData.user.id,
            email: email,
            name: fullName,
            role: 'ADMIN',
            personType: personType,
            rfc: rfc,
            phone: phone,
            age: age,
            gender: gender,
          }
        }
      }
    })
  } catch (error: any) {
    console.error("🚨 Error Prisma:", error)
    return { error: 'Error al crear el perfil empresarial.' }
  }

  // 3. Forzamos inicio de sesión automático si la cuenta ya está "confirmada" (o si no requiere confirmación)
  // En Supabase SSR, si Confirm Email está OFF, signUp ya nos da la sesión.
  // Si está ON, necesitamos autenticarnos. Probamos un signIn directo.
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  console.log(`[Signup Action] Session created: ${!!session}`)

  if (loginError) {
    console.error(`[Signup Action] Login Error context:`, loginError.message)
    // Si falla el login automático (ej. necesita confirmar email), pero el usuario se creó:
    return { success: true, message: 'Cuenta creada. Por favor, revisa tu correo para confirmar antes de acceder.' }
  }

  redirect('/')
}

export async function signInWithGoogle() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (data.url) return { url: data.url }
  return { error: 'Error al conectar con Google' }
}