'use server'

import prisma from '@/lib/prisma'

// ─── Validación de duplicados ANTES del signUp ─────────────────────────────

/**
 * Verifica RFC, correo y Razón Social antes de crear la cuenta.
 * Se llama ANTES de supabase.auth.signUp() para evitar usuarios huérfanos.
 */
export async function checkSignupDuplicates(data: {
  email: string
  rfc: string
  fullName: string
  personType: string
}): Promise<{ error?: string }> {
  const { email, rfc, fullName, personType } = data

  try {
    // 1. Verificar RFC único (en usuarios y tenants)
    if (rfc && rfc.trim().length >= 12) {
      const rfcNorm = rfc.trim().toUpperCase()

      const [rfcInUser, rfcInTenant] = await Promise.all([
        prisma.user.findFirst({ where: { rfc: rfcNorm } }),
        prisma.tenant.findFirst({ where: { rfc: rfcNorm } }),
      ])

      if (rfcInUser || rfcInTenant) {
        return { error: 'Este RFC ya está registrado. Si crees que es un error, contacta soporte.' }
      }
    }

    // 2. Verificar email único en Prisma (Supabase lo verifica en Auth también)
    const emailNorm = email.trim().toLowerCase()
    const existingEmail = await prisma.user.findFirst({ where: { email: emailNorm } })
    if (existingEmail) {
      return { error: 'Este correo electrónico ya tiene una cuenta registrada.' }
    }

    // 3. Verificar Razón Social única (solo Persona Moral)
    if (personType === 'moral' && fullName.trim()) {
      const nameNorm = fullName.trim().toUpperCase()
      const existingTenant = await prisma.tenant.findFirst({
        where: { name: nameNorm },
      })
      if (!existingTenant) {
        // Intentar con la versión sin uppercase (por si fue guardada diferente)
        const existingTenantAlt = await prisma.tenant.findFirst({
          where: { name: fullName.trim() },
        })
        if (existingTenantAlt) {
          return { error: 'Ya existe una empresa registrada con esa Razón Social exacta.' }
        }
      } else {
        return { error: 'Ya existe una empresa registrada con esa Razón Social exacta.' }
      }
    }

    return {}
  } catch (error) {
    console.error('checkSignupDuplicates error:', error)
    // No bloqueamos el flujo por errores de red/DB
    return {}
  }
}

// ─── Sincronizar usuario con Prisma ───────────────────────────────────────────

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
    age?: number | null
    gender?: string
  }
): Promise<{ success?: boolean; error?: string }> {
  const { email, fullName, personType, rfc, phone } = data

  try {
    // Verificar si el usuario ya existe (idempotencia)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (existingUser) return { success: true }

    const tenantName = personType === 'moral' ? fullName.trim().toUpperCase() : `ERP - ${fullName.trim()}`
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

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * Server Action: Genera la URL de OAuth para Google.
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
