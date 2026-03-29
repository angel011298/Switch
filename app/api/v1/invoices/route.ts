/**
 * CIFRA Public REST API v1
 * GET /api/v1/invoices — Lista facturas del tenant autenticado vía API Key
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const tenantId = await authenticateApiKey(req);
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      select: {
        id: true, folio: true, series: true, status: true,
        total: true, subtotal: true, taxAmount: true,
        currency: true, paymentMethod: true,
        customer: { select: { name: true, rfc: true } },
        createdAt: true, stampedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.invoice.count({ where: { tenantId, ...(status ? { status } : {}) } }),
  ]);

  // Update lastUsedAt
  await updateApiKeyUsage(req);

  return NextResponse.json({
    data: invoices.map((inv) => ({
      id: inv.id,
      folio: `${inv.series ?? ''}${inv.folio}`,
      status: inv.status,
      customer: inv.customer,
      subtotal: Number(inv.subtotal),
      tax: Number(inv.taxAmount),
      total: Number(inv.total),
      currency: inv.currency,
      paymentMethod: inv.paymentMethod,
      createdAt: inv.createdAt.toISOString(),
      stampedAt: inv.stampedAt?.toISOString() ?? null,
    })),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  });
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function authenticateApiKey(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const rawKey = match[1];
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { tenantId: true, active: true, expiresAt: true, scopes: true },
  });

  if (!apiKey || !apiKey.active) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  if (!apiKey.scopes.includes('read:invoices')) return null;

  return apiKey.tenantId;
}

async function updateApiKeyUsage(req: NextRequest): Promise<void> {
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return;
  const keyHash = createHash('sha256').update(match[1]).digest('hex');
  await prisma.apiKey.updateMany({ where: { keyHash }, data: { lastUsedAt: new Date() } }).catch(() => {});
}
