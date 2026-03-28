import { NextResponse } from 'next/server';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET /api/bi/top-productos?limit=8&months=6
export async function GET(req: Request) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(20, parseInt(url.searchParams.get('limit') ?? '8'));
  const months = parseInt(url.searchParams.get('months') ?? '6');
  const tid = session.tenantId;

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  // Group PosOrderItems by productId
  const items = await prisma.posOrderItem.groupBy({
    by: ['productId', 'productName'],
    where: {
      order: { tenantId: tid, createdAt: { gte: since } },
    },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  // Enrich with SKU from Product
  const productIds = items.map(i => i.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sku: true },
  });
  const skuMap = new Map(products.map(p => [p.id, p.sku]));

  return NextResponse.json(items.map(i => ({
    productId: i.productId ?? '',
    name: i.productName,
    sku: i.productId ? (skuMap.get(i.productId) ?? null) : null,
    unitsSold: Number(i._sum.quantity ?? 0),
    revenue: Number(i._sum.subtotal ?? 0),
  })));
}
