'use server';

/**
 * CIFRA — MRP Server Actions
 * ============================
 * FASE 33: BOM, Órdenes de Producción, Calidad.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface BomRow {
  id: string;
  productId: string;
  productName: string;
  version: string;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
}

export interface BomDetail extends BomRow {
  notes: string | null;
  items: {
    id: string;
    componentId: string;
    componentName: string;
    componentSku: string | null;
    quantity: number;
    unit: string;
  }[];
}

export interface ProductionOrderRow {
  id: string;
  bomId: string;
  productName: string;
  version: string;
  quantity: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  inspectionResult: string | null;
  createdAt: string;
}

// ─── BOM ──────────────────────────────────────────────────────────────────────

export async function getBoms(): Promise<BomRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const boms = await prisma.bOM.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return boms.map(b => ({
    id: b.id,
    productId: b.productId,
    productName: b.product.name,
    version: b.version,
    isActive: b.isActive,
    itemCount: b._count.items,
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function getBomDetail(id: string): Promise<BomDetail | null> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return null;

  const bom = await prisma.bOM.findUnique({
    where: { id },
    include: {
      product: { select: { name: true } },
      items: {
        include: { component: { select: { name: true, sku: true } } },
      },
      _count: { select: { items: true } },
    },
  });

  if (!bom || bom.tenantId !== session.tenantId) return null;

  return {
    id: bom.id,
    productId: bom.productId,
    productName: bom.product.name,
    version: bom.version,
    isActive: bom.isActive,
    itemCount: bom._count.items,
    notes: bom.notes,
    createdAt: bom.createdAt.toISOString(),
    items: bom.items.map(i => ({
      id: i.id,
      componentId: i.componentId,
      componentName: i.component.name,
      componentSku: i.component.sku,
      quantity: Number(i.quantity),
      unit: i.unit,
    })),
  };
}

export async function createBom(input: {
  productId: string;
  version?: string;
  notes?: string;
  items: { componentId: string; quantity: number; unit?: string }[];
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (input.items.length === 0) throw new Error('La BOM debe tener al menos un componente');

  const bom = await prisma.bOM.create({
    data: {
      tenantId:  session.tenantId,
      productId: input.productId,
      version:   input.version ?? '1.0',
      notes:     input.notes?.trim() || null,
      items: {
        create: input.items.map(i => ({
          componentId: i.componentId,
          quantity:    i.quantity,
          unit:        i.unit ?? 'pza',
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath('/mrp/bom');
  return bom.id;
}

// ─── ÓRDENES DE PRODUCCIÓN ────────────────────────────────────────────────────

export async function getProductionOrders(): Promise<ProductionOrderRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const orders = await prisma.productionOrder.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      bom: { include: { product: { select: { name: true } } } },
      inspections: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return orders.map(o => ({
    id: o.id,
    bomId: o.bomId,
    productName: o.bom.product.name,
    version: o.bom.version,
    quantity: Number(o.quantity),
    status: o.status,
    startDate: o.startDate?.toISOString() ?? null,
    endDate: o.endDate?.toISOString() ?? null,
    notes: o.notes,
    inspectionResult: o.inspections[0]?.result ?? null,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function createProductionOrder(input: {
  bomId: string;
  quantity: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const bom = await prisma.bOM.findUnique({ where: { id: input.bomId } });
  if (!bom || bom.tenantId !== session.tenantId) throw new Error('BOM no encontrada');

  const order = await prisma.productionOrder.create({
    data: {
      tenantId:  session.tenantId,
      bomId:     input.bomId,
      quantity:  input.quantity,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate:   input.endDate   ? new Date(input.endDate)   : null,
      notes:     input.notes?.trim() || null,
    },
    select: { id: true },
  });

  revalidatePath('/mrp/planificacion');
  return order.id;
}

export async function startProductionOrder(orderId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const order = await prisma.productionOrder.findUnique({ where: { id: orderId } });
  if (!order || order.tenantId !== session.tenantId) throw new Error('Orden no encontrada');
  if (order.status !== 'PLANNED') throw new Error('La orden no está en estado PLANNED');

  await prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: 'IN_PROGRESS', startDate: order.startDate ?? new Date() },
  });

  revalidatePath('/mrp/planificacion');
}

/**
 * Completar orden de producción:
 * - Descontar componentes del inventario (StockMovement OUT)
 * - Incrementar stock del producto terminado (StockMovement IN)
 */
