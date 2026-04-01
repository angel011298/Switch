'use server';

/**
 * CIFRA — Mis CFDI Server Actions
 * Gestión de CFDIs recibidos del SAT: listado, búsqueda, validación y mapeo contable.
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface CfdiRow {
  id: string;
  uuid: string;
  emisorRfc: string;
  emisorNombre: string | null;
  receptorRfc: string;
  serie: string | null;
  folio: string | null;
  total: number;
  subtotal: number | null;
  totalIva: number | null;
  totalIsr: number | null;
  fechaEmision: string;
  tipoComprobante: string;   // I | E | T | P | N
  metodoPago: string | null;
  formaPago: string | null;
  moneda: string;
  status: string;            // VIGENTE | CANCELADO
  isEfos: boolean;
  validated: boolean;
  accountingMapped: boolean;
  costCenter: string | null;
  accountCode: string | null;
  xmlUrl: string | null;
  syncedAt: string;
}

export interface CfdiKpis {
  total: number;
  vigentes: number;
  cancelados: number;
  efosAlert: number;
  sinMapear: number;
  totalImporte: number;
}

// ─── Lectura ─────────────────────────────────────────────────────────────────

export async function getMisCfdi(filters?: {
  tipo?: string;
  status?: string;
  emisorRfc?: string;
  desde?: string;
  hasta?: string;
}): Promise<CfdiRow[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: session.tenantId };

  if (filters?.tipo) where.tipoComprobante = filters.tipo;
  if (filters?.status) where.status = filters.status;
  if (filters?.emisorRfc) {
    where.emisorRfc = { contains: filters.emisorRfc.toUpperCase(), mode: 'insensitive' };
  }
  if (filters?.desde || filters?.hasta) {
    where.fechaEmision = {};
    if (filters.desde) where.fechaEmision.gte = new Date(filters.desde);
    if (filters.hasta) where.fechaEmision.lte = new Date(filters.hasta + 'T23:59:59');
  }

  const cfdi = await prisma.cfdiRecibido.findMany({
    where,
    orderBy: { fechaEmision: 'desc' },
    take: 500,
  });

  return cfdi.map((c) => ({
    id: c.id,
    uuid: c.uuid,
    emisorRfc: c.emisorRfc,
    emisorNombre: c.emisorNombre,
    receptorRfc: c.receptorRfc,
    serie: c.serie,
    folio: c.folio,
    total: Number(c.total),
    subtotal: c.subtotal ? Number(c.subtotal) : null,
    totalIva: c.totalIva ? Number(c.totalIva) : null,
    totalIsr: c.totalIsr ? Number(c.totalIsr) : null,
    fechaEmision: c.fechaEmision.toISOString(),
    tipoComprobante: c.tipoComprobante,
    metodoPago: c.metodoPago,
    formaPago: c.formaPago,
    moneda: c.moneda,
    status: c.status,
    isEfos: c.isEfos,
    validated: c.validated,
    accountingMapped: c.accountingMapped,
    costCenter: c.costCenter,
    accountCode: c.accountCode,
    xmlUrl: c.xmlUrl,
    syncedAt: c.syncedAt.toISOString(),
  }));
}

export async function getCfdiKpis(): Promise<CfdiKpis> {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return { total: 0, vigentes: 0, cancelados: 0, efosAlert: 0, sinMapear: 0, totalImporte: 0 };
  }

  const [all, vigentes, cancelados, efosAlert, sinMapear, importeAgg] = await Promise.all([
    prisma.cfdiRecibido.count({ where: { tenantId: session.tenantId } }),
    prisma.cfdiRecibido.count({ where: { tenantId: session.tenantId, status: 'VIGENTE' } }),
    prisma.cfdiRecibido.count({ where: { tenantId: session.tenantId, status: 'CANCELADO' } }),
    prisma.cfdiRecibido.count({ where: { tenantId: session.tenantId, isEfos: true } }),
    prisma.cfdiRecibido.count({ where: { tenantId: session.tenantId, accountingMapped: false, status: 'VIGENTE' } }),
    prisma.cfdiRecibido.aggregate({
      where: { tenantId: session.tenantId, status: 'VIGENTE' },
      _sum: { total: true },
    }),
  ]);

  return {
    total: all,
    vigentes,
    cancelados,
    efosAlert,
    sinMapear,
    totalImporte: Number(importeAgg._sum.total ?? 0),
  };
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export async function syncCfdiFromSat(): Promise<{ ok: boolean; inserted: number; message: string }> {
  // Integración con SAT requiere e.firma del tenant (implementación futura con SOAP Descarga Masiva).
  // Este endpoint prepara el flujo on-demand; por ahora indica el estado de conexión.
  const session = await getSwitchSession();
  if (!session?.tenantId) return { ok: false, inserted: 0, message: 'No autenticado' };

  return {
    ok: true,
    inserted: 0,
    message: 'Sincronización lista. Para conectar con el SAT configura tu e.firma en Configuración → CFDI.',
  };
}

export async function markCfdiAccountingMapped(
  id: string,
  costCenter: string,
  accountCode: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const cfdi = await prisma.cfdiRecibido.findUnique({ where: { id }, select: { tenantId: true } });
    if (!cfdi || cfdi.tenantId !== session.tenantId) return { ok: false, error: 'CFDI no encontrado' };

    await prisma.cfdiRecibido.update({
      where: { id },
      data: {
        accountingMapped: true,
        costCenter: costCenter.trim() || null,
        accountCode: accountCode.trim() || null,
        validated: true,
        validatedAt: new Date(),
      },
    });

    revalidatePath('/billing/mis-cfdi');
    return { ok: true };
  } catch (err) {
    console.error('[markCfdiAccountingMapped]', err);
    return { ok: false, error: 'Error al mapear el CFDI' };
  }
}
