'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ShipmentRow {
  id: string;
  trackingNumber: string | null;
  carrier: string | null;
  status: string;
  origin: string | null;
  destination: string | null;
  estimatedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  purchaseOrderId: string | null;
  purchaseOrderNumber: number | null;
  createdAt: string;
}

export async function getShipments(): Promise<ShipmentRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const shipments = await prisma.shipment.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      purchaseOrder: { select: { orderNumber: true } },
    },
  });

  return shipments.map(s => ({
    id: s.id,
    trackingNumber: s.trackingNumber,
    carrier: s.carrier,
    status: s.status,
    origin: s.origin,
    destination: s.destination,
    estimatedAt: s.estimatedAt?.toISOString() ?? null,
    deliveredAt: s.deliveredAt?.toISOString() ?? null,
    notes: s.notes,
    purchaseOrderId: s.purchaseOrderId,
    purchaseOrderNumber: s.purchaseOrder?.orderNumber ?? null,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function createShipment(input: {
  trackingNumber?: string;
  carrier?: string;
  origin?: string;
  destination?: string;
  estimatedAt?: string;
  notes?: string;
  purchaseOrderId?: string;
}): Promise<string> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const s = await prisma.shipment.create({
    data: {
      tenantId:        session.tenantId,
      trackingNumber:  input.trackingNumber?.trim() || null,
      carrier:         input.carrier?.trim() || null,
      origin:          input.origin?.trim() || null,
      destination:     input.destination?.trim() || null,
      estimatedAt:     input.estimatedAt ? new Date(input.estimatedAt) : null,
      notes:           input.notes?.trim() || null,
      purchaseOrderId: input.purchaseOrderId || null,
    },
    select: { id: true },
  });

  revalidatePath('/scm/logistica');
  return s.id;
}

export async function updateShipmentStatus(id: string, status: string): Promise<void> {
  const session = await getSwitchSession();
  if (!session?.tenantId) throw new Error('No autenticado');

  const s = await prisma.shipment.findUnique({ where: { id } });
  if (!s || s.tenantId !== session.tenantId) throw new Error('No encontrado');

  await prisma.shipment.update({
    where: { id },
    data: {
      status,
      ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
    },
  });

  revalidatePath('/scm/logistica');
}
