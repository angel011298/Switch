/**
 * Switch OS — Motor de Pólizas (Partida Doble)
 * ==============================================
 * Valida y genera asientos contables balanceados.
 *
 * REGLA FUNDAMENTAL:
 *   ∑ Cargos (Débitos) === ∑ Abonos (Créditos)
 *   Si no cuadra, la póliza NO se registra.
 *
 * ALGORITMO DE CONTABILIZACIÓN AUTOMÁTICA:
 *   - XML tipo "I" (Ingreso) → Póliza de Ingreso:
 *       Cargo: Bancos/Clientes (101.02 o 105.01)
 *       Abono: Ventas (401.01) + IVA Trasladado (208.01)
 *
 *   - XML tipo "E" (Egreso) → Póliza de Egreso:
 *       Cargo: Gastos (6xx) + IVA Acreditable (110.01)
 *       Abono: Bancos/Proveedores (101.02 o 201.01)
 *
 *   - XML tipo "P" (Pago) → Póliza de Diario:
 *       Cargo: Proveedores/Bancos (depende dirección)
 *       Abono: Bancos/Clientes (depende dirección)
 *
 *   - XML tipo "N" (Nómina) → Póliza de Egreso:
 *       Cargo: Sueldos y salarios (601.01)
 *       Abono: Bancos (101.02) + ISR retenido (213) + IMSS (216)
 *
 * Ref: CFF Art. 28, NIF A-2, Anexo 24 SAT
 */

// Tipos usados como string literals (los enums no se exportan del cliente Prisma generado)
type JournalEntryType = 'DIARIO' | 'INGRESO' | 'EGRESO' | 'AJUSTE' | 'NOMINA';
type JournalSourceType = 'XML_IMPORT' | 'POS_SALE' | 'MANUAL' | 'CFDI_EMITIDO';

// ─── TIPOS ─────────────────────────────────────────────

