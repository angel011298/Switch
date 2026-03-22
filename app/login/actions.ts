'use server'

import prisma from '@/lib/prisma'

/**
 * Server Action: Sincroniza el usuario de Supabase Auth con el modelo Prisma.
 * Se invoca DESPUÉS del signUp exitoso en el cliente.
 */
export async function syncUserWithPrisma(
  userId: string,
  data: {
    email: string
    fullName: string
    personType: string
    rfc: string
    phone: string
    age: number | null
    gender: string
  }
): Promise<{ success?: boolean; error?: string }> {
  const { email, fullName, personType, rfc, phone, age, gender } = data

  try {
    // Verificar si el usuario ya existe (idempotencia)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (existingUser) return { success: true }

    const tenantName = personType === 'moral' ? fullName : `ERP - ${fullName}`
    const isSuperAdmin = email === '553angelortiz@gmail.com'

    await prisma.tenant.create({
      data: {
        name: tenantName,
        rfc: rfc || null,
        users: {
          create: {
            id: userId,
            email,
            name: fullName,
            role: 'ADMIN',
            personType,
            rfc: rfc || null,
            phone: phone || null,
            age,
            gender: gender || null,
            isSuperAdmin,
          },
        },
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('syncUserWithPrisma error:', error)
    // Si es error de unique constraint, el usuario ya existe
    if (error?.code === 'P2002') return { success: true }
    return { error: 'Error al sincronizar el perfil con la base de datos.' }
  }
}

/**
 * Server Action: Genera la URL de OAuth para Google.
 * Usa el service-role o server client para construir la URL.
 */
export async function getGoogleOAuthUrl(): Promise<{ url?: string; error?: string }> {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error || !data.url) return { error: 'Error al conectar con Google.' }
  return { url: data.url }
}
