/**
 * GET /api/bi/flujo-caja
 * ==========================
 * Flujo de caja proyectado a 90 días.
 *
 * FASE 50: Reportes Avanzados
 *
 * Estrategia de proyección:
 * - Histórico real: ingresos y egresos reales de los últimos 3 meses
 *   (Journal entries INGRESO/EGRESO + POS orders)
 * - Proyección futura: promedio diario de los últimos 3 meses extrapolado
 *   a los próximos 90 días en buckets semanales.
 * - Saldo acumulado proyectado semana a semana.
 *
 * Retorna:
 * {
 *   historico: [{ semana, label, ingresos, egresos, neto, saldo }]  ← últimas ~12 semanas
 *   proyeccion: [{ semana, label, ingresos, egresos, neto, saldo }] ← próximas 13 semanas
 *   promedioSemanal: { ingresos, egresos, neto }
 *   saldoActual: number  (estimado desde histórico)
 * }
 */

import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function startOfWeek(d: Date): Date {
  const day  = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // lunes
  const mon  = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function weekLabel(d: Date): string {
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short' });
}

export async function GET(req: Request) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const tid = session.tenantId;
  const now = new Date();

  // Histórico: últimas 13 semanas (~3 meses)
  const HIST_WEEKS  = 13;
  const PROJ_WEEKS  = 13; // proyección ~90 días
  const histStart   = addDays(startOfWeek(now), -(HIST_WEEKS * 7));

  const [journalEntries, posOrders] = await Promise.all([
    prisma.journalEntry.findMany({
      where: {
        tenantId: tid,
        date:     { gte: histStart },
        entryType: { in: ['INGRESO', 'EGRESO'] },
      },
      select: { date: true, entryType: true, totalCredit: true, totalDebit: true },
    }),
    prisma.posOrder.findMany({
      where: {
        tenantId: tid,
        createdAt: { gte: histStart },
      },
      select: { createdAt: true, total: true },
    }),
  ]);

  // Bucket helper: obtener llave de semana (lunes)
  function weekKey(d: Date): string {
    const mon = startOfWeek(d);
    return mon.toISOString().slice(0, 10);
  }

  // Construir histórico semanal
  const histBuckets: Record<string, { ingresos: number; egresos: number; date: Date }> = {};
  for (let i = HIST_WEEKS - 1; i >= 0; i--) {
    const mon = startOfWeek(addDays(now, -(i * 7)));
    const key = mon.toISOString().slice(0, 10);
    histBuckets[key] = { ingresos: 0, egresos: 0, date: new Date(mon) };
  }

  for (const e of journalEntries) {
    const k = weekKey(e.date);
    if (!histBuckets[k]) continue;
    if (e.entryType === 'INGRESO') histBuckets[k].ingresos += Number(e.totalCredit);
    else                           histBuckets[k].egresos  += Number(e.totalDebit);
  }

  for (const o of posOrders) {
    const k = weekKey(o.createdAt);
    if (!histBuckets[k]) continue;
    histBuckets[k].ingresos += Number(o.total);
  }

  const histRows = Object.values(histBuckets).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calcular promedio semanal (excluyendo semana actual para evitar semana incompleta)
  const completeWeeks = histRows.slice(0, HIST_WEEKS - 1);
  const avgIngresos = completeWeeks.length > 0
    ? completeWeeks.reduce((s, r) => s + r.ingresos, 0) / completeWeeks.length
    : 0;
  const avgEgresos  = completeWeeks.length > 0
    ? completeWeeks.reduce((s, r) => s + r.egresos, 0) / completeWeeks.length
    : 0;

  // Saldo acumulado histórico
  let saldo = 0;
  const historico = histRows.map(r => {
    const neto = r.ingresos - r.egresos;
    saldo += neto;
    return {
      label:    weekLabel(r.date),
      ingresos: Math.round(r.ingresos),
      egresos:  Math.round(r.egresos),
      neto:     Math.round(neto),
      saldo:    Math.round(saldo),
      tipo:     'real' as const,
    };
  });

  // Proyección: usar saldo final histórico como base
  let saldoProyectado = saldo;
  const proyeccion = Array.from({ length: PROJ_WEEKS }, (_, i) => {
    const weekStart = startOfWeek(addDays(now, (i + 1) * 7));
    const neto      = avgIngresos - avgEgresos;
    saldoProyectado += neto;
    return {
      label:    weekLabel(weekStart),
      ingresos: Math.round(avgIngresos),
      egresos:  Math.round(avgEgresos),
      neto:     Math.round(neto),
      saldo:    Math.round(saldoProyectado),
      tipo:     'proyeccion' as const,
    };
  });

  return NextResponse.json({
    historico,
    proyeccion,
    promedioSemanal: {
      ingresos: Math.round(avgIngresos),
      egresos:  Math.round(avgEgresos),
      neto:     Math.round(avgIngresos - avgEgresos),
    },
    saldoActual: Math.round(saldo),
  });
}
