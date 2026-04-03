'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeData } from '@/lib/security/sanitizer';

export async function saveCashCut(input: {
  denominations: Record<string, number>;
  declaredAmount: number;
  notes?: string;
}): Promise<{ ok: boolean; id?: string; variation?: number; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.tenantId) return { ok: false, error: 'No autenticado' };

    const sanitized = sanitizeData(input);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCut = await prisma.cashCut.findFirst({
      where: { tenantId: session.tenantId, status: 'CERRADO' },
      orderBy: { cutDate: 'desc' },
    });

    const orders = await prisma.posOrder.findMany({
      where: {
        tenantId: session.tenantId,
        paymentMethod: '01',
        createdAt: { gte: lastCut?.cutDate ?? today },
      },
      select: { total: true },
    });

    const systemAmount = orders.reduce((s, o) => s + Number(o.total), 0);
    const variation = input.declaredAmount - systemAmount;

    const cut = await prisma.cashCut.create({
      data: {
        tenantId: session.tenantId,
        cashierId: session.userId ?? null,
        cutDate: new Date(),
        denominations: sanitized.denominations,
        declaredAmount: sanitized.declaredAmount,
        systemAmount,
        variation,
        ordersCount: orders.length,
        grandTotal: systemAmount,
        status: Math.abs(variation) > 10 ? 'ANOMALIA_PENDIENTE' : 'CERRADO',
        anomalyNotes: sanitized.notes ?? null,
      },
    });

    revalidatePath('/pos/corte');
    return { ok: true, id: cut.id, variation };
  } catch (err) {
    console.error('[saveCashCut]', err);
    return { ok: false, error: 'Error al guardar el corte de caja' };
  }
}
