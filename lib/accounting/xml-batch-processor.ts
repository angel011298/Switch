/**
 * Switch OS — Procesador Batch de XMLs (ZIP)
 * ============================================
 * Lee un archivo ZIP con cientos de XMLs CFDI 4.0,
 * extrae datos clave de cada XML, y genera pólizas
 * contables automáticamente.
 *
 * Dependencias:
 *   - adm-zip (MIT) — descompresión ZIP
 *   - fast-xml-parser (MIT) — ya en el proyecto
 *
 * Ref: CFF Art. 28, Anexo 24 SAT
 */

import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import type { ParsedCfdiData } from './journal-engine';

// ─── TIPOS ─────────────────────────────────────────────

export interface XmlProcessResult {
  success: boolean;
  fileName: string;
  cfdi?: ParsedCfdiData;
  error?: string;
}

export interface BatchResult {
  totalFiles: number;
  processed: number;
  errors: number;
  results: XmlProcessResult[];
  counters: {
    ingresos: number;
    egresos: number;
    pagos: number;
    nominas: number;
    traslados: number;
  };
  errorLog: string[];
}

// ─── PARSER XML ────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

/**
 * Extrae los datos contables clave de un XML CFDI 4.0.
 */
function parseCfdiXml(xmlContent: string, fileName: string): XmlProcessResult {
  try {
    const parsed = xmlParser.parse(xmlContent);

    // Navegar al nodo Comprobante
    const comprobante =
      parsed?.Comprobante ??
      parsed?.['cfdi:Comprobante'] ??
      null;

    if (!comprobante) {
      return { success: false, fileName, error: 'No se encontró nodo Comprobante' };
    }

    // Emisor
    const emisor =
      comprobante?.Emisor ??
      comprobante?.['cfdi:Emisor'] ??
      {};

    // Receptor
    const receptor =
      comprobante?.Receptor ??
      comprobante?.['cfdi:Receptor'] ??
      {};

    // Complemento → TimbreFiscalDigital para UUID
    const complemento =
      comprobante?.Complemento ??
      comprobante?.['cfdi:Complemento'] ??
      {};

    const timbre =
      complemento?.TimbreFiscalDigital ??
      complemento?.['tfd:TimbreFiscalDigital'] ??
      {};

    const uuid = timbre?.['@_UUID'] ?? timbre?.['@_uuid'] ?? '';

    if (!uuid) {
      return { success: false, fileName, error: 'XML sin UUID (no timbrado)' };
    }

    // Impuestos globales
    const impuestos =
      comprobante?.Impuestos ??
      comprobante?.['cfdi:Impuestos'] ??
      {};

    const totalTrasladados = parseFloat(impuestos?.['@_TotalImpuestosTrasladados'] ?? '0');
    const totalRetenidos = parseFloat(impuestos?.['@_TotalImpuestosRetenidos'] ?? '0');

    const cfdi: ParsedCfdiData = {
      uuid,
      tipoComprobante: comprobante?.['@_TipoDeComprobante'] ?? 'I',
      fecha: new Date(comprobante?.['@_Fecha'] ?? new Date().toISOString()),
      emisorRfc: emisor?.['@_Rfc'] ?? '',
      emisorNombre: emisor?.['@_Nombre'] ?? '',
      receptorRfc: receptor?.['@_Rfc'] ?? '',
      receptorNombre: receptor?.['@_Nombre'] ?? '',
      subtotal: parseFloat(comprobante?.['@_SubTotal'] ?? '0'),
      total: parseFloat(comprobante?.['@_Total'] ?? '0'),
      totalImpuestosTrasladados: totalTrasladados,
      totalImpuestosRetenidos: totalRetenidos,
      formaPago: comprobante?.['@_FormaPago'],
      moneda: comprobante?.['@_Moneda'] ?? 'MXN',
    };

    return { success: true, fileName, cfdi };
  } catch (err) {
    return {
      success: false,
      fileName,
      error: err instanceof Error ? err.message : 'Error desconocido al parsear XML',
    };
  }
}

// ─── PROCESADOR BATCH ──────────────────────────────────

/**
 * Procesa un buffer ZIP con XMLs CFDI.
 * Retorna los datos parseados de cada XML para generar pólizas.
 */
export function processZipBuffer(zipBuffer: Buffer): BatchResult {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const xmlEntries = entries.filter(
    (e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.xml')
  );

  const result: BatchResult = {
    totalFiles: xmlEntries.length,
    processed: 0,
    errors: 0,
    results: [],
    counters: { ingresos: 0, egresos: 0, pagos: 0, nominas: 0, traslados: 0 },
    errorLog: [],
  };

  for (const entry of xmlEntries) {
    const xmlContent = entry.getData().toString('utf8');
    const parseResult = parseCfdiXml(xmlContent, entry.entryName);

    result.results.push(parseResult);

    if (parseResult.success && parseResult.cfdi) {
      result.processed++;
      switch (parseResult.cfdi.tipoComprobante) {
        case 'I': result.counters.ingresos++; break;
        case 'E': result.counters.egresos++; break;
        case 'P': result.counters.pagos++; break;
        case 'N': result.counters.nominas++; break;
        case 'T': result.counters.traslados++; break;
      }
    } else {
      result.errors++;
      result.errorLog.push(`${entry.entryName}: ${parseResult.error}`);
    }
  }

  return result;
}
