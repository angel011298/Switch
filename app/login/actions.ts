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

export async function syncUserWithPrisma(userId: string, data: any): Promise<{ success?: boolean; error?: string }> {
  const { email, fullName, personType, rfc, phone, age, gender } = data

  // 1. Crear el Tenant y el User en Prisma
  try {
    const tenantName = personType === 'moral' ? fullName : `ERP - ${fullName}`
    
    // Verificar si es super admin por correo (Logic relocated here for DB consistency)
    const isSuperAdmin = email === '553angelortiz@gmail.com'

    await prisma.tenant.create({
      data: {
        name: tenantName,
        rfc: rfc,
        users: {
          create: {
            id: userId,
            email: email,
            name: fullName,
            role: 'ADMIN',
            personType: personType,
            rfc: rfc,
            phone: phone,
            age: age,
            gender: gender,
            isSuperAdmin: isSuperAdmin,
          }
        }
      }
    })
    return { success: true }
  } catch (error: any) {
    console.error("🚨 Error Prisma Sync:", error)
    return { error: 'Error al sincronizar el perfil con la base de datos.' }
  }
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