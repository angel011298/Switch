'use server';

/**
 * Switch OS — Server Actions de Contabilidad
 * ============================================
 * Operaciones del servidor para el módulo de contabilidad:
 * - Seed de catálogo de cuentas
 * - Procesamiento de ZIP con XMLs
 * - Consulta de pólizas y balanza
 *
 * Ref: CFF Art. 28, Anexo 24 SAT
 */

import prisma from '@/lib/prisma';
import { getSwitchSession } from '@/lib/auth/session';
import { SAT_CHART_OF_ACCOUNTS } from '@/lib/accounting/chart-of-accounts';
import { processZipBuffer } from '@/lib/accounting/xml-batch-processor';
import {
  generateJournalFromCfdi,
  validateDoubleEntry,
} from '@/lib/accounting/journal-engine';
import { revalidatePath } from 'next/cache';

// ─── AUTH ──────────────────────────────────────────────

async function requireAuth() {
  const session = await getSwitchSession();
  if (!session?.tenantId) {
    throw new Error('No autenticado o sin tenant');
  }
  return session;
}

// ─── CATÁLOGO DE CUENTAS ───────────────────────────────

/**
 * Inicializa el catálogo de cuentas SAT para el tenant.
 * Solo se ejecuta una vez (si ya existen cuentas, no hace nada).
 */
export async function seedChartOfAccounts() {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const existing = await prisma.account.count({ where: { tenantId } });
  if (existing > 0) {
    return { success: true, message: 'Catalogo ya existe', count: existing };
  }

  const accounts = SAT_CHART_OF_ACCOUNTS.map((a) => ({
    tenantId,
    code: a.code,
    name: a.name,
    accountType: a.accountType,
    parentCode: a.parentCode,
    level: a.level,
  }));

  const result = await prisma.account.createMany({ data: accounts });

  revalidatePath('/finanzas/contabilidad');
  return { success: true, message: 'Catalogo creado', count: result.count };
}

/**
 * Obtiene el catálogo de cuentas del tenant.
 */
export async function getAccounts() {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  return prisma.account.findMany({
    where: { tenantId },
    orderBy: { code: 'asc' },
  });
}

// ─── PROCESAMIENTO DE ZIP ──────────────────────────────

/**
 * Procesa un archivo ZIP con XMLs CFDI.
 * 1. Descomprime el ZIP
 * 2. Parsea cada XML
 * 3. Genera pólizas automáticas
 * 4. Persiste todo en la BD
 */
