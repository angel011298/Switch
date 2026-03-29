/**
 * CIFRA — Webhook Trigger Engine (FASE 37)
 * Dispatches events to all active webhook endpoints subscribed to the event.
 */
import prisma from '@/lib/prisma';
import { createHmac } from 'crypto';

export type WebhookEventType =
  | 'invoice.created' | 'invoice.stamped' | 'invoice.cancelled'
  | 'pos.sale'
  | 'customer.created' | 'customer.updated'
  | 'payment.received'
  | 'stock.low'
  | 'payroll.closed'
  | 'employee.created'
  | 'order.completed'
  | 'leave.approved';

export interface WebhookPayload {
  event: WebhookEventType;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Dispatches a webhook event to all subscribed endpoints for the tenant.
 * Fire-and-forget: errors are caught silently.
 */
export async function triggerWebhook(
  tenantId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { tenantId, active: true, events: { has: event } },
      select: { id: true, url: true, secret: true },
    });

    if (endpoints.length === 0) return;

    const payload: WebhookPayload = {
      event,
      tenantId,
      timestamp: new Date().toISOString(),
      data,
    };

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      endpoints.map((endpoint) => deliverWebhook(endpoint, body, event))
    );
  } catch {
    // Never throw — webhooks are best-effort
  }
}

async function deliverWebhook(
  endpoint: { id: string; url: string; secret: string },
  body: string,
  event: string
): Promise<void> {
  const signature = createHmac('sha256', endpoint.secret)
    .update(body)
    .digest('hex');

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CIFRA-Signature': `sha256=${signature}`,
        'X-CIFRA-Event': event,
        'User-Agent': 'CIFRA-Webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 500);
    success = res.ok;
  } catch {
    success = false;
  }

  // Record delivery attempt
  await prisma.webhookDelivery.create({
    data: {
      webhookId: endpoint.id,
      event,
      payload: JSON.parse(body),
      statusCode,
      responseBody,
      success,
      deliveredAt: success ? new Date() : null,
    },
  }).catch(() => {});
}
