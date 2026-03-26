/**
 * Switch OS — Helper para persistir pólizas contables
 * =====================================================
 * Función reutilizable que graba un JournalEntryInput en la BD.
 * Se llama desde cualquier Server Action que genere un asiento
 * automático (POS, CFDI emitido, etc.) sin duplicar lógica.
 *
 * DISEÑO: best-effort — el caller envuelve en try/catch.
 *   Si el catálogo de cuentas no está inicializado (cuenta no existe),
 *   retorna null silenciosamente en lugar de lanzar.
 *
 * Ref: CFF Art. 28, NIF A-2
 */

import prisma from '@/lib/prisma';
import { validateDoubleEntry, type JournalEntryInput } from './journal-engine';

/**
 * Persiste una póliza contable balanceada en la base de datos.
 *
 * @param tenantId  - Tenant propietario del asiento
 * @param input     - Datos de la póliza generados por journal-engine
 * @param sourceType - Tipo de origen (sobreescribe input.sourceType)
 * @param sourceId   - ID del documento origen (sobreescribe input.sourceId)
 * @returns ID del JournalEntry creado, o null si no se pudo crear
 */
export async function createJournalEntryFromInput(
  tenantId: string,
  input: JournalEntryInput,
  sourceType?: string,
  sourceId?: string
): Promise<string | null> {
  // ── 1. Validar partida doble ──────────────────────────
  const validation = validateDoubleEntry(input.lines);
  if (!validation.isBalanced) return null;

  // ── 2. Resolver IDs de cuentas ────────────────────────
  const codes = input.lines.map((l) => l.accountCode);
  const accounts = await prisma.account.findMany({
    where: { tenantId, code: { in: codes } },
    select: { id: true, code: true },
  });
  const accountMap = new Map(accounts.map((a) => [a.code, a.id]));

  // Si el catálogo no está inicializado, no hay cuentas — omitir silenciosamente
  if (!input.lines.every((l) => accountMap.has(l.accountCode))) return null;

  // ── 3. Obtener siguiente número de póliza ─────────────
  const last = await prisma.journalEntry.findFirst({
    where: { tenantId },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });
  const entryNumber = (last?.entryNumber ?? 0) + 1;

  // ── 4. Crear póliza + líneas ──────────────────────────
  const entry = await prisma.journalEntry.create({
    data: {
      tenantId,
      entryNumber,
      date: input.date,
      concept: input.concept,
      reference: input.reference,
      entryType: input.entryType,
      sourceType: sourceType ?? input.sourceType ?? null,
      sourceId: sourceId ?? input.sourceId ?? null,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      isBalanced: true,
      lines: {
        create: input.lines.map((line) => ({
          accountId: accountMap.get(line.accountCode)!,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
      },
    },
  });

  // ── 5. Actualizar saldos de cuentas ───────────────────
  for (const line of input.lines) {
    await prisma.account.update({
      where: { id: accountMap.get(line.accountCode)! },
      data: {
        debitBalance: { increment: line.debit },
        creditBalance: { increment: line.credit },
      },
    });
  }

  return entry.id;
}
