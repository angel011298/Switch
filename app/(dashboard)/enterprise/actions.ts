'use server';

/**
 * CIFRA — Enterprise Multi-empresa Server Actions
 * FASE 40 (FINAL): Gestión de grupos empresariales con múltiples subsidiarias
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  memberCount: number;
  tenantCount: number;
  createdAt: string;
}

export interface OrgMemberRow {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface OrgTenantRow {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantRfc: string | null;
  alias: string | null;
  order: number;
  // Aggregated KPIs
  invoiceCount: number;
  employeeCount: number;
  monthlyRevenue: number;
  createdAt: string;
}

export interface ConsolidatedKpis {
  totalRevenue: number;        // Suma de ingresos de todas las empresas (este mes)
  totalEmployees: number;
  totalInvoices: number;
  totalCustomers: number;
  topCompany: string | null;   // Empresa con mayor revenue
  companiesCount: number;
}

// ─── ORGANIZACIONES ───────────────────────────────────────────────────────────

export async function getMyOrganizations(): Promise<OrganizationRow[]> {
  const session = await getSwitchSession();
  if (!session?.userId) return [];

  const orgs = await prisma.organization.findMany({
    where: {
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    include: {
      _count: { select: { members: true, tenants: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    logoUrl: o.logoUrl,
    plan: o.plan,
    memberCount: o._count.members,
    tenantCount: o._count.tenants,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function createOrganization(input: {
  name: string;
  slug: string;
  plan?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.userId) throw new Error('No autenticado');

  if (!input.name.trim()) throw new Error('El nombre es requerido');
  if (!input.slug.trim()) throw new Error('El slug es requerido');

  // Sanitize slug
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) throw new Error('El slug ya está en uso. Elige uno diferente');

  const org = await prisma.organization.create({
    data: {
      name:    input.name.trim(),
      slug,
      ownerId: session.userId,
      plan:    input.plan ?? 'ENTERPRISE',
      members: {
        create: { userId: session.userId, role: 'OWNER' },
      },
    },
    select: { id: true },
  });

  revalidatePath('/enterprise');
  return org.id;
}

// ─── EMPRESAS / TENANTS ───────────────────────────────────────────────────────

export async function getOrgTenants(orgId: string): Promise<OrgTenantRow[]> {
  const session = await getSwitchSession();
  if (!session?.userId) return [];

  // Verify membership
  const member = await prisma.orgMember.findFirst({
    where: { organizationId: orgId, userId: session.userId },
  });
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org || (org.ownerId !== session.userId && !member)) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const orgTenants = await prisma.orgTenant.findMany({
    where: { organizationId: orgId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const results: OrgTenantRow[] = [];
  for (const ot of orgTenants) {
    const [tenant, invoiceCount, employeeCount, revenue] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: ot.tenantId }, select: { name: true, rfc: true } }),
      prisma.invoice.count({ where: { tenantId: ot.tenantId } }),
      prisma.employee.count({ where: { tenantId: ot.tenantId, active: true } }),
      prisma.invoice.aggregate({
        where: { tenantId: ot.tenantId, status: 'STAMPED', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
    ]);

    results.push({
      id: ot.id,
      tenantId: ot.tenantId,
      tenantName: tenant?.name ?? 'Empresa',
      tenantRfc: tenant?.rfc ?? null,
      alias: ot.alias,
      order: ot.order,
      invoiceCount,
      employeeCount,
      monthlyRevenue: Number(revenue._sum.total ?? 0),
      createdAt: ot.createdAt.toISOString(),
    });
  }

  return results;
}

export async function addTenantToOrg(orgId: string, input: {
  tenantId: string;
  alias?: string;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.userId) throw new Error('No autenticado');

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org || org.ownerId !== session.userId) throw new Error('Sin permisos para esta organización');

  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new Error('Empresa no encontrada');

  await prisma.orgTenant.create({
    data: {
      organizationId: orgId,
      tenantId: input.tenantId,
      alias: input.alias?.trim() || null,
    },
  });

  revalidatePath('/enterprise');
}

export async function removeTenantFromOrg(orgTenantId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.userId) throw new Error('No autenticado');

  const ot = await prisma.orgTenant.findUnique({
    where: { id: orgTenantId },
    include: { organization: { select: { ownerId: true } } },
  });
  if (!ot || ot.organization.ownerId !== session.userId) throw new Error('Sin permisos');

  await prisma.orgTenant.delete({ where: { id: orgTenantId } });
  revalidatePath('/enterprise');
}

export async function getConsolidatedKpis(orgId: string): Promise<ConsolidatedKpis> {
  const session = await getSwitchSession();
  if (!session?.userId) return emptyKpis();

  const orgTenants = await prisma.orgTenant.findMany({
    where: { organizationId: orgId },
    select: { tenantId: true },
  });

  if (orgTenants.length === 0) return emptyKpis();

  const tenantIds = orgTenants.map((t) => t.tenantId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [employees, invoices, customers, revenueByTenant] = await Promise.all([
    prisma.employee.count({ where: { tenantId: { in: tenantIds }, active: true } }),
    prisma.invoice.count({ where: { tenantId: { in: tenantIds } } }),
    prisma.customer.count({ where: { tenantId: { in: tenantIds } } }),
    Promise.all(
      tenantIds.map(async (tid) => {
        const tenant = await prisma.tenant.findUnique({ where: { id: tid }, select: { name: true } });
        const agg = await prisma.invoice.aggregate({
          where: { tenantId: tid, status: 'STAMPED', createdAt: { gte: startOfMonth } },
          _sum: { total: true },
        });
        return { name: tenant?.name ?? tid, revenue: Number(agg._sum.total ?? 0) };
      })
    ),
  ]);

  const totalRevenue = revenueByTenant.reduce((s, r) => s + r.revenue, 0);
  const topCompany = revenueByTenant.length > 0
    ? revenueByTenant.sort((a, b) => b.revenue - a.revenue)[0].name
    : null;

  return {
    totalRevenue,
    totalEmployees: employees,
    totalInvoices: invoices,
    totalCustomers: customers,
    topCompany,
    companiesCount: tenantIds.length,
  };
}

function emptyKpis(): ConsolidatedKpis {
  return { totalRevenue: 0, totalEmployees: 0, totalInvoices: 0, totalCustomers: 0, topCompany: null, companiesCount: 0 };
}
