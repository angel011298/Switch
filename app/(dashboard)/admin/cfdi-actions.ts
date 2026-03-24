'use server';

/**
 * Switch OS — Server Actions: Facturación CFDI 4.0
 * =================================================
 * Acciones del servidor para crear, consultar y cancelar
 * facturas electrónicas. Protegidas por autenticación.
 *
 * Ref: CFF Art. 29, 29-A | Anexo 20 CFDI 4.0
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { createCfdi, storeCsd } from '@/lib/cfdi';
import type { CfdiInput } from '@/lib/cfdi';
import { MockPac } from '@/lib/cfdi/pac/mock-pac';
import { revalidatePath } from 'next/cache';

// ─── HELPERS ───────────────────────────────────────────

async function requireAuth() {
  const session = await getSwitchSession();
  if (!session) {
    throw new Error('No autenticado');
  }
  return session;
}

// ─── FACTURACIÓN ───────────────────────────────────────

/**
 * Crear y timbrar una factura CFDI 4.0.
 */
export async function createInvoice(input: CfdiInput) {
  const session = await requireAuth();

  // Verificar que el tenant del usuario coincide
  if (session.tenantId !== input.tenantId) {
    throw new Error('No autorizado para facturar en este tenant');
  }

  const result = await createCfdi(input, new MockPac());

  revalidatePath('/billing');
  return result;
}

/**
 * Obtener facturas del tenant del usuario actual.
 */
export async function getInvoices(page: number = 1, pageSize: number = 20) {
  const session = await requireAuth();

  if (!session.tenantId) {
    throw new Error('Tenant no configurado');
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { fechaEmision: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        serie: true,
        folio: true,
        uuid: true,
        status: true,
        fechaEmision: true,
        receptorRfc: true,
        receptorNombre: true,
        total: true,
        moneda: true,
        tipoComprobante: true,
        metodoPago: true,
      },
    }),
    prisma.invoice.count({
      where: { tenantId: session.tenantId },
    }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      total: Number(inv.total),
    })),
    total,
    pages: Math.ceil(total / pageSize),
  };
}

/**
 * Obtener el XML de una factura por ID.
 */
export async function getInvoiceXml(invoiceId: string) {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      tenantId: true,
      xmlTimbrado: true,
      uuid: true,
      serie: true,
      folio: true,
    },
  });

  if (!invoice) throw new Error('Factura no encontrada');
  if (invoice.tenantId !== session.tenantId) throw new Error('No autorizado');

  return {
    xml: invoice.xmlTimbrado,
    filename: `${invoice.serie ?? 'F'}${invoice.folio}_${invoice.uuid ?? 'draft'}.xml`,
  };
}

/**
 * Cancelar una factura (via PAC mock por ahora).
 */
export async function cancelInvoice(invoiceId: string, motivo: string, folioSustitucion?: string) {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) throw new Error('Factura no encontrada');
  if (invoice.tenantId !== session.tenantId) throw new Error('No autorizado');
  if (invoice.status !== 'STAMPED') throw new Error('Solo se pueden cancelar facturas timbradas');
  if (!invoice.uuid) throw new Error('La factura no tiene UUID');

  const pac = new MockPac();
  const result = await pac.cancel(
    invoice.uuid,
    invoice.emisorRfc,
    motivo,
    folioSustitucion
  );

  if (result.success) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });
  }

  revalidatePath('/billing');
  return { success: result.success, acuse: result.acuse };
}

// ─── CSD VAULT ─────────────────────────────────────────

/**
 * Subir CSD (.cer, .key, contraseña) para el tenant.
 * Acepta FormData con los archivos.
 */
export async function uploadCsd(formData: FormData) {
  const session = await requireAuth();

  if (!session.tenantId) {
    throw new Error('Tenant no configurado');
  }

  const cerFile = formData.get('cer') as File | null;
  const keyFile = formData.get('key') as File | null;
  const password = formData.get('password') as string | null;

  if (!cerFile) throw new Error('Archivo .cer es requerido');
  if (!keyFile) throw new Error('Archivo .key es requerido');
  if (!password) throw new Error('Contraseña es requerida');

  // Validar extensiones
  if (!cerFile.name.endsWith('.cer')) throw new Error('El archivo debe tener extensión .cer');
  if (!keyFile.name.endsWith('.key')) throw new Error('El archivo debe tener extensión .key');

  // Convertir a Buffer
  const cerBuffer = Buffer.from(await cerFile.arrayBuffer());
  const keyBuffer = Buffer.from(await keyFile.arrayBuffer());

  const vault = await storeCsd(session.tenantId, cerBuffer, keyBuffer, password);

  revalidatePath('/admin');
  return {
    success: true,
    noCertificado: vault.noCertificado,
    validFrom: vault.validFrom.toISOString(),
    validTo: vault.validTo.toISOString(),
  };
}
