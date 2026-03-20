import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?message=Falta%20c%C3%B3digo%20de%20autenticaci%C3%B3n', requestUrl))
  }

  let response = NextResponse.redirect(new URL(next, requestUrl))

  // En Route Handlers, necesitamos persistir cookies en la respuesta.
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

  return response
}
