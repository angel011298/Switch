import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Setear cookies en el request para que downstream las vea
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 2. Recrear response con las cookies actualizadas
          supabaseResponse = NextResponse.next({ request })
          // 3. Setear cookies en la response para que el browser las persista
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() refresca el token JWT si está por expirar.
  // NO usar getSession() — no valida el token contra el servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/auth', '/recuperar', '/restablecer', '/api/webhooks']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Si no hay usuario y la ruta requiere auth → redirigir a /login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario autenticado y está en /login → redirigir al dashboard
  // (Excluir /auth/verify y /auth/confirm para no interrumpir flujo OTP)
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