export async function completeProductionOrder(orderId: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  const tenantId = session.tenantId;

  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    include: { bom: { include: { items: true, product: { select: { id: true, name: true, stock: true, trackStock: true } } } } },
  });

  if (!order || order.tenantId !== tenantId) throw new Error('Orden no encontrada');
  if (order.status === 'COMPLETED') throw new Error('La orden ya fue completada');

  const warehouse = await prisma.warehouse.findFirst({
    where: { tenantId, isDefault: true, active: true },
    select: { id: true },
  });

  // Descontar componentes
  for (const item of order.bom.items) {
    const qty = Number(item.quantity) * Number(order.quantity);
    const component = await prisma.product.findUnique({
      where: { id: item.componentId },
      select: { stock: true, trackStock: true },
    });

    if (component?.trackStock && warehouse) {
      const qBefore = component.stock;
      const qAfter  = Math.max(0, qBefore - qty);
      await prisma.$transaction([
        prisma.product.update({ where: { id: item.componentId }, data: { stock: { decrement: qty } } }),
        prisma.stockMovement.create({
          data: {
            tenantId, warehouseId: warehouse.id, productId: item.componentId,
            type: 'SALIDA', quantity: -qty, quantityBefore: qBefore, quantityAfter: qAfter,
            reference: `OP-${orderId.slice(-8)}`, notes: 'Consumo en producción',
          },
        }),
      ]);
    }
  }

  // Incrementar producto terminado
  const finishedProduct = order.bom.product;
  if (finishedProduct.trackStock && warehouse) {
    const qty = Number(order.quantity);
    const qBefore = finishedProduct.stock;
    const qAfter  = qBefore + qty;
    await prisma.$transaction([
      prisma.product.update({ where: { id: finishedProduct.id }, data: { stock: { increment: qty } } }),
      prisma.stockMovement.create({
        data: {
          tenantId, warehouseId: warehouse.id, productId: finishedProduct.id,
          type: 'ENTRADA', quantity: qty, quantityBefore: qBefore, quantityAfter: qAfter,
          reference: `OP-${orderId.slice(-8)}`, notes: 'Producción completada',
        },
      }),
    ]);
  }

  await prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: 'COMPLETED', endDate: new Date() },
  });

  revalidatePath('/mrp/planificacion');
  revalidatePath('/scm/inventarios');
}

// ─── CALIDAD ──────────────────────────────────────────────────────────────────

export async function addQualityInspection(input: {
  productionOrderId: string;
  result: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const order = await prisma.productionOrder.findUnique({ where: { id: input.productionOrderId } });
  if (!order || order.tenantId !== session.tenantId) throw new Error('Orden no encontrada');

  await prisma.qualityInspection.create({
    data: {
      productionOrderId: input.productionOrderId,
      result:            input.result,
      notes:             input.notes?.trim() || null,
      inspectedAt:       new Date(),
    },
  });

  revalidatePath('/mrp/calidad');
}

export async function getQualityInspections() {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const inspections = await prisma.qualityInspection.findMany({
    where: { productionOrder: { tenantId: session.tenantId } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      productionOrder: {
        include: { bom: { include: { product: { select: { name: true } } } } },
      },
    },
  });

  return inspections.map(i => ({
    id: i.id,
    result: i.result,
    notes: i.notes,
    inspectedAt: i.inspectedAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    productName: i.productionOrder.bom.product.name,
    orderQuantity: Number(i.productionOrder.quantity),
    orderStatus: i.productionOrder.status,
    productionOrderId: i.productionOrderId,
  }));
}
