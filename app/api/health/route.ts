/**
 * Switch OS — Health Check Endpoint
 * ====================================
 * Usado por Vercel Monitoring, UptimeRobot o cualquier servicio de alertas.
 *
 * GET /api/health → { status, timestamp, db, version }
 * Responde 200 si todo OK, 503 si la BD no responde.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Siempre dinámico — no cachear el health check
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  try {
    // Ping a la base de datos con query mínima
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: {
          status: 'ok',
          latencyMs: dbLatencyMs,
        },
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
        environment: process.env.NODE_ENV ?? 'development',
        region: process.env.VERCEL_REGION ?? 'local',
      },
      { status: 200 }
    );
  } catch (err) {
    const dbLatencyMs = Date.now() - start;

    console.error('[health] DB ping failed:', err);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        db: {
          status: 'error',
          latencyMs: dbLatencyMs,
          error: process.env.NODE_ENV === 'development' ? String(err) : 'DB unavailable',
        },
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      },
      { status: 503 }
    );
  }
}
