/**
 * CIFRA AI Copilot — Data Fetchers
 * ===================================
 * Consultas Prisma para cada tool del copiloto.
 * Todos los campos Decimal se serializan con Number() antes de retornar
 * para evitar errores de serialización en JSON.stringify().
 *
 * El tenantId siempre es inyectado por el server — nunca llega del cliente.
 */

import prisma from '@/lib/prisma';
import { check69B } from '@/lib/cfdi/validator';

// ─── IVA Balance ─────────────────────────────────────────────────────────────

export async function fetchIvaData(tenantId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 1); // exclusive

  // Facturas CFDI timbradas del período
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'STAMPED',
      tipoComprobante: 'I',
      fechaEmision: { gte: startDate, lt: endDate },
    },
    select: {
      totalImpuestosTrasladados: true,
      totalImpuestosRetenidos:   true,
      subtotal: true,
      total:    true,
      metodoPago: true,
    },
  });

  let ivaTrasladado  = 0;
  let ivaRetenido    = 0;
  let subtotalSum    = 0;
  let totalSum       = 0;
  let countPUE       = 0;
  let countPPD       = 0;

  for (const inv of invoices) {
    ivaTrasladado += Number(inv.totalImpuestosTrasladados);
    ivaRetenido   += Number(inv.totalImpuestosRetenidos);
    subtotalSum   += Number(inv.subtotal);
    totalSum      += Number(inv.total);
    if (inv.metodoPago === 'PUE') countPUE++;
    else countPPD++;
  }

  // Cuentas contables de IVA (Anexo 24 SAT):
  // 118.xx = IVA acreditable (activo — IVA pagado a proveedores)
  // 208.xx = IVA trasladado  (pasivo — IVA cobrado a clientes, por entregar al SAT)
  const ivaAccounts = await prisma.account.findMany({
    where: {
      tenantId,
      OR: [
        { code: { startsWith: '118' } },
        { code: { startsWith: '208' } },
      ],
    },
    select: {
      code:          true,
      name:          true,
      accountType:   true,
      debitBalance:  true,
      creditBalance: true,
    },
    orderBy: { code: 'asc' },
  });

  const period = `${year}-${String(month).padStart(2, '0')}`;

  return {
    period,
    invoiceCount: invoices.length,
    subtotal:      round2(subtotalSum),
    total:         round2(totalSum),
    ivaTrasladado: round2(ivaTrasladado),
    ivaRetenido:   round2(ivaRetenido),
    ivaNetoPagar:  round2(ivaTrasladado - ivaRetenido),
    countPUE,
    countPPD,
    ivaAccounts: ivaAccounts.map(a => ({
      code:         a.code,
      name:         a.name,
      accountType:  a.accountType,
      debitBalance: round2(Number(a.debitBalance)),
      creditBalance: round2(Number(a.creditBalance)),
    })),
  };
}

// ─── RFC 69-B ────────────────────────────────────────────────────────────────

export async function fetchRfc69bStatus(rfc: string) {
  return check69B(rfc);
}

// ─── Cash Flow Summary ────────────────────────────────────────────────────────

