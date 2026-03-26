'use server';

/**
 * Switch OS — Finanzas Server Actions
 * =====================================
 * FASE 16: Impuestos, Cobranza y Balanza de Comprobación.
 * Migrado de tablas legacy Supabase → Prisma puro.
 *
 * - getImpuestosData(): IVA trasladado/acreditable + ISR provisional
 * - getCobranzaData(): Aging de CxC (PPD/PUE + vencimiento)
 * - getBalanzaComprobacion(): Saldos de todas las cuentas del catálogo
 */

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// ─── TIPOS PÚBLICOS ───────────────────────────────────────────────────────────

export interface ImpuestosData {
  // IVA
  ivaTrasladado: number;    // IVA cobrado en facturas emitidas
  ivaAcreditable: number;   // IVA pagado en gastos/compras (cuentas 110.xx)
  ivaAPagar: number;        // Diferencia a enterar al SAT
  // ISR
  ingresosMes: number;      // Total ingresos netos del mes (sin IVA)
  gastosMes: number;        // Total gastos deducibles del mes
  utilidadBruta: number;    // Ingresos - Gastos
  isrProvisional: number;   // Utilidad × 30% / 12 (pago provisional simplificado)
  // Histórico mensual para gráfica (últimos 6 meses)
  historico: Array<{
    mes: string;
    ingresos: number;
    gastos: number;
    ivaAPagar: number;
  }>;
}

export interface InvoiceAgingRow {
  id: string;
  folio: number;
  serie: string | null;
  uuid: string | null;
  receptorNombre: string;
  receptorRfc: string;
  total: number;
  fechaEmision: string;
  diasVencido: number;   // negativo = aún no vence, positivo = vencido
  metodoPago: string;    // PUE | PPD
  status: string;
}

export interface CobranzaData {
  cobrado: number;         // PUE timbradas
  porCobrar: number;       // PPD pendientes
  vencido: number;         // PPD con más de 30 días
  repsPendientes: number;  // PPD sin complemento de pago
  invoices: InvoiceAgingRow[];
}

export interface BalanzaRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
  saldo: number;           // Positivo = saldo deudor, negativo = acreedor
}

// ─── IMPUESTOS ────────────────────────────────────────────────────────────────

/**
 * Calcula IVA/ISR provisionales del mes actual usando Prisma.
 * - IVA trasladado: suma totalImpuestosTrasladados de facturas emitidas STAMPED
 * - IVA acreditable: saldo de cuentas 110.xx (IVA por acreditar)
 * - ISR provisional: (Ingresos - Gastos) × 30% ÷ 12
 */
export async function getImpuestosData(): Promise<ImpuestosData> {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    return emptyImpuestos();
  }

  const tenantId = session.tenantId;

  // Rango del mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Obtener RFC del tenant para identificar facturas emitidas vs recibidas
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { rfc: true },
  });
  const tenantRfc = tenant?.rfc ?? '';

  // ── Facturas EMITIDAS timbradas del mes ──
  const facturasEmitidas = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'STAMPED',
      tipoComprobante: 'I',
      fechaEmision: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { subtotal: true, totalImpuestosTrasladados: true, total: true },
  });

  const ivaTrasladado = facturasEmitidas.reduce(
    (s, f) => s + Number(f.totalImpuestosTrasladados),
    0
  );
  const ingresosMes = facturasEmitidas.reduce((s, f) => s + Number(f.subtotal), 0);

  // ── Cuentas 110.xx (IVA acreditable) desde catálogo ──
  const cuentasIvaAcred = await prisma.account.findMany({
    where: { tenantId, code: { startsWith: '110' } },
    select: { debitBalance: true, creditBalance: true },
  });
  const ivaAcreditable = cuentasIvaAcred.reduce(
    (s, a) => s + (Number(a.debitBalance) - Number(a.creditBalance)),
    0
  );

  // ── Gastos del mes (cuentas 6xx) ──
  const cuentasGastos = await prisma.account.findMany({
    where: { tenantId, code: { startsWith: '6' } },
    select: { debitBalance: true, creditBalance: true },
  });
  const gastosMes = cuentasGastos.reduce(
    (s, a) => s + (Number(a.debitBalance) - Number(a.creditBalance)),
    0
  );

  const ivaAPagar = Math.max(0, ivaTrasladado - ivaAcreditable);
  const utilidadBruta = ingresosMes - Math.max(0, gastosMes);
  const isrProvisional = Math.max(0, (utilidadBruta * 0.30) / 12);

  // ── Histórico 6 meses para gráfica ──
  const historico = await buildHistorico(tenantId, 6);

  return {
    ivaTrasladado: round2(ivaTrasladado),
    ivaAcreditable: round2(Math.max(0, ivaAcreditable)),
    ivaAPagar: round2(ivaAPagar),
    ingresosMes: round2(ingresosMes),
    gastosMes: round2(Math.max(0, gastosMes)),
    utilidadBruta: round2(utilidadBruta),
    isrProvisional: round2(isrProvisional),
    historico,
  };
}