export interface JournalLineInput {
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntryInput {
  tenantId: string;
  date: Date;
  concept: string;
  reference?: string;
  entryType: JournalEntryType;
  sourceType: JournalSourceType;
  sourceId?: string;
  lines: JournalLineInput[];
}

export interface ParsedCfdiData {
  uuid: string;
  tipoComprobante: string; // I, E, P, N, T
  fecha: Date;
  emisorRfc: string;
  emisorNombre: string;
  receptorRfc: string;
  receptorNombre: string;
  subtotal: number;
  total: number;
  totalImpuestosTrasladados: number;
  totalImpuestosRetenidos: number;
  formaPago?: string;
  moneda: string;
}

// ─── REDONDEO ──────────────────────────────────────────

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─── VALIDACIÓN PARTIDA DOBLE ──────────────────────────

/**
 * Valida que la suma de cargos === suma de abonos.
 * Retorna true si está balanceado, false si no.
 */
export function validateDoubleEntry(lines: JournalLineInput[]): {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
} {
  const totalDebit = round2(lines.reduce((sum, l) => sum + l.debit, 0));
  const totalCredit = round2(lines.reduce((sum, l) => sum + l.credit, 0));
  const difference = round2(Math.abs(totalDebit - totalCredit));

  return {
    isBalanced: difference === 0,
    totalDebit,
    totalCredit,
    difference,
  };
}

// ─── GENERADOR AUTOMÁTICO DE PÓLIZAS ───────────────────

/**
 * Genera las líneas de póliza automáticamente a partir de un CFDI parsed.
 * Aplica las reglas de contabilización según el tipo de comprobante.
 */
export function generateJournalFromCfdi(
  cfdi: ParsedCfdiData,
  tenantRfc: string
): JournalEntryInput | null {
  const isEmitted = cfdi.emisorRfc === tenantRfc; // Nosotros emitimos
  const isReceived = cfdi.receptorRfc === tenantRfc; // Nosotros recibimos

  if (!isEmitted && !isReceived) return null;

  switch (cfdi.tipoComprobante) {
    case 'I': // Ingreso
      return isEmitted
        ? generateIngresoEmitido(cfdi)
        : generateIngresoRecibido(cfdi);

    case 'E': // Egreso (nota de crédito)
      return isEmitted
        ? generateEgresoEmitido(cfdi)
        : generateEgresoRecibido(cfdi);

    case 'P': // Pago
      return generatePago(cfdi, isEmitted);

    case 'N': // Nómina
      return generateNomina(cfdi);

    case 'T': // Traslado
      return null; // No genera póliza contable

    default:
      return null;
  }
}

// ─── PÓLIZAS POR TIPO ─────────────────────────────────

/**
 * INGRESO EMITIDO (nosotros vendemos):
 * Cargo → Bancos/Clientes por el total
 * Abono → Ventas por el subtotal
 * Abono → IVA Trasladado por el impuesto
 */
function generateIngresoEmitido(cfdi: ParsedCfdiData): JournalEntryInput {
  const isPaid = cfdi.formaPago && cfdi.formaPago !== '99';
  const lines: JournalLineInput[] = [];

  // Cargo: Bancos (si pagado) o Clientes (si crédito)
  lines.push({
    accountCode: isPaid ? '101.02' : '105.01',
    description: `Venta a ${cfdi.receptorNombre}`,
    debit: cfdi.total,
    credit: 0,
  });

  // Abono: Ventas
  lines.push({
    accountCode: '401.01',
    description: `Venta factura ${cfdi.uuid.substring(0, 8)}`,
    debit: 0,
    credit: cfdi.subtotal,
  });

  // Abono: IVA Trasladado
  if (cfdi.totalImpuestosTrasladados > 0) {
    lines.push({
      accountCode: isPaid ? '208.01' : '208.02',
      description: 'IVA trasladado',
      debit: 0,
      credit: cfdi.totalImpuestosTrasladados,
    });
  }

  // Ajuste por retenciones (si aplica)
  if (cfdi.totalImpuestosRetenidos > 0) {
    const retencionIsr = round2(cfdi.totalImpuestosRetenidos * 0.625);
    const retencionIva = round2(cfdi.totalImpuestosRetenidos - retencionIsr);

    if (retencionIsr > 0) {
      lines.push({
        accountCode: '210',
        description: 'ISR retenido por cliente',
        debit: retencionIsr,
        credit: 0,
      });
    }
    if (retencionIva > 0) {
      lines.push({
        accountCode: '214',
        description: 'IVA retenido por cliente',
        debit: retencionIva,
        credit: 0,
      });
    }
    // Ajustar el cargo a Bancos/Clientes
    lines[0].debit = round2(cfdi.total - cfdi.totalImpuestosRetenidos);
  }

  return {
    tenantId: '',
    date: cfdi.fecha,
    concept: `Venta ${cfdi.receptorNombre} — ${cfdi.uuid.substring(0, 8)}`,
    reference: cfdi.uuid,
    entryType: 'INGRESO',
    sourceType: 'XML_IMPORT',
    lines,
  };
}

/**
 * INGRESO RECIBIDO (nos compran / nosotros pagamos como gasto):
 * Cargo → Gastos (602.xx) por el subtotal
 * Cargo → IVA Acreditable por el impuesto
 * Abono → Bancos/Proveedores por el total
 */
function generateIngresoRecibido(cfdi: ParsedCfdiData): JournalEntryInput {
  const isPaid = cfdi.formaPago && cfdi.formaPago !== '99';
  const lines: JournalLineInput[] = [];

  // Cargo: Gasto genérico
  lines.push({
    accountCode: '602.01',
    description: `Gasto ${cfdi.emisorNombre}`,
    debit: cfdi.subtotal,
    credit: 0,
  });

  // Cargo: IVA Acreditable
  if (cfdi.totalImpuestosTrasladados > 0) {
    lines.push({
      accountCode: isPaid ? '110.01' : '110.02',
      description: 'IVA acreditable',
      debit: cfdi.totalImpuestosTrasladados,
      credit: 0,
    });
  }

  // Abono: Bancos o Proveedores
  lines.push({
    accountCode: isPaid ? '101.02' : '201.01',
    description: `Pago a ${cfdi.emisorNombre}`,
    debit: 0,
    credit: cfdi.total,
  });

  return {
    tenantId: '',
    date: cfdi.fecha,
    concept: `Compra ${cfdi.emisorNombre} — ${cfdi.uuid.substring(0, 8)}`,
    reference: cfdi.uuid,
    entryType: 'EGRESO',
    sourceType: 'XML_IMPORT',
    lines,
  };
}

/**
 * EGRESO EMITIDO (nota de crédito que emitimos):
 * Reversa parcial de una venta.
 */
function generateEgresoEmitido(cfdi: ParsedCfdiData): JournalEntryInput {
  const lines: JournalLineInput[] = [
    {
      accountCode: '402',
      description: `Nota de crédito a ${cfdi.receptorNombre}`,
      debit: cfdi.subtotal,
      credit: 0,
    },
    {
      accountCode: '208.01',
      description: 'Reversa IVA trasladado',
      debit: cfdi.totalImpuestosTrasladados,
      credit: 0,
    },
    {
      accountCode: '105.01',
      description: `NC ${cfdi.uuid.substring(0, 8)}`,
      debit: 0,
      credit: cfdi.total,
    },
  ];

  return {
    tenantId: '',
    date: cfdi.fecha,
    concept: `Nota crédito ${cfdi.receptorNombre} — ${cfdi.uuid.substring(0, 8)}`,
    reference: cfdi.uuid,
    entryType: 'EGRESO',
    sourceType: 'XML_IMPORT',
    lines,
  };
}

/**
 * EGRESO RECIBIDO (nota de crédito que nos dan):
 * Reversa parcial de un gasto.
 */
function generateEgresoRecibido(cfdi: ParsedCfdiData): JournalEntryInput {
  const lines: JournalLineInput[] = [
    {
      accountCode: '201.01',
      description: `NC de ${cfdi.emisorNombre}`,
      debit: cfdi.total,
      credit: 0,
    },
    {
      accountCode: '602.01',
      description: `Reversa gasto NC ${cfdi.uuid.substring(0, 8)}`,
      debit: 0,
      credit: cfdi.subtotal,
    },
    {
      accountCode: '110.01',
      description: 'Reversa IVA acreditable',
      debit: 0,
      credit: cfdi.totalImpuestosTrasladados,
    },
  ];

  return {
    tenantId: '',
    date: cfdi.fecha,
    concept: `NC recibida ${cfdi.emisorNombre} — ${cfdi.uuid.substring(0, 8)}`,
    reference: cfdi.uuid,
    entryType: 'EGRESO',
    sourceType: 'XML_IMPORT',
    lines,
  };
}

/**
 * PAGO (complemento de pago):
 * Reclasifica de crédito a pagado.
 */
function generatePago(cfdi: ParsedCfdiData, isEmitted: boolean): JournalEntryInput {
  const lines: JournalLineInput[] = isEmitted
    ? [
        // Emitido: Cliente nos paga
        { accountCode: '101.02', description: `Cobro de ${cfdi.receptorNombre}`, debit: cfdi.total, credit: 0 },
        { accountCode: '105.01', description: `Liquidación factura`, debit: 0, credit: cfdi.total },
      ]
    : [
        // Recibido: Pagamos a proveedor
        { accountCode: '201.01', description: `Pago a ${cfdi.emisorNombre}`, debit: cfdi.total, credit: 0 },
        { accountCode: '101.02', description: `Egreso bancario`, debit: 0, credit: cfdi.total },
      ];

  return {
    tenantId: '',
    date: cfdi.fecha,
    concept: `Pago ${isEmitted ? cfdi.receptorNombre : cfdi.emisorNombre} — ${cfdi.uuid.substring(0, 8)}`,
    reference: cfdi.uuid,
    entryType: 'DIARIO',
    sourceType: 'XML_IMPORT',
    lines,
  };
}

/**
 * NÓMINA:
 * Cargo → Sueldos (601.01)
 * Abono → Bancos (101.02) + ISR retenido (213)
 */
function generateNomina(cfdi: ParsedCfdiData): JournalEntryInput {
  const netoPagado = round2(cfdi.total);
  const retenido = round2(cfdi.subtotal - cfdi.total);

  const lines: JournalLineInput[] = [
    {
      accountCode: '601.01',
      description: `Nómina ${cfdi.receptorNombre}`,
      debit: cfdi.subtotal,
      credit: 0,
    },
    {
      accountCode: '101.02',
      description: `Pago nómina`,
      debit: 0,
      credit: netoPagado,
    },
  ];

  if (retenido > 0) {
    lines.push({
      accountCode: '213',
      description: 'ISR retenido nómina',
      debit: 0,
      credit: retenido,
    });
  }

  return {
    tenantId: '',
    date: cfdi.fecha,
    concept: `Nómina ${cfdi.receptorNombre} — ${cfdi.uuid.substring(0, 8)}`,
    reference: cfdi.uuid,
    entryType: 'EGRESO',
    sourceType: 'XML_IMPORT',
    lines,
  };
}