export async function processXmlZip(formData: FormData) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const file = formData.get('file') as File;
  if (!file) throw new Error('No se recibio archivo');

  // Obtener RFC del tenant para determinar dirección del CFDI
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { rfc: true },
  });

  if (!tenant?.rfc) {
    throw new Error('Configura el RFC del negocio antes de importar XMLs');
  }

  // Leer el buffer del archivo
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Procesar el ZIP
  const batchResult = processZipBuffer(buffer);

  if (batchResult.totalFiles === 0) {
    throw new Error('El ZIP no contiene archivos XML');
  }

  // Crear registro del batch
  const batch = await prisma.xmlBatch.create({
    data: {
      tenantId,
      fileName: file.name,
      totalFiles: batchResult.totalFiles,
      processed: batchResult.processed,
      errors: batchResult.errors,
      status: batchResult.errors === batchResult.totalFiles ? 'FAILED' : 'COMPLETED',
      ingresos: batchResult.counters.ingresos,
      egresos: batchResult.counters.egresos,
      pagos: batchResult.counters.pagos,
      nominas: batchResult.counters.nominas,
      traslados: batchResult.counters.traslados,
      errorLog: batchResult.errorLog.length > 0
        ? JSON.stringify(batchResult.errorLog)
        : null,
    },
  });

  // Generar pólizas para cada XML exitoso
  let polizasCreated = 0;
  const accountCache = new Map<string, string>();

  // Cargar mapa de cuentas
  const accounts = await prisma.account.findMany({
    where: { tenantId },
    select: { id: true, code: true },
  });
  for (const acc of accounts) {
    accountCache.set(acc.code, acc.id);
  }

  // Obtener último número de póliza
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { tenantId },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });
  let nextEntryNumber = (lastEntry?.entryNumber ?? 0) + 1;

  for (const result of batchResult.results) {
    if (!result.success || !result.cfdi) continue;

    const journalInput = generateJournalFromCfdi(result.cfdi, tenant.rfc);
    if (!journalInput) continue;

    // Verificar que todas las cuentas existen
    const allAccountsExist = journalInput.lines.every(
      (line) => accountCache.has(line.accountCode)
    );
    if (!allAccountsExist) continue;

    // Validar partida doble
    const validation = validateDoubleEntry(journalInput.lines);
    if (!validation.isBalanced) continue;

    // Crear póliza con sus líneas en una transacción
    await prisma.journalEntry.create({
      data: {
        tenantId,
        entryNumber: nextEntryNumber++,
        date: journalInput.date,
        concept: journalInput.concept,
        reference: journalInput.reference,
        entryType: journalInput.entryType,
        sourceType: journalInput.sourceType,
        sourceId: batch.id,
        totalDebit: validation.totalDebit,
        totalCredit: validation.totalCredit,
        isBalanced: true,
        lines: {
          create: journalInput.lines.map((line) => ({
            accountId: accountCache.get(line.accountCode)!,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
    });

    // Actualizar saldos de cuentas
    for (const line of journalInput.lines) {
      const accountId = accountCache.get(line.accountCode)!;
      await prisma.account.update({
        where: { id: accountId },
        data: {
          debitBalance: { increment: line.debit },
          creditBalance: { increment: line.credit },
        },
      });
    }

    polizasCreated++;
  }

  revalidatePath('/finanzas/contabilidad');

  return {
    success: true,
    batchId: batch.id,
    totalFiles: batchResult.totalFiles,
    processed: batchResult.processed,
    errors: batchResult.errors,
    polizasCreated,
    counters: batchResult.counters,
    errorLog: batchResult.errorLog,
  };
}

// ─── CONSULTAS ─────────────────────────────────────────

/**
 * Obtiene las pólizas del periodo.
 */
export async function getJournalEntries(
  startDate?: string,
  endDate?: string
) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const where: any = { tenantId };
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  return prisma.journalEntry.findMany({
    where,
    include: {
      lines: {
        include: {
          account: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: { entryNumber: 'desc' },
    take: 100,
  });
}

/**
 * Obtiene la balanza de comprobación.
 * Suma de cargos y abonos por cuenta en un periodo.
 */
export async function getTrialBalance() {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  const accounts = await prisma.account.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      accountType: true,
      level: true,
      debitBalance: true,
      creditBalance: true,
    },
  });

  // Calcular saldo neto según naturaleza
  return accounts
    .filter((a) => Number(a.debitBalance) !== 0 || Number(a.creditBalance) !== 0)
    .map((a) => {
      const debit = Number(a.debitBalance);
      const credit = Number(a.creditBalance);
      const isDebitNature = ['ASSET', 'EXPENSE', 'CONTRA_REVENUE'].includes(a.accountType);
      const saldo = isDebitNature ? debit - credit : credit - debit;

      return {
        ...a,
        debitBalance: debit,
        creditBalance: credit,
        saldo: Math.round(saldo * 100) / 100,
      };
    });
}

/**
 * Obtiene el historial de lotes de XMLs importados.
 */
export async function getXmlBatches() {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  return prisma.xmlBatch.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

/**
 * Crea una póliza manual.
 */
export async function createManualEntry(data: {
  date: string;
  concept: string;
  reference?: string;
  entryType: 'DIARIO' | 'INGRESO' | 'EGRESO' | 'AJUSTE';
  lines: { accountCode: string; description: string; debit: number; credit: number }[];
}) {
  const session = await requireAuth();
  const tenantId = session.tenantId!;

  // Validar partida doble
  const validation = validateDoubleEntry(data.lines);
  if (!validation.isBalanced) {
    throw new Error(
      `Poliza no balanceada: Cargos $${validation.totalDebit} != Abonos $${validation.totalCredit} (diferencia: $${validation.difference})`
    );
  }

  // Resolver cuentas
  const accounts = await prisma.account.findMany({
    where: {
      tenantId,
      code: { in: data.lines.map((l) => l.accountCode) },
    },
    select: { id: true, code: true },
  });

  const accountMap = new Map(accounts.map((a) => [a.code, a.id]));

  for (const line of data.lines) {
    if (!accountMap.has(line.accountCode)) {
      throw new Error(`Cuenta ${line.accountCode} no existe en el catalogo`);
    }
  }

  // Obtener siguiente número
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { tenantId },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });
  const entryNumber = (lastEntry?.entryNumber ?? 0) + 1;

  const entry = await prisma.journalEntry.create({
    data: {
      tenantId,
      entryNumber,
      date: new Date(data.date),
      concept: data.concept,
      reference: data.reference,
      entryType: data.entryType,
      sourceType: 'MANUAL',
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      isBalanced: true,
      lines: {
        create: data.lines.map((line) => ({
          accountId: accountMap.get(line.accountCode)!,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
      },
    },
    include: { lines: true },
  });

  // Actualizar saldos
  for (const line of data.lines) {
    await prisma.account.update({
      where: { tenantId_code: { tenantId, code: line.accountCode } },
      data: {
        debitBalance: { increment: line.debit },
        creditBalance: { increment: line.credit },
      },
    });
  }

  revalidatePath('/finanzas/contabilidad');
  return entry;
}
