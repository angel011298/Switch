import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Switch OS — Middleware de Autenticacion y Autorizacion de Modulos
 * ==================================================================
 * Capa 1: Autenticacion (sesion Supabase via @supabase/ssr v0.9)
 * Capa 2: Autorizacion de modulos (JWT claim active_modules)
 *
 * NO hace JOINs a la base de datos — toda la info viene del JWT.
 */

// Mapeo de rutas a ModuleKeys requeridos
const ROUTE_MODULE_MAP: Record<string, string> = {
  // '/dashboard' es siempre accesible — no requiere modulo
  '/citas': 'CALENDAR',
  '/bi': 'BI',
  '/rrhh': 'HCM',
  '/rrhh/nomina': 'PAYROLL',
  '/rrhh/talento': 'TALENT',
  '/finanzas': 'FINANCE',
  '/finanzas/caja-chica': 'FINANCE',
  '/finanzas/gastos': 'FINANCE',
  '/finanzas/legal': 'FINANCE',
  '/finanzas/impuestos': 'TAXES',
  '/finanzas/cobranza': 'COLLECTIONS',
  '/billing': 'BILLING_CFDI',
  '/pos': 'POS',
  '/crm': 'CRM',
  '/crm/marketing': 'MARKETING',
  '/crm/soporte': 'SUPPORT',
  '/scm': 'SCM',
  '/scm/compras': 'SCM',
  '/scm/inventarios': 'INVENTORY',
  '/scm/logistica': 'LOGISTICS',
  '/mrp': 'MRP',
  '/mrp/bom': 'MRP',
  '/mrp/planificacion': 'MRP',
  '/mrp/calidad': 'QUALITY',
  '/proyectos': 'PROJECTS',
  '/proyectos/tiempos': 'PROJECTS',
  '/proyectos/rentabilidad': 'PROJECTS',
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: No uses getSession() solo — getUser() valida el token contra el server.
  // En @supabase/ssr v0.9, getUser() es el metodo correcto para SSR.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const sbCookies = request.cookies.getAll().filter(c => c.name.includes('sb-'));
    console.log(`[middleware] ${pathname} | user: ${user?.email ?? 'null'} | error: ${userError?.message ?? 'none'} | sb-cookies: ${sbCookies.length} (${sbCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`).join(', ')})`);
  }

  // ─── Rutas publicas ───────────────────────────────────
  const publicRoutes = ['/login', '/auth', '/recuperar', '/restablecer', '/api/webhooks'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Si no hay user y estamos en ruta protegida → redirigir a login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si hay user y esta en /login → redirigir al dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ─── Validacion de modulos activos (Capa 2) ──────────
  // /dashboard siempre accesible (es el landing post-login y destino de module_denied)
  const alwaysAllowed = ['/admin', '/dashboard', '/settings', '/perfil'];
  const skipModuleCheck = alwaysAllowed.some((route) => pathname === route || pathname.startsWith(route + '/'));

  if (user && !isPublicRoute && !skipModuleCheck) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(session.access_token.split('.')[1], 'base64').toString()
        );

        const isSuperAdmin: boolean = payload.is_super_admin === true;
        const activeModules: string[] = payload.active_modules ?? [];

        if (!isSuperAdmin) {
          const requiredModule = findRequiredModule(pathname);

          if (requiredModule && !activeModules.includes(requiredModule)) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            url.searchParams.set('module_denied', requiredModule);
            return NextResponse.redirect(url);
          }
        }
      } catch {
        // Si falla el decode del JWT, dejar pasar (defensa en profundidad via RLS)
      }
    }
  }

  // CRITICO: siempre devolver supabaseResponse para que las cookies refrescadas
  // se propaguen al browser. Si devuelves NextResponse.next() pierdes las cookies.
  return supabaseResponse;
}

function findRequiredModule(pathname: string): string | null {
  if (ROUTE_MODULE_MAP[pathname]) {
    return ROUTE_MODULE_MAP[pathname];
  }

  let bestMatch = '';
  let bestModule: string | null = null;

  for (const [route, moduleKey] of Object.entries(ROUTE_MODULE_MAP)) {
    if (pathname.startsWith(route) && route.length > bestMatch.length) {
      bestMatch = route;
      bestModule = moduleKey;
    }
  }

  return bestModule;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
