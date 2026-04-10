'use server';

/**
 * CIFRA — Marketing Automation Actions (Super Admin)
 * ====================================================
 * Gestión de integraciones publicitarias, creatividades IA y métricas consolidadas.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function requireSuperAdmin(isSuperAdmin: boolean) {
  if (!isSuperAdmin) throw new Error('Acceso denegado: se requiere Super Admin');
}

// ─── INTEGRACIONES ────────────────────────────────────────────────────────────

export async function getMarketingIntegrations() {
  const session = await getSwitchSession();
  requireSuperAdmin(session?.isSuperAdmin ?? false);

  return prisma.marketingIntegration.findMany({
    orderBy: { platform: 'asc' },
  });
}

export async function toggleIntegration(id: string, isActive: boolean) {
  const session = await getSwitchSession();
  requireSuperAdmin(session?.isSuperAdmin ?? false);

  await prisma.marketingIntegration.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath('/admin/marketing');
}

// ─── CREATIVIDADES IA ─────────────────────────────────────────────────────────

export async function getAdCreatives(status?: string) {
  const session = await getSwitchSession();
  requireSuperAdmin(session?.isSuperAdmin ?? false);

  return prisma.aiGeneratedCreative.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function updateCreativeStatus(id: string, status: 'ACTIVE' | 'REJECTED', rejectedReason?: string) {
  const session = await getSwitchSession();
  requireSuperAdmin(session?.isSuperAdmin ?? false);

  await prisma.aiGeneratedCreative.update({
    where: { id },
    data: { status, rejectedReason: status === 'REJECTED' ? rejectedReason : null },
  });
  revalidatePath('/admin/marketing');
}

/**
 * Genera creatividades con Claude basándose en las métricas de rendimiento actuales.
 * Ángulos de venta disponibles: ahorro, fiscal, tiempo, cumplimiento
 */
export async function generateAdCreatives(platform: string, angle: string) {
  const session = await getSwitchSession();
  requireSuperAdmin(session?.isSuperAdmin ?? false);

  // Obtener métricas recientes para dar contexto al LLM
  const recentLogs = await prisma.adCampaignLog.findMany({
    where: { platform },
    orderBy: { date: 'desc' },
    take: 10,
  });

  const metricsJson = recentLogs.length > 0
    ? JSON.stringify(recentLogs.map(l => ({
        campaignId: l.campaignId,
        spend: l.spend,
        clicks: l.clicks,
        conversions: l.conversions,
        ctr: l.impressions > 0 ? (l.clicks / l.impressions * 100).toFixed(2) + '%' : '0%',
      })))
    : 'Sin datos históricos aún — es la primera generación.';

  const angleDescriptions: Record<string, string> = {
    ahorro:       'ahorro de costos operativos y reducción de errores contables',
    fiscal:       'automatización fiscal, cumplimiento SAT y prevención de multas',
    tiempo:       'ahorro de tiempo, automatización de tareas manuales y eficiencia',
    cumplimiento: 'cumplimiento legal, auditoría limpia y control financiero',
  };

  const angleDesc = angleDescriptions[angle] || angle;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada. Agrégala en las variables de entorno de Vercel.');

  const prompt = `Eres un experto en marketing digital B2B para SaaS en México.

Métricas recientes de campañas en ${platform}:
${metricsJson}

Genera 3 variantes de anuncios para CIFRA ERP (software ERP fiscal para PyMEs mexicanas) enfocadas en el ángulo: "${angleDesc}".

Para ${platform === 'GOOGLE_ADS' ? 'Google Ads' : 'Meta Ads (Facebook/Instagram)'}, genera cada variante con:
- headline: máximo 30 caracteres para Google Ads, 40 para Meta
- description: máximo 90 caracteres para Google, 125 para Meta
- El copy debe ser en español, directo, con propuesta de valor clara para contadores y dueños de PyMEs mexicanas.

Responde SOLO con un JSON array válido con esta estructura exacta:
[
  {"headline": "...", "description": "..."},
  {"headline": "...", "description": "..."},
  {"headline": "...", "description": "..."}
]`;

  const isVercelGateway = apiKey.startsWith('vck_');
  const authHeaders = isVercelGateway
    ? { 'Authorization': `Bearer ${apiKey}` }
    : { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error de la API de IA: ${err.slice(0, 200)}`);
  }

  const aiResponse = await res.json();
  const rawText: string = aiResponse.content?.[0]?.text ?? '';

  let creatives: { headline: string; description: string }[];
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found');
    creatives = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Error al parsear la respuesta del LLM. Intenta de nuevo.');
  }

  // Guardar en BD como PENDING_APPROVAL
  await Promise.all(
    creatives.map((c) =>
      prisma.aiGeneratedCreative.create({
        data: {
          platform,
          angle,
          headline:    c.headline.slice(0, platform === 'GOOGLE_ADS' ? 30 : 40),
          description: c.description.slice(0, platform === 'GOOGLE_ADS' ? 90 : 125),
          status: 'PENDING_APPROVAL',
        },
      })
    )
  );

  revalidatePath('/admin/marketing');
  return { generated: creatives.length };
}

// ─── ANALÍTICA CONSOLIDADA ────────────────────────────────────────────────────

export async function getAdAnalytics(days: 7 | 30 | 90 = 30) {
  const session = await getSwitchSession();
  requireSuperAdmin(session?.isSuperAdmin ?? false);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.adCampaignLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  // Agregar por fecha
  const byDate = logs.reduce<Record<string, { spend: number; conversions: number; clicks: number; impressions: number }>>((acc, log) => {
    const dateKey = log.date.toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
    acc[dateKey].spend       += log.spend;
    acc[dateKey].conversions += log.conversions;
    acc[dateKey].clicks      += log.clicks;
    acc[dateKey].impressions += log.impressions;
    return acc;
  }, {});

  const totalSpend       = logs.reduce((s, l) => s + l.spend, 0);
  const totalConversions = logs.reduce((s, l) => s + l.conversions, 0);
  const totalClicks      = logs.reduce((s, l) => s + l.clicks, 0);
  const cpl = totalConversions > 0 ? totalSpend / totalConversions : 0;

  return {
    totalSpend,
    totalConversions,
    totalClicks,
    cpl,
    byDate: Object.entries(byDate).map(([date, data]) => ({ date, ...data })),
  };
}
