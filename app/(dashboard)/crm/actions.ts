'use server';

/**
 * Switch OS — Server Actions: CRM Onboarding Fiscal
 * ===================================================
 * Acciones para gestionar clientes/terceros fiscales.
 * Incluye escaneo QR → scraping SAT → alta automática.
 *
 * Ref: CFF Art. 27, 29-A fracción IV
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { validateRfc, normalizeRfc } from '@/lib/crm/rfc-validator';
import { scrapeCsf, isValidSatUrl } from '@/lib/crm/sat-csf-scraper';
import type { PersonType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ─── HELPERS ───────────────────────────────────────────

async function requireAuth() {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    throw new Error('No autenticado o sin tenant asignado');
  }
  return session;
}

// ─── SCRAPING SAT ──────────────────────────────────────

/**
 * Recibe la URL del QR de la CSF, hace scraping al SAT
 * y retorna los datos fiscales extraídos.
 */
export async function scrapeCustomerFromQr(qrUrl: string) {
  await requireAuth();

  if (!qrUrl || !isValidSatUrl(qrUrl)) {
    return {
      success: false,
      data: null,
      error: 'URL inválida. Debe ser una URL del dominio sat.gob.mx',
    };
  }

  const result = await scrapeCsf(qrUrl);
  return result;
}

// ─── CRUD CLIENTES ─────────────────────────────────────

export interface CreateCustomerInput {
  rfc: string;
  legalName: string;
  zipCode: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  tags?: string;
  defaultUsoCfdi?: string;
  taxRegimeSatCode?: string;  // Código SAT del régimen (ej. "601")
  source?: string;            // MANUAL, QR_SCAN
}

/**
 * Crear un nuevo cliente/tercero fiscal.
 * Valida el RFC y vincula automáticamente el régimen fiscal.
 */
export async function createCustomer(input: CreateCustomerInput) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  // Normalizar y validar RFC
  const rfc = normalizeRfc(input.rfc);
  const rfcValidation = validateRfc(rfc);

  if (!rfcValidation.isValid) {
    throw new Error(`RFC inválido: ${rfcValidation.error}`);
  }

  // Verificar que no exista ya para este tenant
  const existing = await prisma.customer.findUnique({
    where: { tenantId_rfc: { tenantId, rfc } },
  });

  if (existing) {
    throw new Error(`Ya existe un cliente con RFC ${rfc} en tu organización.`);
  }

  // Buscar régimen fiscal en catálogo si se proporcionó
  let taxRegimeId: string | null = null;
  if (input.taxRegimeSatCode) {
    const regime = await prisma.taxRegime.findUnique({
      where: { satCode: input.taxRegimeSatCode },
    });
    if (regime) {
      taxRegimeId = regime.id;
    }
  }

  // Validar código postal (5 dígitos)
  if (input.zipCode && !/^\d{5}$/.test(input.zipCode)) {
    throw new Error('El código postal debe ser de 5 dígitos.');
  }

  const personType = rfcValidation.personType as PersonType;

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      rfc,
      legalName: input.legalName.trim(),
      personType,
      zipCode: input.zipCode,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      notes: input.notes?.trim() || null,
      tags: input.tags?.trim() || null,
      defaultUsoCfdi: input.defaultUsoCfdi || 'G03',
      taxRegimeId,
      source: input.source ?? 'MANUAL',
    },
    include: {
      taxRegime: true,
    },
  });

  revalidatePath('/crm');
  return { success: true, customer };
}

/**
 * Actualizar un cliente existente.
 */
export async function updateCustomer(
  customerId: string,
  input: Partial<CreateCustomerInput>
) {
  const session = await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) throw new Error('Cliente no encontrado');
  if (customer.tenantId !== session.tenantId) throw new Error('No autorizado');

  const data: Record<string, unknown> = {};

  if (input.legalName !== undefined) data.legalName = input.legalName.trim();
  if (input.zipCode !== undefined) {
    if (!/^\d{5}$/.test(input.zipCode)) throw new Error('Código postal inválido (5 dígitos)');
    data.zipCode = input.zipCode;
  }
  if (input.email !== undefined) data.email = input.email?.trim() || null;
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
  if (input.address !== undefined) data.address = input.address?.trim() || null;
  if (input.city !== undefined) data.city = input.city?.trim() || null;
  if (input.state !== undefined) data.state = input.state?.trim() || null;
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
  if (input.tags !== undefined) data.tags = input.tags?.trim() || null;
  if (input.defaultUsoCfdi !== undefined) data.defaultUsoCfdi = input.defaultUsoCfdi;

  if (input.taxRegimeSatCode !== undefined) {
    if (input.taxRegimeSatCode) {
      const regime = await prisma.taxRegime.findUnique({
        where: { satCode: input.taxRegimeSatCode },
      });
      data.taxRegimeId = regime?.id ?? null;
    } else {
      data.taxRegimeId = null;
    }
  }

  // RFC no se puede cambiar (se debe crear un nuevo cliente)

  await prisma.customer.update({ where: { id: customerId }, data });
  revalidatePath('/crm');
  return { success: true };
}

/**
 * Desactivar un cliente (soft delete).
 */
export async function deactivateCustomer(customerId: string) {
  const session = await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) throw new Error('Cliente no encontrado');
  if (customer.tenantId !== session.tenantId) throw new Error('No autorizado');

  await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: false },
  });

  revalidatePath('/crm');
  return { success: true };
}

/**
 * Obtener clientes del tenant con paginación.
 */
export async function getCustomers(
  page: number = 1,
  pageSize: number = 20,
  search?: string
) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const where: Record<string, unknown> = {
    tenantId,
    isActive: true,
  };

  // Búsqueda por RFC o nombre
  if (search) {
    where.OR = [
      { rfc: { contains: search.toUpperCase() } },
      { legalName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: where as any,
      include: { taxRegime: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where: where as any }),
  ]);

  return {
    customers,
    total,
    pages: Math.ceil(total / pageSize),
  };
}
