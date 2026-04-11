'use server';

/**
 * CIFRA — Facturación Masiva (Batch CFDI)
 * =========================================
 * Genera facturas DRAFT en lote desde datos CSV parseados en el cliente.
 * El timbrado individual se hace después desde /billing/historial.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface MasivaBillingRow {
  rfcReceptor: string;
  nombreReceptor: string;
  usoCfdi: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  claveUnidad?: string;
  claveProducto?: string;
}

export interface MasivaResult {
  index: number;
  rfcReceptor: string;
  concepto: string;
  total: number;
  status: 'OK' | 'ERROR';
  message?: string;
  invoiceId?: string;
}

export async function processMasiveUpload(rows: MasivaBillingRow[]): Promise<MasivaResult[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');

  // Get tenant data for invoice fields
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { rfc: true, legalName: true, taxRegimeId: true, zipCode: true },
  });

  // Get last folio for this tenant to auto-increment
  const lastInvoice = await prisma.invoice.findFirst({
    where: { tenantId: session.tenantId, serie: 'M' },
    orderBy: { folio: 'desc' },
    select: { folio: true },
  });
  let nextFolio = (lastInvoice?.folio ?? 0) + 1;

  const results: MasivaResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const qty = row.cantidad;
      const price = row.precioUnitario;
      const discountPct = row.descuento ?? 0;
      const subtotalItem = qty * price;
      const discountAmount = subtotalItem * discountPct / 100;
      const importeItem = subtotalItem - discountAmount;
      const ivaAmount = importeItem * 0.16;
      const total = importeItem + ivaAmount;

      const invoice = await prisma.invoice.create({
        data: {
          tenantId: session.tenantId,
          serie: 'M',
          folio: nextFolio++,
          status: 'DRAFT',
          tipoComprobante: 'I',
          metodoPago: 'PUE',
          formaPago: '99',
          moneda: 'MXN',
          lugarExpedicion: tenant.zipCode ?? '06600',
          emisorRfc: tenant.rfc ?? 'XAXX010101000',
          emisorNombre: tenant.legalName ?? 'Mi Empresa',
          emisorRegimenFiscal: '601',
          receptorRfc: row.rfcReceptor,
          receptorNombre: row.nombreReceptor,
          receptorDomicilioFiscal: '06600',
          receptorRegimenFiscal: '616',
          receptorUsoCfdi: row.usoCfdi ?? 'G03',
          subtotal: importeItem,
          descuento: discountAmount,
          totalImpuestosTrasladados: ivaAmount,
          totalImpuestosRetenidos: 0,
          total,
          items: {
            create: [{
              claveProdServ: row.claveProducto ?? '84111506',
              claveUnidad: row.claveUnidad ?? 'E48',
              unidad: 'Servicio',
              descripcion: row.concepto,
              cantidad: qty,
              valorUnitario: price,
              descuento: discountAmount,
              importe: importeItem,
              trasladoBase: importeItem,
              trasladoImpuesto: '002',
              trasladoTipoFactor: 'Tasa',
              trasladoTasaOCuota: 0.16,
              trasladoImporte: ivaAmount,
            }],
          },
        },
      });

      results.push({ index: i, rfcReceptor: row.rfcReceptor, concepto: row.concepto, total, status: 'OK', invoiceId: invoice.id });
    } catch (err) {
      results.push({
        index: i, rfcReceptor: row.rfcReceptor, concepto: row.concepto, total: 0,
        status: 'ERROR', message: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  revalidatePath('/billing/masiva');
  return results;
}

export async function getMasivaStats() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalMasiva, todayCount] = await Promise.all([
    prisma.invoice.count({ where: { tenantId: session.tenantId, status: 'DRAFT', serie: 'M' } }),
    prisma.invoice.count({ where: { tenantId: session.tenantId, serie: 'M', createdAt: { gte: today } } }),
  ]);
  return { totalMasiva, todayCount };
}
