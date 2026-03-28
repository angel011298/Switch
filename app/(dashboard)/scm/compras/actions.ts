'use server';

/**
 * CIFRA — SCM Compras Server Actions
 * =====================================
 * FASE 31: Órdenes de compra y proveedores.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface SupplierRow {
  id: string;
  name: string;
  rfc: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  isActive: boolean;
}

export interface PurchaseOrderRow {
  id: string;
  orderNumber: number;
  status: string;
  supplierId: string | null;
  supplierName: string | null;
  total: number;
  itemCount: number;
  expectedAt: string | null;
  createdAt: string;
}

export interface PurchaseOrderDetail extends PurchaseOrderRow {
  notes: string | null;
  items: {
    id: string;
    productId: string | null;
    productName: string;
    quantity: number;
    quantityReceived: number;
    unitCost: number;
    subtotal: number;
  }[];
}

// ─── PROVEEDORES ─────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<SupplierRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, rfc: true, email: true, phone: true, contactName: true, isActive: true },
  });
  return suppliers;
}

export async function createSupplier(input: {
  name: string;
  rfc?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (!input.name.trim()) throw new Error('El nombre es requerido');

  const s = await prisma.supplier.create({
    data: {
      tenantId:    session.tenantId,
      name:        input.name.trim(),
      rfc:         input.rfc?.trim().toUpperCase() || null,
      email:       input.email?.trim() || null,
      phone:       input.phone?.trim() || null,
      address:     input.address?.trim() || null,
      contactName: input.contactName?.trim() || null,
    },
    select: { id: true },
  });

  revalidatePath('/scm/compras');
  return s.id;
}

// ─── ÓRDENES DE COMPRA ────────────────────────────────────────────────────────

export async function getPurchaseOrders(): Promise<PurchaseOrderRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const orders = await prisma.purchaseOrder.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return orders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    supplierId: o.supplierId,
    supplierName: o.supplier?.name ?? null,
    total: Number(o.total),
    itemCount: o._count.items,
    expectedAt: o.expectedAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getPurchaseOrderDetail(id: string): Promise<PurchaseOrderDetail | null> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { name: true } },
      items: true,
    },
  });

  if (!order || order.tenantId !== session.tenantId) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    supplierId: order.supplierId,
    supplierName: order.supplier?.name ?? null,
    total: Number(order.total),
    itemCount: order.items.length,
    expectedAt: order.expectedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    notes: order.notes,
    items: order.items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: Number(i.quantity),
      quantityReceived: Number(i.quantityReceived),
      unitCost: Number(i.unitCost),
      subtotal: Number(i.subtotal),
    })),
  };
}

export async function createPurchaseOrder(input: {
  supplierId?: string;
  notes?: string;
  expectedAt?: string;
  items: { productId?: string; productName: string; quantity: number; unitCost: number }[];
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (input.items.length === 0) throw new Error('La orden debe tener al menos un producto');

  const tid = session.tenantId;

  // Get next order number
  const last = await prisma.purchaseOrder.findFirst({
    where: { tenantId: tid },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });
  const orderNumber = (last?.orderNumber ?? 0) + 1;

  const total = input.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const order = await prisma.purchaseOrder.create({
    data: {
      tenantId:    tid,
      orderNumber,
      supplierId:  input.supplierId || null,
      notes:       input.notes?.trim() || null,
      total,
      expectedAt:  input.expectedAt ? new Date(input.expectedAt) : null,
      items: {
        create: input.items.map(i => ({
          productId:   i.productId || null,
          productName: i.productName.trim(),
          quantity:    i.quantity,
          unitCost:    i.unitCost,
          subtotal:    i.quantity * i.unitCost,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath('/scm/compras');
  return order.id;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
  if (!order || order.tenantId !== session.tenantId) throw new Error('Orden no encontrada');

  await prisma.purchaseOrder.update({ where: { id: orderId }, data: { status } });
  revalidatePath('/scm/compras');
}

/**
 * Registra recepción de mercancía:
 * - Actualiza quantityReceived de cada item
 * - Crea StockMovement ENTRADA por cada producto con trackStock
 * - Actualiza status de la orden (PARTIAL / RECEIVED)
 */
export async function receiveGoods(
  orderId: string,
  received: { itemId: string; quantityReceived: number }[]
): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  const tenantId = session.tenantId;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.tenantId !== tenantId) throw new Error('Orden no encontrada');

  // Default warehouse
  const warehouse = await prisma.warehouse.findFirst({
    where: { tenantId, isDefault: true, active: true },
    select: { id: true },
  });

  for (const recv of received) {
    if (recv.quantityReceived <= 0) continue;

    const item = order.items.find(i => i.id === recv.itemId);
    if (!item) continue;

    await prisma.purchaseOrderItem.update({
      where: { id: recv.itemId },
      data: { quantityReceived: { increment: recv.quantityReceived } },
    });

    // StockMovement ENTRADA
    if (item.productId && warehouse) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, trackStock: true },
      });

      if (product?.trackStock) {
        const quantityBefore = product.stock;
        const quantityAfter  = quantityBefore + recv.quantityReceived;

        await prisma.$transaction([
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: recv.quantityReceived } },
          }),
          prisma.stockMovement.create({
            data: {
              tenantId,
              warehouseId:    warehouse.id,
              productId:      item.productId,
              type:           'ENTRADA',
              quantity:       recv.quantityReceived,
              quantityBefore,
              quantityAfter,
              reference:      `OC-${order.orderNumber}`,
              notes:          `Recepción OC #${order.orderNumber}`,
            },
          }),
        ]);
      }
    }
  }

  // Update order status
  const updatedOrder = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  const allReceived = updatedOrder!.items.every(
    i => Number(i.quantityReceived) >= Number(i.quantity)
  );
  const anyReceived = updatedOrder!.items.some(i => Number(i.quantityReceived) > 0);

  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : order.status },
  });

  revalidatePath('/scm/compras');
  revalidatePath('/scm/inventarios');
}
