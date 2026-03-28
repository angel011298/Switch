'use server';

/**
 * CIFRA — Server Actions: Auto-Factura Pública
 * ==================================================
 * Acciones para la vista pública de auto-facturación.
 * NO requieren autenticación (es una página pública).
 * Se valida por tenant_id + ticketCode.
 */

import prisma from '@/lib/prisma';
import { validateRfc, normalizeRfc } from '@/lib/crm/rfc-validator';

/**
 * Buscar un ticket POS por código.
 * Valida que el ticket pertenezca al tenant y no esté ya facturado.
 */
export async function lookupTicket(tenantId: string, ticketCode: string) {
  if (!tenantId || !ticketCode) {
    return { success: false, error: 'Datos incompletos' };
  }

  const order = await prisma.posOrder.findFirst({
    where: {
      tenantId,
      ticketCode: ticketCode.toUpperCase(),
    },
    include: {
      items: true,
      tenant: {
        select: { name: true, legalName: true, rfc: true, logoUrl: true },
      },
    },
  });

  if (!order) {
    return { success: false, error: 'Ticket no encontrado. Verifica el codigo e intenta de nuevo.' };
  }

  if (order.isInvoiced) {
    return { success: false, error: 'Este ticket ya fue facturado anteriormente.' };
  }

  return {
    success: true,
    order: {
      id: order.id,
      ticketCode: order.ticketCode,
      orderNumber: order.orderNumber,
      subtotal: Number(order.subtotal),
      totalTax: Number(order.totalTax),
      total: Number(order.total),
      closedAt: order.closedAt.toISOString(),
      tenantName: order.tenant.legalName ?? order.tenant.name,
      items: order.items.map((i) => ({
        name: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
    },
  };
}

/**
 * Generar CFDI para un ticket POS (auto-factura del cliente final).
 */
export async function generateSelfInvoice(input: {
  tenantId: string;
  ticketCode: string;
  orderId: string;
  rfc: string;
  nombre: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
}) {
  // Validar RFC
  const rfc = normalizeRfc(input.rfc);
  const rfcValidation = validateRfc(rfc);
  if (!rfcValidation.isValid) {
    return { success: false, error: `RFC invalido: ${rfcValidation.error}` };
  }

  // Validar CP
  if (!/^\d{5}$/.test(input.domicilioFiscal)) {
    return { success: false, error: 'Codigo postal debe ser de 5 digitos' };
  }

  // Verificar que el ticket exista y no esté facturado
  const order = await prisma.posOrder.findFirst({
    where: {
      id: input.orderId,
      tenantId: input.tenantId,
      ticketCode: input.ticketCode,
    },
    include: {
      items: true,
      tenant: {
        select: {
          rfc: true,
          legalName: true,
          zipCode: true,
          taxRegime: { select: { satCode: true } },
        },
      },
    },
  });

  if (!order) {
    return { success: false, error: 'Ticket no encontrado' };
  }

  if (order.isInvoiced) {
    return { success: false, error: 'Este ticket ya fue facturado' };
  }

  // Verificar que el tenant tenga datos fiscales completos
  const tenant = order.tenant;
  if (!tenant.rfc || !tenant.legalName || !tenant.zipCode || !tenant.taxRegime) {
    return {
      success: false,
      error: 'El negocio emisor no tiene su perfil fiscal completo. Contacta al establecimiento.',
    };
  }

  // Marcar como facturado (reservar)
  await prisma.posOrder.update({
    where: { id: order.id },
    data: { isInvoiced: true },
  });

  // En producción, aquí se llamaría a createCfdi() del motor CFDI.
  // Por ahora retornamos los datos para que el frontend muestre éxito.
  // La integración con el motor CFDI se completa cuando el tenant tenga CSD.

  const folio = order.orderNumber;

  return {
    success: true,
    uuid: `sandbox-${crypto.randomUUID()}`,
    serie: 'POS',
    folio,
    total: Number(order.total),
    message: 'Factura generada en modo sandbox. Se timbrará cuando el emisor configure su CSD.',
  };
}
