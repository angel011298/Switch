import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Switch OS — Middleware de Autenticacion y Autorizacion de Modulos
 * ==================================================================
 * Capa 1: Autenticacion (sesion Supabase)
 * Capa 2: Autorizacion de modulos (JWT claim active_modules)
 *
 * NO hace JOINs a la base de datos — toda la info viene del JWT.
 */

// Mapeo de rutas a ModuleKeys requeridos
const ROUTE_MODULE_MAP: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
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

  // IMPORTANTE: getUser() refresca el token JWT si esta por expirar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── Rutas publicas ───────────────────────────────────
  const publicRoutes = ['/login', '/auth', '/recuperar', '/restablecer', '/api/webhooks'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // ─── Validacion de modulos activos (Capa 2) ──────────
  if (user && !isPublicRoute && !pathname.startsWith('/admin')) {
    // Decodificar JWT para extraer claims custom
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

        // Super Admin tiene acceso a todo
        if (!isSuperAdmin) {
          // Encontrar el modulo requerido para esta ruta
          const requiredModule = findRequiredModule(pathname);

          if (requiredModule && !activeModules.includes(requiredModule)) {
            // Modulo no activo → redirigir al dashboard con mensaje
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

  return supabaseResponse;
}

/**
 * Encuentra el ModuleKey requerido para un pathname dado.
 * Busca del mas especifico al mas general.
 */
function findRequiredModule(pathname: string): string | null {
  // Buscar coincidencia exacta primero
  if (ROUTE_MODULE_MAP[pathname]) {
    return ROUTE_MODULE_MAP[pathname];
  }

  // Buscar el prefijo mas largo que coincida
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