export async function fetchCashFlowSummary(tenantId: string) {
  const now     = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Proyecciones de flujo de efectivo guardadas
  const projections = await prisma.cashFlowProjection.findMany({
    where: {
      tenantId,
      date: { gte: now, lte: in30Days },
    },
    select: {
      date:        true,
      type:        true,
      category:    true,
      description: true,
      amount:      true,
      isConfirmed: true,
    },
    orderBy: { date: 'asc' },
  });

  let ingresoProyectado  = 0;
  let egresoProyectado   = 0;
  let ingresoConfirmado  = 0;
  let egresoConfirmado   = 0;

  for (const p of projections) {
    const amt = Number(p.amount);
    if (p.type === 'INGRESO') {
      ingresoProyectado += amt;
      if (p.isConfirmed) ingresoConfirmado += amt;
    } else {
      egresoProyectado += amt;
      if (p.isConfirmed) egresoConfirmado += amt;
    }
  }

  // Facturas timbradas pendientes de cobro (posible cobranza futura)
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'STAMPED',
      tipoComprobante: 'I',
      paidAt: null,
    },
    select: { total: true, fechaEmision: true },
  });

  const totalCuentasPorCobrar = pendingInvoices.reduce(
    (sum, inv) => sum + Number(inv.total), 0,
  );

  return {
    horizonte: '30 días',
    fechaInicio: now.toISOString().split('T')[0],
    fechaFin:    in30Days.toISOString().split('T')[0],
    proyecciones: {
      ingresoTotal:  round2(ingresoProyectado),
      egresoTotal:   round2(egresoProyectado),
      flujoNeto:     round2(ingresoProyectado - egresoProyectado),
      confirmados: {
        ingreso: round2(ingresoConfirmado),
        egreso:  round2(egresoConfirmado),
      },
    },
    cuentasPorCobrar: {
      totalFacturas: pendingInvoices.length,
      montoTotal:    round2(totalCuentasPorCobrar),
    },
    detalleProyecciones: projections.map(p => ({
      fecha:       p.date.toISOString().split('T')[0],
      tipo:        p.type,
      categoria:   p.category,
      descripcion: p.description,
      monto:       round2(Number(p.amount)),
      confirmado:  p.isConfirmed,
    })),
  };
}

// ─── Compliance Alerts ────────────────────────────────────────────────────────

export async function fetchComplianceAlerts(tenantId: string) {
  const now    = new Date();
  const in30d  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Alertas fiscales activas o vencidas
  const alerts = await prisma.complianceAlert.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { lte: in30d },
    },
    select: {
      type:        true,
      title:       true,
      description: true,
      dueDate:     true,
      daysAhead:   true,
      status:      true,
    },
    orderBy: { dueDate: 'asc' },
  });

  // Facturas PPD sin complemento de pago emitido
  const ppdSinComplemento = await prisma.invoice.count({
    where: {
      tenantId,
      status:         'STAMPED',
      tipoComprobante: 'I',
      metodoPago:      'PPD',
    },
  });

  // Corridas de nómina en borrador (sin cerrar)
  const nominasDraft = await prisma.payrollRun.count({
    where: { tenantId, status: 'DRAFT' },
  });

  return {
    alertasFiscales: alerts.map(a => ({
      tipo:        a.type,
      titulo:      a.title,
      descripcion: a.description,
      fechaVence:  a.dueDate.toISOString().split('T')[0],
      diasAnticipacion: a.daysAhead,
      estado:      a.status,
    })),
    ppdSinComplemento,
    nominasDraft,
    resumen: {
      totalAlertas:         alerts.length,
      vencidas:             alerts.filter(a => a.status === 'OVERDUE').length,
      proximasA30Dias:      alerts.filter(a => a.status === 'PENDING').length,
      ppdRequierenPago:     ppdSinComplemento,
      nominasPendienteCierre: nominasDraft,
    },
  };
}

// ─── Journal Entry Explanation ────────────────────────────────────────────────

export async function fetchJournalEntry(tenantId: string, journalEntryId: string) {
  // El tenantId valida que la póliza pertenece al tenant autenticado
  const entry = await prisma.journalEntry.findFirst({
    where: { id: journalEntryId, tenantId },
    include: {
      lines: {
        include: {
          account: {
            select: { code: true, name: true, accountType: true },
          },
        },
        orderBy: [{ debit: 'desc' }, { credit: 'desc' }],
      },
    },
  });

  if (!entry) {
    return { error: 'Póliza no encontrada o no pertenece a este tenant.' };
  }

  return {
    id:          entry.id,
    numero:      entry.entryNumber,
    fecha:       entry.date.toISOString().split('T')[0],
    concepto:    entry.concept,
    referencia:  entry.reference,
    tipo:        entry.entryType,
    origen:      entry.sourceType,
    totalCargos: round2(Number(entry.totalDebit)),
    totalAbonos: round2(Number(entry.totalCredit)),
    cuadrada:    entry.isBalanced,
    lineas: entry.lines.map(l => ({
      cuenta:     l.account.code,
      nombreCuenta: l.account.name,
      tipoCuenta: l.account.accountType,
      descripcion: l.description,
      cargo:       round2(Number(l.debit)),
      abono:       round2(Number(l.credit)),
    })),
  };
}

// ─── Utilidad ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
