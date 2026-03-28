/**
 * GET /api/pos/ticket/[orderId]
 * ==============================
 * Genera y descarga el ticket PDF de una venta POS.
 * FASE 29: Integración con @react-pdf/renderer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { TicketDocument, type TicketData } from '@/lib/reports/pdf/ticket';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const order = await prisma.posOrder.findUnique({
      where: { id: params.orderId },
      include: {
        items: true,
        tenant: {
          select: {
            legalName: true,
            rfc: true,
            logoUrl: true,
            // address fields if available
          },
        },
      },
    });

    if (!order || order.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const ticketData: TicketData = {
      ticketCode: order.ticketCode,
      date: order.closedAt ?? order.createdAt,
      items: order.items.map(i => ({
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxRate: Number(i.taxRate),
        total: Number(i.total),
      })),
      subtotal: Number(order.subtotal),
      totalTax: Number(order.totalTax),
      discount: Number(order.discount),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      amountPaid: Number(order.amountPaid),
      changeDue: Number(order.changeDue),
      tenantName: order.tenant?.legalName ?? 'CIFRA',
      tenantRfc: order.tenant?.rfc ?? null,
      tenantAddress: null,
      logoUrl: order.tenant?.logoUrl ?? null,
    };

    const element = React.createElement(TicketDocument, { data: ticketData });
    const buffer = await renderToBuffer(element as ReactElement<DocumentProps>);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${order.ticketCode}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[Ticket PDF]', error);
    return NextResponse.json({ error: 'Error generando ticket' }, { status: 500 });
  }
}
