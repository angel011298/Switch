/**
 * GET /api/reports/estado-cuenta?customerId=xxx&format=pdf|xlsx&email=1
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { EstadoCuentaDocument, type EstadoCuentaData, type EstadoCuentaRow } from '@/lib/reports/pdf/estado-cuenta';
import { generateEstadoCuentaExcel } from '@/lib/reports/excel/estado-cuenta';
import { sendEmail } from '@/lib/email/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const sp         = req.nextUrl.searchParams;
    const customerId = sp.get('customerId');
    const format     = sp.get('format') ?? 'pdf';
    const sendMail   = sp.get('email') === '1';

    if (!customerId) return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { tenantId: session.tenantId, receptorRfc: customer.rfc },
      orderBy: { fechaEmision: 'asc' },
      select: {
        id: true, serie: true, folio: true, fechaEmision: true,
        total: true, status: true,
        items: { select: { descripcion: true }, take: 1 },
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, rfc: true, legalName: true, logoUrl: true },
    });

    const statusMap: Record<string, EstadoCuentaRow['status']> = {
      STAMPED: 'PAGADA', DRAFT: 'PENDIENTE', SEALED: 'PENDIENTE',
      CANCELLED: 'CANCELADA', ERROR: 'PENDIENTE',
    };

    const filas: EstadoCuentaRow[] = invoices.map((inv) => ({
      folio:    `${inv.serie ?? 'A'}${inv.folio}`,
      fecha:    inv.fechaEmision,
      concepto: inv.items[0]?.descripcion ?? 'Servicios',
      importe:  Number(inv.total),
      status:   statusMap[inv.status] ?? 'PENDIENTE',
    }));

    const totalFacturado = filas.reduce((s, f) => s + f.importe, 0);
    const totalCobrado   = filas.filter(f => f.status === 'PAGADA').reduce((s, f) => s + f.importe, 0);
    const totalPendiente = filas.filter(f => ['PENDIENTE', 'VENCIDA'].includes(f.status)).reduce((s, f) => s + f.importe, 0);
    const now = new Date();

    const data: EstadoCuentaData = {
      tenantNombre:  tenant?.legalName ?? tenant?.name ?? '',
      tenantRfc:     tenant?.rfc ?? '',
      tenantLogoUrl: tenant?.logoUrl,
      clienteNombre: customer.legalName,
      clienteRfc:    customer.rfc,
      clienteEmail:  customer.email,
      fechaDesde:    invoices[0]?.fechaEmision ?? now,
      fechaHasta:    invoices[invoices.length - 1]?.fechaEmision ?? now,
      generadoEn:    now,
      filas,
      totalFacturado,
      totalCobrado,
      totalPendiente,
      moneda: 'MXN',
    };

    const safeName = customer.legalName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);

    // Excel
    if (format === 'xlsx') {
      const buf      = await generateEstadoCuentaExcel(data);
      const filename = `EstadoCuenta_${safeName}_${now.toISOString().slice(0, 10)}.xlsx`;
      if (sendMail && customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Estado de Cuenta — ${tenant?.name ?? ''}`,
          html: '<p>Adjunto su estado de cuenta en formato Excel.</p>',
          attachments: [{ filename, content: buf, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }],
        }).catch(console.error);
      }
      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // PDF (default)
    const pdfBuffer = await renderToBuffer(
      React.createElement(EstadoCuentaDocument, { data }) as ReactElement<DocumentProps>
    );
    const filename = `EstadoCuenta_${safeName}_${now.toISOString().slice(0, 10)}.pdf`;
    if (sendMail && customer.email) {
      await sendEmail({
        to: customer.email,
        subject: `Estado de Cuenta — ${tenant?.name ?? ''}`,
        html: '<p>Adjunto su estado de cuenta.</p>',
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
    console.error('[reports/estado-cuenta]', err);
    return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 });
  }
}