async function buildHistorico(tenantId: string, months: number) {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [emitidas, recibidas] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: start, lte: end } },
        _sum: { subtotal: true, totalImpuestosTrasladados: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: 'STAMPED', tipoComprobante: 'I', fechaEmision: { gte: start, lte: end }, NOT: { emisorRfc: { equals: '' } } },
        _sum: { subtotal: true, totalImpuestosTrasladados: true },
      }),
    ]);

    const ingMes = Number(emitidas._sum.subtotal ?? 0);
    const gastMes = Number(recibidas._sum.subtotal ?? 0);
    const ivaTras = Number(emitidas._sum.totalImpuestosTrasladados ?? 0);

    const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    result.push({
      mes: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      ingresos: round2(ingMes),
      gastos: round2(gastMes),
      ivaAPagar: round2(Math.max(0, ivaTras * 0.16)),
    });
  }

  return result;
}

function emptyImpuestos(): ImpuestosData {
  return {
    ivaTrasladado: 0, ivaAcreditable: 0, ivaAPagar: 0,
    ingresosMes: 0, gastosMes: 0, utilidadBruta: 0, isrProvisional: 0,
    historico: [],
  };
}

// ─── COBRANZA ─────────────────────────────────────────────────────────────────

/**
 * Aging de Cuentas por Cobrar desde facturas Prisma.
 * - PUE = cobrado al momento de emisión
 * - PPD = por cobrar (pendiente de complemento de pago)
 * - PPD > 30 días = vencido
 */
export async function getCobranzaData(): Promise<CobranzaData> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return emptyCobranza();

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: session.tenantId,
      status: 'STAMPED',
      tipoComprobante: 'I',
    },
    orderBy: { fechaEmision: 'desc' },
    select: {
      id: true,
      folio: true,
      serie: true,
      uuid: true,
      receptorNombre: true,
      receptorRfc: true,
      total: true,
      fechaEmision: true,
      metodoPago: true,
    },
  });

  const now = new Date();
  const rows: InvoiceAgingRow[] = invoices.map((inv) => {
    const emision = new Date(inv.fechaEmision);
    const diasDesdeEmision = Math.floor((now.getTime() - emision.getTime()) / 86_400_000);
    // PPD tiene 30 días para el complemento; PUE se considera cobrado de inmediato
    const diasVencido = inv.metodoPago === 'PPD' ? diasDesdeEmision - 30 : -1;

    return {
      id: inv.id,
      folio: inv.folio,
      serie: inv.serie,
      uuid: inv.uuid,
      receptorNombre: inv.receptorNombre,
      receptorRfc: inv.receptorRfc,
      total: Number(inv.total),
      fechaEmision: inv.fechaEmision.toISOString(),
      diasVencido,
      metodoPago: inv.metodoPago ?? 'PUE',
      status: 'STAMPED',
    };
  });

  const cobrado = rows
    .filter((r) => r.metodoPago !== 'PPD' || r.diasVencido < -30)
    .filter((r) => r.metodoPago !== 'PPD')
    .reduce((s, r) => s + r.total, 0);

  const ppd = rows.filter((r) => r.metodoPago === 'PPD');
  const porCobrar = ppd.filter((r) => r.diasVencido <= 0).reduce((s, r) => s + r.total, 0);
  const vencido   = ppd.filter((r) => r.diasVencido > 0).reduce((s, r) => s + r.total, 0);
  const repsPendientes = ppd.length;

  return {
    cobrado: round2(cobrado),
    porCobrar: round2(porCobrar),
    vencido: round2(vencido),
    repsPendientes,
    invoices: rows,
  };
}

function emptyCobranza(): CobranzaData {
  return { cobrado: 0, porCobrar: 0, vencido: 0, repsPendientes: 0, invoices: [] };
}

// ─── BALANZA DE COMPROBACIÓN ──────────────────────────────────────────────────

/**
 * Devuelve el saldo actual de todas las cuentas del catálogo SAT del tenant.
 * Agrupado en secciones: Activo, Pasivo, Capital, Ingresos, Costos/Gastos.
 */
export async function getBalanzaComprobacion(): Promise<{
  rows: BalanzaRow[];
  totalDebito: number;
  totalCredito: number;
  isBalanced: boolean;
}> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return { rows: [], totalDebito: 0, totalCredito: 0, isBalanced: true };

  const accounts = await prisma.account.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { code: 'asc' },
    select: {
      code: true,
      name: true,
      accountType: true,
      debitBalance: true,
      creditBalance: true,
    },
  });

  const rows: BalanzaRow[] = accounts.map((a) => {
    const debit = Number(a.debitBalance);
    const credit = Number(a.creditBalance);
    return {
      accountCode: a.code,
      accountName: a.name,
      accountType: a.accountType,
      debitBalance: debit,
      creditBalance: credit,
      saldo: round2(debit - credit),
    };
  });

  const totalDebito  = round2(rows.reduce((s, r) => s + r.debitBalance,  0));
  const totalCredito = round2(rows.reduce((s, r) => s + r.creditBalance, 0));
  const isBalanced = Math.abs(totalDebito - totalCredito) < 0.02;

  return { rows, totalDebito, totalCredito, isBalanced };
}

// ─── UTILIDAD ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
