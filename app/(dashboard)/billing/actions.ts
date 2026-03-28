'use server';

/**
 * CIFRA — Billing Server Actions
 * =====================================
 * FASE 13: Acciones del módulo de facturación CFDI 4.0.
 * Expone getInvoices, getCsdStatus, downloadXml, cancelInvoice
 * directamente desde el módulo /billing (sin pasar por /admin).
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { createCfdi, storeCsd } from '@/lib/cfdi';
import type { CfdiInput } from '@/lib/cfdi';
import { MockPac } from '@/lib/cfdi/pac/mock-pac';
import { notifyInvoiceStamped } from '@/lib/notifications/trigger';
import { revalidatePath } from 'next/cache';
import { generateJournalFromCfdi, type ParsedCfdiData } from '@/lib/accounting/journal-engine';
import { createJournalEntryFromInput } from '@/lib/accounting/create-journal';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface InvoiceListItem {
  id: string;
  serie: string | null;
  folio: number;
  uuid: string | null;
  status: string;
  fechaEmision: string;
  receptorRfc: string;
  receptorNombre: string;
  total: number;
  tipoComprobante: string;
  metodoPago: string;
}

export interface CsdStatusInfo {
  exists: boolean;
  noCertificado?: string;
  validFrom?: string;
  validTo?: string;
  isExpired?: boolean;
}

// ─── Facturas ─────────────────────────────────────────────────────────────────

export async function getInvoiceList(page = 1, pageSize = 30): Promise<{
  invoices: InvoiceListItem[];
  total: number;
  pages: number;
}> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return { invoices: [], total: 0, pages: 0 };

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
        tipoComprobante: true,
        metodoPago: true,
      },
    }),
    prisma.invoice.count({ where: { tenantId: session.tenantId } }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      fechaEmision: inv.fechaEmision.toISOString(),
      total: parseFloat(String(inv.total)),
    })),
    total,
    pages: Math.ceil(total / pageSize),
  };
}

export async function getCsdStatus(): Promise<CsdStatusInfo> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return { exists: false };

  const vault = await prisma.csdVault.findFirst({
    where: { tenantId: session.tenantId },
    select: {
      noCertificado: true,
      validFrom: true,
      validTo: true,
    },
  });

  if (!vault) return { exists: false };

  const isExpired = new Date(vault.validTo) < new Date();

  return {
    exists: true,
    noCertificado: vault.noCertificado,
    validFrom: vault.validFrom.toISOString(),
    validTo: vault.validTo.toISOString(),
    isExpired,
  };
}

export async function downloadInvoiceXml(invoiceId: string): Promise<{
  xml: string;
  filename: string;
}> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      tenantId: true,
      serie: true,
      folio: true,
      uuid: true,
      xmlTimbrado: true,
    },
  });

  if (!invoice || invoice.tenantId !== session.tenantId) {
    throw new Error('Factura no encontrada');
  }
  if (!invoice.xmlTimbrado) {
    throw new Error('XML no disponible (factura no timbrada)');
  }

  return {
    xml: invoice.xmlTimbrado,
    filename: `${invoice.serie ?? 'F'}${String(invoice.folio).padStart(8, '0')}_${invoice.uuid ?? 'draft'}.xml`,
  };
}

export async function cancelInvoiceAction(
  invoiceId: string,
  motivo: string,
  folioSustitucion?: string
): Promise<{ success: boolean; acuse?: string }> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.tenantId !== session.tenantId) throw new Error('No autorizado');
  if (invoice.status !== 'STAMPED') throw new Error('Solo facturas timbradas pueden cancelarse');
  if (!invoice.uuid) throw new Error('Factura sin UUID');

  const pac = new MockPac();
  const result = await pac.cancel(invoice.uuid, invoice.emisorRfc, motivo, folioSustitucion);

  if (result.success) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });
  }

  revalidatePath('/billing');
  return { success: result.success, acuse: result.acuse ?? undefined };
}

// ─── Crear factura ─────────────────────────────────────────────────────────

/**
 * Emite un CFDI 4.0.
 * @param input      - Datos del comprobante
 * @param posOrderId - (opcional) ID del PosOrder de origen.
 *                     Si se provee y el CFDI se timbra correctamente,
 *                     marca la orden como facturada (isInvoiced=true).
 */
