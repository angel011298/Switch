/**
 * CIFRA AI Copilot — Daily Rate Limiter
 * =======================================
 * Límite de consultas AI por tenant por día (ventana deslizante).
 * Depende de Upstash Redis; si no está configurado, permite el paso
 * con un warning en consola (graceful degradation para dev local).
 *
 * Límites por plan:
 *   freemium / trial / starter / standard  →  20 / día
 *   pyme / pro                             →  50 / día
 *   empresarial / enterprise               → 200 / día
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/prisma';

const AI_DAILY_LIMITS: Record<string, number> = {
  freemium:    20,
  trial:       20,
  starter:     20,
  standard:    20,
  pyme:        50,
  pro:         50,
  empresarial: 200,
  enterprise:  200,
};

const DEFAULT_LIMIT = 20;

export interface AiRateLimitResult {
  allowed:   boolean;
  limit:     number;
  remaining: number;
  reset:     number; // Unix timestamp en segundos
  headers:   Record<string, string>;
}

export async function checkAiRateLimit(tenantId: string): Promise<AiRateLimitResult> {
  // Obtener planId del tenant para determinar el límite correcto
  const subscription = await prisma.subscription.findUnique({
    where:  { tenantId },
    select: { planId: true },
  });

  const planId  = subscription?.planId?.toLowerCase() ?? 'standard';
  const limit   = AI_DAILY_LIMITS[planId] ?? DEFAULT_LIMIT;

  // Graceful degradation si Upstash no está configurado
  const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    console.warn('[AI Rate Limit] Upstash no configurado — permitiendo sin límite');
    const nowSec = Math.floor(Date.now() / 1000);
    return {
      allowed:   true,
      limit,
      remaining: limit,
      reset:     nowSec + 86400,
      headers: {
        'X-AI-Limit':     String(limit),
        'X-AI-Remaining': String(limit),
        'X-AI-Reset':     String(nowSec + 86400),
      },
    };
  }

  const redis     = new Redis({ url: upstashUrl, token: upstashToken });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, '1 d'),
    prefix:  'ai_daily',
  });

  const { success, limit: rl, remaining, reset } = await ratelimit.limit(tenantId);
  const resetSec = Math.floor(Number(reset) / 1000);

  return {
    allowed:   success,
    limit:     rl,
    remaining: Math.max(0, remaining),
    reset:     resetSec,
    headers: {
      'X-AI-Limit':     String(rl),
      'X-AI-Remaining': String(Math.max(0, remaining)),
      'X-AI-Reset':     String(resetSec),
    },
  };
}
