import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    console.log(`[Middleware] Request: ${pathname} | Cookies found: ${request.cookies.getAll().length}`)
    if (request.cookies.getAll().length > 0) {
        console.log(`[Middleware] Cookie names: ${request.cookies.getAll().map(c => c.name).join(', ')}`)
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANTE: getUser() es vital para el refresco de sesión
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) {
        console.error(`[Middleware] getUser error:`, error.message)
    }

    console.log(`[Middleware] User detected: ${user?.email || 'null'}`)

    const url = request.nextUrl.clone()

    // Rutas que no requieren protección (auth, login, etc)
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth')
    const isPublicStatic = pathname.includes('/_next') || pathname.includes('/favicon.ico') || pathname.includes('/logo-light.png')

    if (isPublicStatic) return supabaseResponse

    // Lógica de Redirección Blindada
    if (!user && !isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const response = NextResponse.redirect(url)
        // Transferir cookies de la sesión actualizada
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie)
        })
        return response
    }

    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        const response = NextResponse.redirect(url)
        // Transferir cookies de la sesión actualizada
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie)
        })
        return response
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}