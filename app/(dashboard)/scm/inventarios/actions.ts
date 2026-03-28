'use server';

/**
 * CIFRA — SCM Inventarios Server Actions
 * ============================================
 * FASE 17: Gestión real de productos, almacenes y movimientos de stock.
 *
 * - Productos: CRUD + catálogo con stock en tiempo real
 * - Almacenes: crear/editar almacenes, bloqueo para inventario físico
 * - Movimientos: entradas, salidas manuales, ajustes, historial
 * - Alertas: productos con stock ≤ minStock
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface ProductRow {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  category: string | null;
  price: number;
  cost: number | null;
  stock: number;
  minStock: number;
  trackStock: boolean;
  isActive: boolean;
  isLowStock: boolean;   // stock <= minStock && trackStock
  margin: number | null; // (price - cost) / price * 100
}

export interface WarehouseRow {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isDefault: boolean;
  isLocked: boolean;
  active: boolean;
  movementsCount: number;
}

export interface StockMovementRow {
  id: string;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reference: string | null;
  notes: string | null;
  productName: string;
  productSku: string | null;
  warehouseName: string;
  createdAt: string;
}

export interface InventarioKpis {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;       // Σ (stock × cost) donde cost != null
  totalUnits: number;
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export async function getProductCatalog(): Promise<ProductRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const products = await prisma.product.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      category: true,
      price: true,
      cost: true,
      stock: true,
      minStock: true,
      trackStock: true,
      isActive: true,
    },
  });

  return products.map((p) => {
    const price = Number(p.price);
    const cost  = p.cost != null ? Number(p.cost) : null;
    const margin = cost != null && price > 0 ? ((price - cost) / price) * 100 : null;
    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      category: p.category,
      price,
      cost,
      stock: p.stock,
      minStock: p.minStock,
      trackStock: p.trackStock,
      isActive: p.isActive,
      isLowStock: p.trackStock && p.stock <= p.minStock,
      margin: margin != null ? round2(margin) : null,
    };
  });
}

export async function getInventarioKpis(): Promise<InventarioKpis> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return emptyKpis();

  const products = await prisma.product.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    select: { stock: true, minStock: true, cost: true, trackStock: true },
  });

  const lowStock    = products.filter((p) => p.trackStock && p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock  = products.filter((p) => p.trackStock && p.stock <= 0).length;
  const totalValue  = products.reduce((s, p) => {
    if (p.cost == null) return s;
    return s + p.stock * Number(p.cost);
  }, 0);
  const totalUnits  = products.reduce((s, p) => s + p.stock, 0);

  return {
    totalProducts:  products.length,
    activeProducts: products.length,
    lowStockCount:  lowStock,
    outOfStockCount: outOfStock,
    totalValue: round2(totalValue),
    totalUnits,
  };
}

export async function createProduct(input: {
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  claveProdServ: string;
  claveUnidad?: string;
  unidad?: string;
  price: number;
  priceIncludesTax?: boolean;
  taxRate?: number;
  cost?: number;
  minStock?: number;
  trackStock?: boolean;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  if (!input.name.trim()) throw new Error('El nombre del producto es requerido');
  if (input.price <= 0)   throw new Error('El precio debe ser mayor a cero');

  const product = await prisma.product.create({
    data: {
      tenantId:       session.tenantId,
      sku:            input.sku?.trim() || null,
      barcode:        input.barcode?.trim() || null,
      name:           input.name.trim(),
      description:    input.description?.trim() || null,
      category:       input.category?.trim() || null,
      claveProdServ:  input.claveProdServ.trim(),
      claveUnidad:    input.claveUnidad ?? 'H87',
      unidad:         input.unidad ?? 'Pieza',
      price:          input.price,
      priceIncludesTax: input.priceIncludesTax ?? true,
      taxRate:        input.taxRate ?? 0.16,
      cost:           input.cost ?? null,
      minStock:       input.minStock ?? 0,
      trackStock:     input.trackStock ?? false,
    },
    select: { id: true },
  });

  revalidatePath('/scm/inventarios');
  return product.id;
}

export async function updateProduct(productId: string, input: {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  minStock?: number;
  trackStock?: boolean;
  isActive?: boolean;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.tenantId !== session.tenantId) throw new Error('Producto no encontrado');

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.sku        !== undefined && { sku:       input.sku.trim() || null }),
      ...(input.barcode    !== undefined && { barcode:   input.barcode.trim() || null }),
      ...(input.name       !== undefined && { name:      input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() || null }),
      ...(input.category   !== undefined && { category:  input.category.trim() || null }),
      ...(input.price      !== undefined && { price:     input.price }),
      ...(input.cost       !== undefined && { cost:      input.cost }),
      ...(input.minStock   !== undefined && { minStock:  input.minStock }),
      ...(input.trackStock !== undefined && { trackStock: input.trackStock }),
      ...(input.isActive   !== undefined && { isActive:  input.isActive }),
    },
  });

  revalidatePath('/scm/inventarios');
}

// ─── ALMACENES ────────────────────────────────────────────────────────────────

export async function getWarehouses(): Promise<WarehouseRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId: session.tenantId, active: true },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { movements: true } } },
  });

  return warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    code: w.code,
    address: w.address,
    isDefault: w.isDefault,
    isLocked: w.isLocked,
    active: w.active,
    movementsCount: w._count.movements,
  }));
}

export async function getOrCreateDefaultWarehouse(): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const existing = await prisma.warehouse.findFirst({
    where: { tenantId: session.tenantId, isDefault: true, active: true },
    select: { id: true },
  });
  if (existing) return existing.id;

  const wh = await prisma.warehouse.create({
    data: {
      tenantId:  session.tenantId,
      name:      'Almacén Principal',
      code:      'ALM-01',
      isDefault: true,
    },
    select: { id: true },
  });
  return wh.id;
}

export async function createWarehouse(input: {
  name: string;
  code: string;
  address?: string;
  isDefault?: boolean;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (!input.name.trim()) throw new Error('El nombre es requerido');
  if (!input.code.trim()) throw new Error('El código es requerido');

  if (input.isDefault) {
    await prisma.warehouse.updateMany({
      where: { tenantId: session.tenantId },
      data:  { isDefault: false },
    });
  }

  const wh = await prisma.warehouse.create({
    data: {
      tenantId:  session.tenantId,
      name:      input.name.trim(),
      code:      input.code.trim().toUpperCase(),
      address:   input.address?.trim() || null,
      isDefault: input.isDefault ?? false,
    },
    select: { id: true },
  });

  revalidatePath('/scm/inventarios');
  return wh.id;
}

export async function toggleWarehouseLock(warehouseId: string): Promise<boolean> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!wh || wh.tenantId !== session.tenantId) throw new Error('Almacén no encontrado');

  const updated = await prisma.warehouse.update({
    where: { id: warehouseId },
    data:  { isLocked: !wh.isLocked },
    select: { isLocked: true },
  });

  revalidatePath('/scm/inventarios');
  return updated.isLocked;
}

// ─── MOVIMIENTOS DE STOCK ─────────────────────────────────────────────────────

/**
 * Registra un movimiento de stock y actualiza Product.stock atómicamente.
 * Tipo AJUSTE_POS / AJUSTE_NEG modifica la cantidad absoluta.
 * Tipos ENTRADA / SALIDA / DEVOLUCION son relativos.
 */
