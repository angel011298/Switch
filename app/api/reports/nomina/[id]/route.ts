/**
 * GET /api/reports/nomina/[id]
 * ==============================
 * Descarga el recibo de nómina de un PayrollItem. ?email=1 → envía por correo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { NominaDocument, type NominaData } from '@/lib/reports/pdf/nomina';
import { sendEmail } from '@/lib/email/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const item = await prisma.payrollItem.findUnique({
      where: { id: params.id },
      include: {
        payrollRun: {
          select: { tenantId: true, periodLabel: true, startDate: true, endDate: true },
        },
        employee: {
          select: {
            rfc: true, curp: true, name: true, email: true,
            position: true, department: true, imssNumber: true,
            bankAccount: true, salaryType: true,
          },
        },
      },
    });

    if (!item || item.payrollRun.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, rfc: true, legalName: true, logoUrl: true },
    });

    const nominaData: NominaData = {
      tenantNombre:      tenant?.legalName ?? tenant?.name ?? '',
      tenantRfc:         tenant?.rfc ?? '',
      tenantLogoUrl:     tenant?.logoUrl,
      periodLabel:       item.payrollRun.periodLabel,
      startDate:         item.payrollRun.startDate,
      endDate:           item.payrollRun.endDate,
      empleadoNombre:    item.employee.name,
      empleadoRfc:       item.employee.rfc ?? null,
      empleadoCurp:      item.employee.curp,
      puesto:            item.employee.position,
      departamento:      item.employee.department,
      imssNumber:        item.employee.imssNumber,
      bankAccount:       item.employee.bankAccount,
      salaryType:        item.employee.salaryType,
      sueldoBruto:       Number(item.bruto),
      isr:               Number(item.isr),
      imss:              Number(item.imss),
      absenceDeduct:     Number(item.absenceDeduct),
      totalPercepciones: Number(item.bruto),
      totalDeducciones:  Number(item.isr) + Number(item.imss) + Number(item.absenceDeduct),
      neto:              Number(item.neto),
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(NominaDocument, { data: nominaData }) as ReactElement<DocumentProps>
    );

    const safeName = item.employee.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filename = `Nomina_${safeName}_${item.payrollRun.periodLabel.replace(/\s+/g, '_')}.pdf`;

    if (req.nextUrl.searchParams.get('email') === '1' && item.employee.email) {
      await sendEmail({
        to: item.employee.email,
        subject: `Recibo de Nómina — ${item.payrollRun.periodLabel}`,
        html: `<p>Estimado/a ${item.employee.name},</p><p>Adjunto su recibo de nómina periodo <strong>${item.payrollRun.periodLabel}</strong>. Neto a pagar: <strong>$${Number(item.neto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p><p>Atentamente,<br/>${tenant?.name ?? ''}</p>`,
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
    console.error('[reports/nomina]', err);
    return NextResponse.json({ error: 'Error generando recibo' }, { status: 500 });
  }
}
