import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?message=Falta%20c%C3%B3digo%20de%20autenticaci%C3%B3n', requestUrl))
  }

  let response = NextResponse.redirect(new URL(next, requestUrl))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Supabase exchangeCodeForSession error', error)
    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent('No se pudo validar el enlace. Intenta de nuevo.')}`, requestUrl))
  }

  // Sync Google/OAuth users with Prisma.
  // Email/password signups call syncUserWithPrisma from the client, but OAuth
  // users land here directly. If no Prisma record exists, create it so the
  // middleware can read onboarding_complete and route to /onboarding.
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const existing = await prisma.user.findUnique({ where: { id: user.id } })
      if (!existing) {
        const email = user.email ?? ''
        const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split('@')[0]
        const isSuperAdmin = email === '553angelortiz@gmail.com'

        await prisma.tenant.create({
          data: {
            name: `ERP - ${fullName}`,
            memberships: {
              create: {
                role: 'ADMIN',
                user: {
                  create: {
                    id: user.id,
                    email,
                    name: fullName,
                    personType: 'fisica',
                    isSuperAdmin,
                  },
                },
              },
            },
          },
        })
      }
    }
  } catch (syncErr) {
    // Never block the OAuth flow — user will still land on onboarding/dashboard
    console.error('OAuth Prisma sync error:', syncErr)
  }

  return response
}
