'use server';

/**
 * Switch OS — Server Actions del POS
 * ====================================
 * Operaciones del servidor para el Punto de Venta.
 * Solo se llaman al cargar catálogo y al cerrar venta (checkout).
 * La calculadora corre 100% en el cliente.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { generateTicketCode } from '@/lib/pos/calculator';
import { revalidatePath } from 'next/cache';

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
