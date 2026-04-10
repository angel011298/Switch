/**
 * CIFRA — Customer Display Code Generator
 * ==========================================
 * Genera el código público amigable (displayCode) para un cliente nuevo.
 *
 * Sistema de Triple Identificación:
 *   1. id           — UUID interno (Primary Key, nunca visible al usuario)
 *   2. displayCode  — Código amigable: "CLI-0001" (visible en búsquedas y reportes)
 *   3. rfc          — Identificador fiscal (validado, único por tenant para RFCs no genéricos)
 *
 * El displayCode es único por tenant — dos empresas distintas pueden tener CLI-0001.
 * Ref: OWASP IDOR Prevention — nunca usar IDs autoincrementales expuestos públicamente.
 */

import prisma from '@/lib/prisma';

/**
 * Retorna el siguiente displayCode correlativo para el tenant.
 * Formato: CLI-NNNN (4 dígitos con cero-padding).
 * Ejemplo: CLI-0001, CLI-0002, ... CLI-9999
 *
 * @param tenantId - ID del tenant al que pertenece el cliente
 * @param prefix   - Prefijo personalizable (por defecto "CLI")
 */
export async function generateDisplayCode(
  tenantId: string,
  prefix = 'CLI'
): Promise<string> {
  // Busca el displayCode más alto del tenant (orden numérico)
  const last = await prisma.customer.findFirst({
    where:   { tenantId, displayCode: { startsWith: `${prefix}-` } },
    orderBy: { createdAt: 'desc' },
    select:  { displayCode: true },
  });

  if (!last?.displayCode) {
    return `${prefix}-0001`;
  }

  const match = last.displayCode.match(/^[A-Z]+-(\d+)$/);
  if (!match) {
    return `${prefix}-0001`;
  }

  const next = parseInt(match[1], 10) + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}
