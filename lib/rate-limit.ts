/**
 * CIFRA — Rate Limiting para API Pública v1
 * =============================================
 * Limita solicitudes por tenant según su plan de suscripción,
 * usando Upstash Redis con ventana deslizante (sliding window).
 *
 * Planes y límites:
 *   Freemium    →   100 req / hora
 *   Starter     →   500 req / hora
 *   PyME        → 2 000 req / hora
 *   Empresarial → 10 000 req / hora
 *
 * Uso en route handlers de /api/v1/:
 *   const auth = await checkApiRateLimit(req, 'read:customers');
 *   if (auth instanceof NextResponse) return auth; // 401 | 403 | 429
 *   const { tenantId, rateLimitHeaders } = auth;
 *   return NextResponse.json(data, { headers: rateLimitHeaders });
 *
 * Requiere env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * Si no están configuradas, se permite el tráfico con advertencia en console.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/prisma';

// ─── Configuración de planes ───────────────────────────────────────────────────

interface PlanLimit {
  requests: number;
  /** Ventana deslizante — siempre 1 hora para todos los planes */
  window: '1 h';
}

/**
 * Mapa plan_id → límite de solicitudes por hora.
 * Las claves deben estar en minúsculas; se normaliza antes de buscar.
 */
export const PLAN_LIMITS: Record<string, PlanLimit> = {
  // Planes CIFRA
  freemium:    { requests: 100,   window: '1 h' },
  starter:     { requests: 500,   window: '1 h' },
  pyme:        { requests: 2_000, window: '1 h' },
  empresarial: { requests: 10_000, window: '1 h' },
  // Alias para compatibilidad con planId legacy en Subscription.planId
  standard:    { requests: 500,   window: '1 h' },
  trial:       { requests: 100,   window: '1 h' },
  pro:         { requests: 2_000, window: '1 h' },
  enterprise:  { requests: 10_000, window: '1 h' },
};

const DEFAULT_LIMIT: PlanLimit = { requests: 100, window: '1 h' };

// ─── Instancias Redis / Ratelimit (singleton por proceso) ─────────────────────

let sharedRedis: Redis | null = null;
const limiterCache = new Map<number, Ratelimit>();

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  sharedRedis ??= new Redis({ url, token });
  return sharedRedis;
}

function getLimiter(requests: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!limiterCache.has(requests)) {
    limiterCache.set(requests, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, '1 h'),
      prefix: 'cifra:api:v1',
      analytics: false,
    }));
  }
  return limiterCache.get(requests)!;
}

// ─── Resultado de autenticación ────────────────────────────────────────────────

export interface ApiAuthResult {
  tenantId: string;
  /** Headers estándar X-RateLimit-* para inyectar en la respuesta exitosa */
  rateLimitHeaders: Record<string, string>;
}

// ─── Helper principal ──────────────────────────────────────────────────────────

/**
 * Valida el API Key **y** aplica rate limiting en un solo paso.
 *
 * Ejecutar al inicio de cada handler de /api/v1/, después de lo cual
 * el tenantId queda disponible sin más queries de auth.
 *
 * @param req           - Objeto NextRequest del handler
 * @param requiredScope - Scope mínimo requerido (e.g. 'read:customers')
 * @returns ApiAuthResult si la solicitud es permitida, NextResponse si debe bloquearse
 */
export async function checkApiRateLimit(
  req: NextRequest,
  requiredScope: string,
): Promise<ApiAuthResult | NextResponse> {

  // ── 1. Extraer Bearer token ─────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    return NextResponse.json(
      { error: 'Authorization header requerido (Bearer <api_key>)' },
      { status: 401 },
    );
  }

  const rawKey  = bearerMatch[1];
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  // ── 2. Validar API key + leer plan en una sola query ────────────────────────
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      tenantId:  true,
      active:    true,
      expiresAt: true,
      scopes:    true,
      tenant: {
        select: {
          subscription: { select: { planId: true } },
        },
      },
    },
  });

  if (!apiKey || !apiKey.active) {
    return NextResponse.json({ error: 'API key inválida o inactiva' }, { status: 401 });
  }
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return NextResponse.json({ error: 'API key expirada' }, { status: 401 });
  }
  if (!apiKey.scopes.includes(requiredScope)) {
    return NextResponse.json(
      { error: `Scope insuficiente. Se requiere: ${requiredScope}` },
      { status: 403 },
    );
  }

  const { tenantId } = apiKey;

  // Actualizar lastUsedAt (fire-and-forget)
  prisma.apiKey.updateMany({
    where: { keyHash },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  // ── 3. Resolver límite del plan ─────────────────────────────────────────────
  const rawPlanId = apiKey.tenant.subscription?.planId ?? 'freemium';
  const planId    = rawPlanId.toLowerCase().trim();
  const planLimit = PLAN_LIMITS[planId] ?? DEFAULT_LIMIT;

  // ── 4. Verificar con Upstash ────────────────────────────────────────────────
  const limiter = getLimiter(planLimit.requests);

  if (!limiter) {
    // Sin Upstash configurado → permitir (desarrollo local)
    console.warn(
      '[rate-limit] Upstash no configurado. Define UPSTASH_REDIS_REST_URL y ' +
      'UPSTASH_REDIS_REST_TOKEN para activar rate limiting en producción.',
    );
    return { tenantId, rateLimitHeaders: {} };
  }

  const { success, limit, remaining, reset } = await limiter.limit(tenantId);

  // reset viene en milisegundos → convertir a Unix segundos
  const resetSecs  = Math.ceil(reset / 1000);
  const retryAfter = Math.max(0, resetSecs - Math.floor(Date.now() / 1000));

  const rateLimitHeaders: Record<string, string> = {
    'X-RateLimit-Limit':     String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset':     String(resetSecs),
  };

  // ── 5. 429 si se excedió el límite ─────────────────────────────────────────
  if (!success) {
    // Log en AuditLog (fire-and-forget, severity WARN)
    prisma.auditLog.create({
      data: {
        tenantId,
        action:    'RATE_LIMIT_EXCEEDED',
        resource:  'ApiKey',
        ip:        req.headers.get('x-forwarded-for') ??
                   req.headers.get('x-real-ip') ??
                   null,
        userAgent: req.headers.get('user-agent') ?? null,
        newData: {
          plan:     planId,
          limit:    planLimit.requests,
          window:   planLimit.window,
          endpoint: req.nextUrl.pathname,
          method:   req.method,
        },
        severity: 'warning',
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        error:      'Rate limit excedido',
        limit:      planLimit.requests,
        window:     planLimit.window,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders,
          'Retry-After': String(retryAfter),
        },
      },
    );
  }

  return { tenantId, rateLimitHeaders };
}
