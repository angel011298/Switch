import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Switch OS — Middleware de Autenticacion, Autorizacion y Paywall
 * ==================================================================
 * Capa 1: Autenticacion (sesion Supabase via @supabase/ssr v0.9)
 * Capa 2: Paywall — verifica que la suscripcion este vigente (validUntil)
 * Capa 3: Autorizacion de modulos (JWT claim active_modules)
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
  '/finanzas/contabilidad': 'FINANCE',
  '/billing': 'BILLING_CFDI',
  '/pos': 'POS',
  '/crm': 'CRM',
  '/crm/pipeline': 'CRM',     // FASE 18: Pipeline Kanban
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

// Rutas que siempre son accesibles (auth + admin + suscripcion bloqueada)
const ALWAYS_ALLOWED = [
  '/admin',
  '/dashboard',
  '/settings',
  '/perfil',
  '/onboarding',           // FASE 12: Onboarding obligatorio — accesible siempre
  '/billing/subscription', // Pagina de pago — accesible aunque este suspendido
];

// Rutas publicas (sin autenticacion)
const PUBLIC_ROUTES = [
  '/login',
  '/auth',
  '/recuperar',
  '/restablecer',
  '/api/webhooks',
  '/factura-tu-ticket',
];

export async function middleware(request: NextRequest) {
  // FASE 12: Inyectar pathname en headers para que Server Components puedan leerlo
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

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

  // IMPORTANTE: getUser() valida el token contra el server de Supabase.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const sbCookies = request.cookies.getAll().filter(c => c.name.includes('sb-'));
    console.log(`[middleware] ${pathname} | user: ${user?.email ?? 'null'} | error: ${userError?.message ?? 'none'} | sb-cookies: ${sbCookies.length}`);
  }

  // ─── Rutas publicas ───────────────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ─── Validacion JWT (Capa 2 + Capa 3) ───────────────
  const skipModuleCheck = ALWAYS_ALLOWED.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (user && !isPublicRoute) {
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
        const subStatus: string = payload.sub_status ?? 'TRIAL';
        const validUntilRaw: string | null = payload.valid_until ?? null;

        // ── Capa 2: Paywall ─────────────────────────────────────────────
        // Super Admin nunca es bloqueado por el paywall
        if (!isSuperAdmin && !skipModuleCheck) {
          const isSuspended = subStatus === 'SUSPENDED';
          const isExpired =
            validUntilRaw !== null &&
            new Date(validUntilRaw) < new Date();

          if (isSuspended || isExpired) {
            const url = request.nextUrl.clone();
            url.pathname = '/billing/subscription';
            url.searchParams.set('reason', isSuspended ? 'suspended' : 'expired');
            return NextResponse.redirect(url);
          }
        }

        // ── Capa 3: Modulos activos ───────────────────────────────────
        if (!isSuperAdmin && !skipModuleCheck) {
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

  // CRITICO: siempre devolver supabaseResponse para propagar cookies refrescadas.
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
