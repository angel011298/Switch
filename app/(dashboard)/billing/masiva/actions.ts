'use server';

/**
 * CIFRA — Facturación Masiva (Batch CFDI)
 * =========================================
 * Procesa hasta 500 facturas desde un array de filas (Excel/CSV parseado en cliente).
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

  const results: MasivaResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const subtotal = row.cantidad * row.precioUnitario * (1 - (row.descuento ?? 0) / 100);
      const iva = subtotal * 0.16;
      const total = subtotal + iva;

      const invoice = await prisma.invoice.create({
        data: {
          tenantId: session.tenantId,
          folio: `M-${Date.now()}-${i}`,
          rfcReceptor: row.rfcReceptor,
          nombreReceptor: row.nombreReceptor,
          usoCfdi: row.usoCfdi ?? 'G03',
          tipoComprobante: 'I',
          metodoPago: 'PUE',
          formaPago: '99',
          moneda: 'MXN',
          tipoCambio: 1,
          subtotal,
          totalIva: iva,
          totalIeps: 0,
          totalRetIsr: 0,
          totalRetIva: 0,
          total,
          status: 'DRAFT',
          items: {
            create: [{
              concepto: row.concepto,
              claveProdServ: row.claveProducto ?? '84111506',
              claveUnidad: row.claveUnidad ?? 'E48',
              unidad: 'Servicio',
              cantidad: row.cantidad,
              valorUnitario: row.precioUnitario,
              descuento: row.descuento ? row.precioUnitario * row.cantidad * row.descuento / 100 : 0,
              importe: subtotal,
              tasaIva: 0.16,
              tasaIeps: 0,
              tasaRetIsr: 0,
              tasaRetIva: 0,
              ivaAmount: iva,
              iepsAmount: 0,
              retIsrAmount: 0,
              retIvaAmount: 0,
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

export async function getRecentBatchStats() {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No session');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalDrafts, todayCount] = await Promise.all([
    prisma.invoice.count({ where: { tenantId: session.tenantId, status: 'DRAFT', folio: { startsWith: 'M-' } } }),
    prisma.invoice.count({ where: { tenantId: session.tenantId, createdAt: { gte: today }, folio: { startsWith: 'M-' } } }),
  ]);
  return { totalDrafts, todayCount };
}
