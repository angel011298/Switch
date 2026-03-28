/**
 * CIFRA — Disparador de Notificaciones (FASE 26)
 * ================================================
 * Helper centralizado para crear notificaciones desde Server Actions.
 * Falla silenciosamente para no interrumpir el flujo principal.
 */
import prisma from '@/lib/prisma';

export type NotificationType =
  | 'INVOICE_STAMPED'
  | 'INVOICE_DUE'
  | 'PAYMENT_RECEIVED'
  | 'LOW_STOCK'
  | 'DEAL_WON'
  | 'PAYROLL_READY'
  | 'ACCESS_DENIED';

export interface NotifyPayload {
  tenantId: string;
  userId?: string | null;   // null = broadcast a todo el tenant
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

/**
 * Crea una notificación en la base de datos.
 * No lanza excepciones — falla silenciosamente.
 */
export async function notify(payload: NotifyPayload): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        tenantId: payload.tenantId,
        userId:   payload.userId   ?? null,
        type:     payload.type,
        title:    payload.title,
        body:     payload.body,
        link:     payload.link     ?? null,
      },
    });
  } catch (err) {
    console.error('[notify] Failed to create notification:', err);
  }
}

// ─── Helpers tipados por evento ───────────────────────────────────────────────

export async function notifyInvoiceStamped(opts: {
  tenantId: string;
  folio: string;
  receptorNombre: string;
  total: number;
  invoiceId: string;
}) {
  await notify({
    tenantId: opts.tenantId,
    type: 'INVOICE_STAMPED',
    title: `Factura ${opts.folio} timbrada`,
    body: `CFDI emitido a ${opts.receptorNombre} por $${opts.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    link: `/billing`,
  });
}

export async function notifyPayrollReady(opts: {
  tenantId: string;
  periodLabel: string;
  employeeCount: number;
  totalNeto: number;
}) {
  await notify({
    tenantId: opts.tenantId,
    type: 'PAYROLL_READY',
    title: `Nómina lista: ${opts.periodLabel}`,
    body: `${opts.employeeCount} empleados · Total neto $${opts.totalNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    link: `/rrhh/nomina`,
  });
}

export async function notifyDealWon(opts: {
  tenantId: string;
  userId: string;
  dealName: string;
  amount: number;
}) {
  await notify({
    tenantId: opts.tenantId,
    userId: opts.userId,
    type: 'DEAL_WON',
    title: `¡Deal ganado! ${opts.dealName}`,
    body: `Valor: $${opts.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    link: `/crm/pipeline`,
  });
}

export async function notifyLowStock(opts: {
  tenantId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  warehouseName: string;
}) {
  await notify({
    tenantId: opts.tenantId,
    type: 'LOW_STOCK',
    title: `Stock bajo: ${opts.productName}`,
    body: `${opts.currentStock} uds. en ${opts.warehouseName} (mínimo: ${opts.minStock})`,
    link: `/scm/inventarios`,
  });
}
