'use server';

/**
 * CIFRA — Server Actions del POS
 * ====================================
 * Operaciones del servidor para el Punto de Venta.
 * Solo se llaman al cargar catálogo y al cerrar venta (checkout).
 * La calculadora corre 100% en el cliente.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { generateTicketCode } from '@/lib/pos/calculator';
import { revalidatePath } from 'next/cache';
import {
  generateJournalFromPosOrder,
} from '@/lib/accounting/journal-engine';
import { createJournalEntryFromInput } from '@/lib/accounting/create-journal';

// ─── AUTH ──────────────────────────────────────────────

async function requireAuth() {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    throw new Error('No autenticado o sin tenant');
  }
  return session;
}

// ─── CATÁLOGO ──────────────────────────────────────────

/**
 * Carga el catálogo de productos del Tenant.
 * Se cachea en Zustand en el cliente.
 */
export async function loadProducts() {
  const session = await requireAuth();

  const products = await prisma.product.findMany({
    where: { tenantId: session.tenantId!, isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      category: true,
      price: true,
      priceIncludesTax: true,
      taxRate: true,
      stock: true,
      trackStock: true,
      claveProdServ: true,
      claveUnidad: true,
      unidad: true,
      imageUrl: true,
      isActive: true,
    },
  });

  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    taxRate: Number(p.taxRate),
  }));
}

/**
 * Crear un producto en el catálogo.
 */
export async function createProduct(input: {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  description?: string;
  claveProdServ: string;
  claveUnidad?: string;
  unidad?: string;
  price: number;
  priceIncludesTax?: boolean;
  taxRate?: number;
  cost?: number;
  stock?: number;
  trackStock?: boolean;
  imageUrl?: string;
}) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const product = await prisma.product.create({
    data: {
      tenantId,
      name: input.name,
      sku: input.sku || null,
      barcode: input.barcode || null,
      category: input.category || null,
      description: input.description || null,
      claveProdServ: input.claveProdServ,
      claveUnidad: input.claveUnidad ?? 'H87',
      unidad: input.unidad ?? 'Pieza',
      price: input.price,
      priceIncludesTax: input.priceIncludesTax ?? true,
      taxRate: input.taxRate ?? 0.16,
      cost: input.cost ?? null,
      stock: input.stock ?? 0,
      trackStock: input.trackStock ?? false,
      imageUrl: input.imageUrl || null,
    },
  });

  revalidatePath('/pos');
  return { success: true, productId: product.id };
}

// ─── CHECKOUT ──────────────────────────────────────────

export interface CheckoutInput {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;     // SIN IVA
    taxRate: number;
    taxAmount: number;
    subtotal: number;
    total: number;
    discount: number;
  }>;
  subtotal: number;
  totalTax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  changeDue: number;
}

/**
 * Cierra una venta (checkout).
 * Genera un PosOrder con código de ticket único.
 */
export async function checkout(input: CheckoutInput) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  // ── Validación de stock (bloquea ventas con inventario negativo) ──
  for (const item of input.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { trackStock: true, stock: true, name: true },
    });
    if (product?.trackStock) {
      const stockAfter = product.stock - Math.ceil(item.quantity);
      if (stockAfter < 0) {
        throw new Error(
          `Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${Math.ceil(item.quantity)}`
        );
      }
    }
  }

  // Generar código de ticket único
  let ticketCode = generateTicketCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.posOrder.findUnique({ where: { ticketCode } });
    if (!existing) break;
    ticketCode = generateTicketCode();
    attempts++;
  }

  // Obtener siguiente número de orden
  const lastOrder = await prisma.posOrder.findFirst({
    where: { tenantId },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });
  const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

  // Crear orden con items en transacción
  const order = await prisma.posOrder.create({
    data: {
      tenantId,
      ticketCode,
      orderNumber,
      subtotal: input.subtotal,
      totalTax: input.totalTax,
      discount: input.discount,
      total: input.total,
      paymentMethod: input.paymentMethod,
      amountPaid: input.amountPaid,
      changeDue: input.changeDue,
      cashierId: session.userId,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          total: item.total,
          discount: item.discount,
        })),
      },
    },
    include: { items: true },
  });

  // Descontar stock si aplica
  for (const item of input.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { trackStock: true },
    });
    if (product?.trackStock) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: Math.ceil(item.quantity) } },
      });
    }
  }

  // ── Póliza contable automática (best-effort, no bloquea el cobro) ──
  try {
    const journalInput = generateJournalFromPosOrder({
      orderId: order.id,
      ticketCode: order.ticketCode,
      date: order.closedAt ?? new Date(),
      subtotal: input.subtotal,
      totalTax: input.totalTax,
      total: input.total,
      paymentMethod: input.paymentMethod,
    });
    await createJournalEntryFromInput(
      tenantId,
      { ...journalInput, tenantId },
      'POS_SALE',
      order.id
    );
  } catch (journalErr) {
    // El catálogo puede no estar inicializado — no interrumpir la venta
    console.warn('[POS→Accounting] Póliza omitida:', journalErr);
  }

  revalidatePath('/pos');

  return {
    success: true,
    ticketCode: order.ticketCode,
    orderNumber: order.orderNumber,
    total: Number(order.total),
    orderId: order.id,
  };
}

/**
 * Obtener historial de ventas del día.
 */
export async function getTodayOrders() {
  const session = await requireAuth();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await prisma.posOrder.findMany({
    where: {
      tenantId: session.tenantId!,
      closedAt: { gte: startOfDay },
    },
    orderBy: { closedAt: 'desc' },
    include: { items: true },
  });

  return orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    totalTax: Number(o.totalTax),
    discount: Number(o.discount),
    total: Number(o.total),
    amountPaid: Number(o.amountPaid),
    changeDue: Number(o.changeDue),
  }));
}

// ─── INTERCONEXIÓN POS → CFDI ──────────────────────────

/**
 * Retorna los datos de una orden POS listos para pre-llenar
 * el wizard de Nueva Factura CFDI.
 * Valida que la orden pertenezca al tenant y no esté ya facturada.
 */
export async function getPosOrderForBilling(orderId: string) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const order = await prisma.posOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.tenantId !== tenantId) throw new Error('Orden no encontrada');
  if (order.isInvoiced) throw new Error('Esta orden ya fue facturada');

  // Enriquecer ítems con datos SAT del catálogo de productos
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
    subtotal: Number(order.subtotal),
    totalTax: Number(order.totalTax),
    total: Number(order.total),
    items: order.items.map((i) => {
      const prod = i.productId ? productMap.get(i.productId) : undefined;
      return {
        productId: i.productId,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxRate: Number(i.taxRate),
        claveProdServ: prod?.claveProdServ ?? '84111506',
        claveUnidad: prod?.claveUnidad ?? 'H87',
        unidad: prod?.unidad ?? 'Pieza',
      };
    }),
  };
}
