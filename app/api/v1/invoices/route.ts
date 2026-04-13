/**
 * CIFRA Public REST API v1
 * GET /api/v1/invoices — Lista facturas del tenant autenticado vía API Key
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkApiRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const auth = await checkApiRateLimit(req, 'read:invoices');
  if (auth instanceof NextResponse) return auth;
  const { tenantId, rateLimitHeaders } = auth;

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
  }, { headers: rateLimitHeaders });
}
