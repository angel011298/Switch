/**
 * CIFRA Public REST API v1
 * GET  /api/v1/customers — Lista clientes del tenant autenticado vía API Key
 * POST /api/v1/customers — Crea un cliente en el tenant autenticado vía API Key
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/prisma';

// ── GET /api/v1/customers ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const tenantId = await authenticateApiKey(req, 'read:customers');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const type   = searchParams.get('type');
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const where = {
    tenantId,
    ...(type ? { type } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { rfc:  { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        rfc: true,
        email: true,
        phone: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.customer.count({ where }),
  ]);

  await updateApiKeyUsage(req);

  return NextResponse.json({
    data: customers.map((c) => ({
      id: c.id,
      name: c.name,
      rfc: c.rfc ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      type: c.type,
      createdAt: c.createdAt.toISOString(),
    })),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  });
}

// ── POST /api/v1/customers ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const tenantId = await authenticateApiKey(req, 'write:customers');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    name?: string;
    rfc?: string;
    email?: string;
    phone?: string;
    type?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'El campo name es requerido' }, { status: 422 });
  }

  const validTypes = ['FISICA', 'MORAL'];
  const type = body.type && validTypes.includes(body.type) ? body.type : 'FISICA';

  try {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name:  body.name.trim(),
        rfc:   body.rfc?.trim().toUpperCase() ?? null,
        email: body.email?.trim().toLowerCase() ?? null,
        phone: body.phone?.trim() ?? null,
        type,
      },
      select: { id: true, name: true },
    });

    await updateApiKeyUsage(req);

    return NextResponse.json({ id: customer.id, name: customer.name }, { status: 201 });
  } catch (err: unknown) {
    // Unique constraint on RFC within tenant
    const isPrismaError = typeof err === 'object' && err !== null && 'code' in err;
    if (isPrismaError && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un cliente con ese RFC en este tenant' }, { status: 409 });
    }
    console.error('[POST /api/v1/customers]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function authenticateApiKey(req: NextRequest, requiredScope: string): Promise<string | null> {
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
  if (!apiKey.scopes.includes(requiredScope)) return null;

  return apiKey.tenantId;
}

async function updateApiKeyUsage(req: NextRequest): Promise<void> {
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return;
  const keyHash = createHash('sha256').update(match[1]).digest('hex');
  await prisma.apiKey.updateMany({ where: { keyHash }, data: { lastUsedAt: new Date() } }).catch(() => {});
}
