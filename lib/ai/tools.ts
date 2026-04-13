/**
 * CIFRA AI Copilot — Tool Definitions & Dispatcher
 * ===================================================
 * Define los 5 tools estructurados que Claude puede invocar.
 * Cada tool tiene un schema tipado de input; el dispatcher
 * los ejecuta contra la DB real del tenant.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import {
  fetchIvaData,
  fetchRfc69bStatus,
  fetchCashFlowSummary,
  fetchComplianceAlerts,
  fetchJournalEntry,
} from './data-fetchers';

export const COPILOT_TOOLS: Tool[] = [
  {
    name: 'calculate_iva_balance',
    description:
      'Calcula el balance de IVA del tenant para un período específico: ' +
      'IVA trasladado (cobrado a clientes), IVA retenido y cuentas contables de IVA. ' +
      'Usa las facturas CFDI timbradas del período.',
    input_schema: {
      type: 'object' as const,
      properties: {
        month: { type: 'number', description: 'Mes del período (1–12)' },
        year:  { type: 'number', description: 'Año del período, ej. 2026' },
      },
      required: ['month', 'year'],
    },
  },
  {
    name: 'validate_rfc_69b',
    description:
      'Verifica si un RFC aparece en las listas del Artículo 69-B CFF (EFOS/EDOS). ' +
      'Usa caché de la DB con TTL de 24 horas para no saturar el SAT.',
    input_schema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'RFC a verificar (se normaliza automáticamente a mayúsculas sin espacios)',
        },
      },
      required: ['rfc'],
    },
  },
  {
    name: 'get_cash_flow_summary',
    description:
      'Resumen ejecutivo del flujo de efectivo: ' +
      'proyección a 30 días (ingresos y egresos esperados), ' +
      'facturas pendientes de cobro y total de egresos comprometidos.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_compliance_alerts',
    description:
      'Revisa el cumplimiento fiscal del tenant: ' +
      'alertas de obligaciones próximas a vencer (ISR, IVA, IMSS, DIOT), ' +
      'facturas PPD sin complemento de pago emitido, ' +
      'y corridas de nómina en estado DRAFT.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'explain_journal_entry',
    description:
      'Explica en lenguaje claro y sencillo una póliza contable: ' +
      'qué operación económica representa, qué cuentas afecta con cargos y abonos, ' +
      'y cuál es el impacto en el Balance General y Estado de Resultados.',
    input_schema: {
      type: 'object' as const,
      properties: {
        journal_entry_id: {
          type: 'string',
          description: 'UUID de la póliza contable (JournalEntry.id)',
        },
      },
      required: ['journal_entry_id'],
    },
  },
];

/**
 * Ejecuta un tool por nombre y retorna el resultado como JSON string.
 * El tenantId siempre viene de la sesión del servidor — nunca del cliente.
 */
export async function executeToolById(
  name: string,
  input: Record<string, unknown>,
  tenantId: string,
): Promise<string> {
  switch (name) {
    case 'calculate_iva_balance':
      return JSON.stringify(
        await fetchIvaData(tenantId, Number(input.month), Number(input.year)),
      );
    case 'validate_rfc_69b':
      return JSON.stringify(await fetchRfc69bStatus(String(input.rfc)));
    case 'get_cash_flow_summary':
      return JSON.stringify(await fetchCashFlowSummary(tenantId));
    case 'get_compliance_alerts':
      return JSON.stringify(await fetchComplianceAlerts(tenantId));
    case 'explain_journal_entry':
      return JSON.stringify(
        await fetchJournalEntry(tenantId, String(input.journal_entry_id)),
      );
    default:
      return JSON.stringify({ error: `Tool desconocida: ${name}` });
  }
}
