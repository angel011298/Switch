import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ensurePrismaUser } from '@/lib/auth/ensure-user'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?message=Falta%20c%C3%B3digo%20de%20autenticaci%C3%B3n', requestUrl))
  }

  // Collect cookies set during exchangeCodeForSession so we can apply them
  // to the final redirect response (destination may change below).
  const cookiesToApply: { name: string; value: string; options?: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Capture — apply to the final response after we know the destination.
          cookiesToSet.forEach((c) => cookiesToApply.push(c))
        },
      },
    }
  )

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Supabase exchangeCodeForSession error', error)
    return NextResponse.redirect(
      new URL(`/login?message=${encodeURIComponent('No se pudo validar el enlace. Intenta de nuevo.')}`, requestUrl)
    )
  }

  // Ensure Prisma user/tenant exists and determine correct landing page.
  let destination = next
  const authUser = sessionData?.user
  if (authUser?.id && authUser.email) {
    const name =
      authUser.user_metadata?.full_name ??
      authUser.user_metadata?.name ??
      authUser.email.split('@')[0]

    await ensurePrismaUser(authUser.id, authUser.email, name)

    // Always check DB for onboarding status — JWT claim may be stale for new users.
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: authUser.id },
      select: { tenant: { select: { onboardingComplete: true } } },
    })

    if (!membership || !membership.tenant.onboardingComplete) {
      destination = '/onboarding'
    }
  }

  const response = NextResponse.redirect(new URL(destination, requestUrl))
  cookiesToApply.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