export async function createInvoiceAction(input: CfdiInput, posOrderId?: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  // Sobreescribir tenantId siempre con el de la sesión (seguridad)
  const secureInput: CfdiInput = { ...input, tenantId: session.tenantId };

  const result = await createCfdi(secureInput, new MockPac());

  // ── Interconexión CFDI → Contabilidad (best-effort) ──
  if (result.status === 'STAMPED' && result.uuid) {
    try {
      // Leer datos completos de la factura recién creada
      const invoice = await prisma.invoice.findUnique({
        where: { id: result.invoiceId },
        select: {
          subtotal: true,
          total: true,
          totalImpuestosTrasladados: true,
          totalImpuestosRetenidos: true,
          emisorRfc: true,
          emisorNombre: true,
          receptorRfc: true,
          receptorNombre: true,
          fechaEmision: true,
          formaPago: true,
          moneda: true,
        },
      });

      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { rfc: true },
      });

      if (invoice && tenant?.rfc) {
        const parsedData: ParsedCfdiData = {
          uuid: result.uuid,
          tipoComprobante: input.tipoComprobante ?? 'I',
          fecha: invoice.fechaEmision,
          emisorRfc: invoice.emisorRfc,
          emisorNombre: invoice.emisorNombre,
          receptorRfc: invoice.receptorRfc,
          receptorNombre: invoice.receptorNombre,
          subtotal: Number(invoice.subtotal),
          total: Number(invoice.total),
          totalImpuestosTrasladados: Number(invoice.totalImpuestosTrasladados),
          totalImpuestosRetenidos: Number(invoice.totalImpuestosRetenidos),
          formaPago: invoice.formaPago,
          moneda: invoice.moneda,
        };

        const journalInput = generateJournalFromCfdi(parsedData, tenant.rfc);
        if (journalInput) {
          await createJournalEntryFromInput(
            session.tenantId,
            { ...journalInput, tenantId: session.tenantId },
            'CFDI_EMITIDO',
            result.invoiceId
          );
        }
      }
    } catch (journalErr) {
      console.warn('[CFDI→Accounting] Póliza omitida:', journalErr);
    }
  }

  // ── Interconexión POS → CFDI: marcar orden como facturada ──
  if (result.status === 'STAMPED' && posOrderId) {
    try {
      await prisma.posOrder.update({
        where: { id: posOrderId, tenantId: session.tenantId },
        data: { isInvoiced: true, invoiceId: result.invoiceId },
      });
    } catch (posErr) {
      console.warn('[POS→CFDI] No se pudo marcar orden como facturada:', posErr);
    }
  }

  // ── Notificación: factura timbrada ──────────────────────────────────────────
  if (result.status === 'STAMPED') {
    const folio = `${input.serie ?? 'A'}${input.folio ?? ''}`;
    notifyInvoiceStamped({
      tenantId: session.tenantId,
      folio,
      receptorNombre: input.receptorNombre ?? '',
      total: Number(input.total ?? 0),
      invoiceId: result.invoiceId ?? '',
    }).catch(() => {});
  }

  revalidatePath('/billing');
  revalidatePath('/pos');
  return result;
}

// ─── CSD ───────────────────────────────────────────────────────────────────

export async function uploadCsdAction(formData: FormData) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const cerFile = formData.get('cer') as File | null;
  const keyFile = formData.get('key') as File | null;
  const password = formData.get('password') as string | null;

  if (!cerFile) throw new Error('Archivo .cer es requerido');
  if (!keyFile) throw new Error('Archivo .key es requerido');
  if (!password) throw new Error('Contraseña es requerida');
  if (!cerFile.name.endsWith('.cer')) throw new Error('Debe ser archivo .cer');
  if (!keyFile.name.endsWith('.key')) throw new Error('Debe ser archivo .key');

  const cerBuffer = Buffer.from(await cerFile.arrayBuffer());
  const keyBuffer = Buffer.from(await keyFile.arrayBuffer());

  const vault = await storeCsd(session.tenantId, cerBuffer, keyBuffer, password);

  revalidatePath('/billing');
  return {
    success: true,
    noCertificado: vault.noCertificado,
    validFrom: vault.validFrom.toISOString(),
    validTo: vault.validTo.toISOString(),
  };
}

// ─── Interconexión POS → CFDI ─────────────────────────────────────────────────

/**
 * Obtiene una orden POS lista para pre-llenar el wizard de facturación.
 * Valida que la orden pertenezca al tenant y no haya sido facturada ya.
 */
export async function getPosOrderForBilling(orderId: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  const tenantId = session.tenantId;

  const order = await prisma.posOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.tenantId !== tenantId) throw new Error('Orden no encontrada');
  if (order.isInvoiced) throw new Error('Esta orden ya fue facturada');

  // Enriquecer ítems con claves SAT del catálogo de productos
  const productIds = order.items.map((i) => i.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, claveProdServ: true, claveUnidad: true, unidad: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return {
    id: order.id,
    ticketCode: order.ticketCode,
    paymentMethod: order.paymentMethod,
    items: order.items.map((i) => {
      const prod = i.productId ? productMap.get(i.productId) : undefined;
      return {
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),   // sin IVA
        taxRate: Number(i.taxRate),
        claveProdServ: prod?.claveProdServ ?? '84111506',
        claveUnidad: prod?.claveUnidad ?? 'H87',
        unidad: prod?.unidad ?? 'Pieza',
      };
    }),
  };
}

// ─── Customers para wizard ────────────────────────────────────────────────────

export async function searchCustomers(query: string) {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  return prisma.customer.findMany({
    where: {
      tenantId: session.tenantId,
      OR: [
        { rfc: { contains: query.toUpperCase() } },
        { legalName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      rfc: true,
      legalName: true,
      zipCode: true,
      defaultUsoCfdi: true,
      taxRegime: { select: { satCode: true } },
    },
    take: 10,
  });
}

// ─── Tenant emisor ─────────────────────────────────────────────────────────

export async function getTenantProfile() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      rfc: true,
      legalName: true,
      zipCode: true,
      taxRegime: { select: { satCode: true } },
    },
  });

  return tenant;
}
