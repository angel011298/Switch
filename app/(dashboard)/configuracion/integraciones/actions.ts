'use server';

/**
 * CIFRA — Integraciones Externas Server Actions
 * FASE 37: Webhooks, API Keys
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createHash, randomBytes } from 'crypto';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface WebhookEndpointRow {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  description: string | null;
  deliveriesCount: number;
  successRate: number; // 0-100
  createdAt: string;
}

export interface WebhookDeliveryRow {
  id: string;
  webhookId: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  attemptCount: number;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

// ─── WEBHOOKS ────────────────────────────────────────────────────────────────

export async function getWebhooks(): Promise<WebhookEndpointRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        select: { success: true },
        take: 100,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return webhooks.map((w) => {
    const total = w.deliveries.length;
    const successes = w.deliveries.filter((d) => d.success).length;
    return {
      id: w.id,
      url: w.url,
      events: w.events,
      active: w.active,
      description: w.description,
      deliveriesCount: w._count.deliveries,
      successRate: total > 0 ? Math.round((successes / total) * 100) : 100,
      createdAt: w.createdAt.toISOString(),
    };
  });
}

export async function createWebhook(input: {
  url: string;
  events: string[];
  description?: string;
}): Promise<{ id: string; secret: string }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  if (!input.url.trim()) throw new Error('La URL es requerida');
  if (!input.url.startsWith('https://')) throw new Error('La URL debe usar HTTPS');
  if (input.events.length === 0) throw new Error('Selecciona al menos un evento');

  const secret = `whsec_${randomBytes(24).toString('hex')}`;

  const wh = await prisma.webhookEndpoint.create({
    data: {
      tenantId:    session.tenantId,
      url:         input.url.trim(),
      secret,
      events:      input.events,
      description: input.description?.trim() ?? null,
    },
    select: { id: true },
  });

  revalidatePath('/configuracion/integraciones');
  return { id: wh.id, secret };
}

export async function toggleWebhook(webhookId: string): Promise<boolean> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const wh = await prisma.webhookEndpoint.findUnique({ where: { id: webhookId } });
  if (!wh || wh.tenantId !== session.tenantId) throw new Error('Webhook no encontrado');

  const updated = await prisma.webhookEndpoint.update({
    where: { id: webhookId },
    data: { active: !wh.active },
    select: { active: true },
  });

  revalidatePath('/configuracion/integraciones');
  return updated.active;
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const wh = await prisma.webhookEndpoint.findUnique({ where: { id: webhookId } });
  if (!wh || wh.tenantId !== session.tenantId) throw new Error('Webhook no encontrado');

  await prisma.webhookEndpoint.delete({ where: { id: webhookId } });
  revalidatePath('/configuracion/integraciones');
}

export async function getWebhookDeliveries(webhookId: string): Promise<WebhookDeliveryRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const wh = await prisma.webhookEndpoint.findUnique({ where: { id: webhookId } });
  if (!wh || wh.tenantId !== session.tenantId) return [];

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return deliveries.map((d) => ({
    id: d.id,
    webhookId: d.webhookId,
    event: d.event,
    statusCode: d.statusCode,
    success: d.success,
    attemptCount: d.attemptCount,
    deliveredAt: d.deliveredAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));
}

// ─── API KEYS ─────────────────────────────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKeyRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const keys = await prisma.apiKey.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    scopes: k.scopes,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    expiresAt: k.expiresAt?.toISOString() ?? null,
    active: k.active,
    createdAt: k.createdAt.toISOString(),
  }));
}

export async function createApiKey(input: {
  name: string;
  scopes: string[];
  expiresAt?: string;
}): Promise<{ id: string; key: string }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  if (!input.name.trim()) throw new Error('El nombre es requerido');
  if (input.scopes.length === 0) throw new Error('Selecciona al menos un permiso');

  // Generar key: cifra_sk_<32 bytes hex>
  const rawKey = `cifra_sk_${randomBytes(32).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 16); // "cifra_sk_" + 7 chars
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const key = await prisma.apiKey.create({
    data: {
      tenantId: session.tenantId,
      name:     input.name.trim(),
      keyHash,
      keyPrefix,
      scopes:   input.scopes,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
    select: { id: true },
  });

  revalidatePath('/configuracion/integraciones');
  // Devolver el key en texto plano SOLO esta vez
  return { id: key.id, key: rawKey };
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!key || key.tenantId !== session.tenantId) throw new Error('API key no encontrada');

  await prisma.apiKey.update({ where: { id: keyId }, data: { active: false } });
  revalidatePath('/configuracion/integraciones');
}