export async function adjustStock(input: {
  warehouseId: string;
  productId: string;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE_POS' | 'AJUSTE_NEG' | 'DEVOLUCION';
  quantity: number;   // Siempre positivo; el tipo define la dirección
  reference?: string;
  notes?: string;
}): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');
  if (input.quantity <= 0) throw new Error('La cantidad debe ser mayor a cero');

  // Verificar pertenencia
  const [wh, product] = await Promise.all([
    prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
    prisma.product.findUnique({   where: { id: input.productId    } }),
  ]);

  if (!wh || wh.tenantId !== session.tenantId) throw new Error('Almacén no encontrado');
  if (!product || product.tenantId !== session.tenantId) throw new Error('Producto no encontrado');
  if (wh.isLocked) throw new Error('El almacén está bloqueado para inventario físico');

  // Determinar delta de stock
  const isNegative = input.type === 'SALIDA' || input.type === 'AJUSTE_NEG';
  const delta = isNegative ? -Math.abs(input.quantity) : Math.abs(input.quantity);
  const quantityBefore = product.stock;
  const quantityAfter  = quantityBefore + delta;

  if (quantityAfter < 0) {
    throw new Error(
      `Stock insuficiente: disponible ${quantityBefore}, solicitado ${input.quantity}`
    );
  }

  await prisma.$transaction([
    // Actualizar stock del producto
    prisma.product.update({
      where: { id: input.productId },
      data:  { stock: { increment: delta } },
    }),
    // Registrar movimiento
    prisma.stockMovement.create({
      data: {
        tenantId:       session.tenantId,
        warehouseId:    input.warehouseId,
        productId:      input.productId,
        type:           input.type,
        quantity:       delta,
        quantityBefore,
        quantityAfter,
        reference:      input.reference?.trim() || null,
        notes:          input.notes?.trim() || null,
      },
    }),
  ]);

  revalidatePath('/scm/inventarios');
}

/**
 * Devuelve los últimos N movimientos del tenant.
 */
export async function getStockMovements(limit = 50): Promise<StockMovementRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const movements = await prisma.stockMovement.findMany({
    where:   { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    include: {
      product:   { select: { name: true, sku: true } },
      warehouse: { select: { name: true } },
    },
  });

  return movements.map((m) => ({
    id:             m.id,
    type:           m.type,
    quantity:       m.quantity,
    quantityBefore: m.quantityBefore,
    quantityAfter:  m.quantityAfter,
    reference:      m.reference,
    notes:          m.notes,
    productName:    m.product.name,
    productSku:     m.product.sku,
    warehouseName:  m.warehouse.name,
    createdAt:      m.createdAt.toISOString(),
  }));
}

/**
 * Retorna productos con stock <= minStock (solo los que tienen trackStock=true).
 */
export async function getLowStockAlerts(): Promise<ProductRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const products = await prisma.product.findMany({
    where: {
      tenantId:   session.tenantId,
      isActive:   true,
      trackStock: true,
      stock: { lte: prisma.product.fields.minStock },
    },
    orderBy: { stock: 'asc' },
    select: {
      id: true, sku: true, barcode: true, name: true, category: true,
      price: true, cost: true, stock: true, minStock: true,
      trackStock: true, isActive: true,
    },
  });

  return products.map((p) => ({
    id: p.id, sku: p.sku, barcode: p.barcode, name: p.name,
    category: p.category, price: Number(p.price),
    cost: p.cost != null ? Number(p.cost) : null,
    stock: p.stock, minStock: p.minStock,
    trackStock: p.trackStock, isActive: p.isActive,
    isLowStock: true,
    margin: null,
  }));
}

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

function emptyKpis(): InventarioKpis {
  return { totalProducts: 0, activeProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0, totalUnits: 0 };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
