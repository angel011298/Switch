/**
 * GET /api/reports/cfdi/[id]
 * ===========================
 * Descarga el PDF de representación impresa del CFDI.
 * Query: ?email=1 → también envía el PDF por correo al receptor
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import QRCode from 'qrcode';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { CfdiDocument, type CfdiData } from '@/lib/reports/pdf/cfdi';
import { sendEmail } from '@/lib/email/mailer';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        tenant: { select: { name: true, rfc: true, legalName: true, logoUrl: true } },
      },
    });

    if (!invoice || invoice.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // QR de verificación SAT
    let qrDataUrl: string | undefined;
    if (invoice.uuid) {
      const qrUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${invoice.uuid}&re=${invoice.emisorRfc}&rr=${invoice.receptorRfc}&tt=${Number(invoice.total).toFixed(6)}&fe=${(invoice.selloSat ?? '').slice(-8)}`;
      qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 128, margin: 1 });
    }

    const cfdiData: CfdiData = {
      uuid:               invoice.uuid,
      serie:              invoice.serie,
      folio:              invoice.folio,
      fechaEmision:       invoice.fechaEmision,
      tipoComprobante:    invoice.tipoComprobante,
      formaPago:          invoice.formaPago,
      metodoPago:         invoice.metodoPago,
      moneda:             invoice.moneda,
      lugarExpedicion:    invoice.lugarExpedicion,
      condicionesDePago:  invoice.condicionesDePago,
      emisorRfc:          invoice.emisorRfc,
      emisorNombre:       invoice.emisorNombre,
      emisorRegimenFiscal: invoice.emisorRegimenFiscal,
      receptorRfc:        invoice.receptorRfc,
      receptorNombre:     invoice.receptorNombre,
      receptorDomicilioFiscal: invoice.receptorDomicilioFiscal,
      receptorRegimenFiscal: invoice.receptorRegimenFiscal,
      receptorUsoCfdi:    invoice.receptorUsoCfdi,
      items: invoice.items.map((item) => ({
        claveProdServ:    item.claveProdServ,
        descripcion:      item.descripcion,
        cantidad:         Number(item.cantidad),
        claveUnidad:      item.claveUnidad,
        unidad:           item.unidad,
        valorUnitario:    Number(item.valorUnitario),
        importe:          Number(item.importe),
        descuento:        Number(item.descuento ?? 0),
        trasladoTasaOCuota: item.trasladoTasaOCuota ? Number(item.trasladoTasaOCuota) : null,
        trasladoImporte:  item.trasladoImporte ? Number(item.trasladoImporte) : null,
        retencionImporte: item.retencionImporte ? Number(item.retencionImporte) : null,
      })),
      subtotal:          Number(invoice.subtotal),
      descuento:         invoice.descuento ? Number(invoice.descuento) : undefined,
      totalImpuestosTrasladados: invoice.totalImpuestosTrasladados ? Number(invoice.totalImpuestosTrasladados) : undefined,
      totalImpuestosRetenidos:   invoice.totalImpuestosRetenidos   ? Number(invoice.totalImpuestosRetenidos)   : undefined,
      total:             Number(invoice.total),
      noCertificadoSat:  invoice.noCertificadoSat,
      selloSat:          invoice.selloSat,
      selloCfd:          (invoice as any).sello ?? null,
      cadenaOriginal:    invoice.cadenaOriginal,
      qrDataUrl,
      tenantLogoUrl:     invoice.tenant.logoUrl,
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(CfdiDocument, { invoice: cfdiData }) as ReactElement<DocumentProps>
    );

    const filename = `CFDI_${invoice.serie ?? 'A'}${invoice.folio}_${invoice.receptorRfc}.pdf`;

    if (req.nextUrl.searchParams.get('email') === '1' && (invoice as any).receptorEmail) {
      await sendEmail({
        to: (invoice as any).receptorEmail,
        subject: `Factura ${invoice.serie ?? 'A'}${invoice.folio} — ${invoice.emisorNombre}`,
        html: `<p>Estimado/a ${invoice.receptorNombre},</p><p>Adjunto su CFDI ${invoice.serie ?? 'A'}${invoice.folio}.</p><p>Total: <strong>$${Number(invoice.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${invoice.moneda}</strong></p>`,
        attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
      }).catch(console.error);
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[reports/cfdi]', err);
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 });
  }
}
