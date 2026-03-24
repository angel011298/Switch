/**
 * Switch OS — Generador de Cadena Original CFDI 4.0
 * ===================================================
 * Construye la cadena original del comprobante según el
 * orden exacto definido por el XSLT del Anexo 20.
 *
 * La cadena original es una concatenación pipe-delimited (||)
 * de todos los campos del CFDI en un orden estricto.
 *
 * Reglas:
 * - Inicia y termina con ||
 * - Campos vacíos se omiten (sin pipes consecutivos internos)
 * - Espacios internos se normalizan a uno solo
 * - Sin saltos de línea ni tabuladores
 *
 * COSTO: $0 — implementación programática sin XSLT processor.
 *
 * Ref: Anexo 20, "Generación de la Cadena Original", XSLT cadenaoriginal_4_0.xslt
 */

import type { CfdiData } from '../types';
import { formatDecimals, formatRate } from '../arithmetic';

/**
 * Genera la cadena original del CFDI 4.0.
 * El orden de campos sigue exactamente el XSLT oficial del SAT.
 */
export function buildCadenaOriginal(data: CfdiData): string {
  const fields: string[] = [];

  // ─── Comprobante ─────────────────────────────────
  fields.push(data.version);                                    // Version
  if (data.serie) fields.push(data.serie);                      // Serie
  fields.push(String(data.folio));                               // Folio
  fields.push(data.fecha);                                       // Fecha
  fields.push(data.formaPago);                                   // FormaPago
  fields.push(data.noCertificado);                               // NoCertificado
  if (data.condicionesDePago) fields.push(data.condicionesDePago);
  fields.push(formatDecimals(data.subtotal));                    // SubTotal
  if (data.descuento && data.descuento > 0) {
    fields.push(formatDecimals(data.descuento));                 // Descuento
  }
  fields.push(data.moneda);                                      // Moneda
  if (data.moneda !== 'MXN' && data.tipoCambio) {
    fields.push(formatDecimals(data.tipoCambio, 4));             // TipoCambio
  }
  fields.push(formatDecimals(data.total));                       // Total
  fields.push(data.tipoDeComprobante);                           // TipoDeComprobante
  fields.push(data.exportacion);                                 // Exportacion
  fields.push(data.metodoPago);                                  // MetodoPago
  fields.push(data.lugarExpedicion);                             // LugarExpedicion

  // ─── Emisor ──────────────────────────────────────
  fields.push(data.emisor.rfc);
  fields.push(data.emisor.nombre);
  fields.push(data.emisor.regimenFiscal);

  // ─── Receptor ────────────────────────────────────
  fields.push(data.receptor.rfc);
  fields.push(data.receptor.nombre);
  fields.push(data.receptor.domicilioFiscalReceptor);
  fields.push(data.receptor.regimenFiscalReceptor);
  fields.push(data.receptor.usoCfdi);

  // ─── Conceptos ───────────────────────────────────
  for (const concepto of data.conceptos) {
    fields.push(concepto.claveProdServ);
    if (concepto.noIdentificacion) fields.push(concepto.noIdentificacion);
    fields.push(formatDecimals(concepto.cantidad, 6));
    fields.push(concepto.claveUnidad);
    if (concepto.unidad) fields.push(concepto.unidad);
    fields.push(concepto.descripcion);
    fields.push(formatDecimals(concepto.valorUnitario, 6));
    fields.push(formatDecimals(concepto.importe));
    if (concepto.descuento && concepto.descuento > 0) {
      fields.push(formatDecimals(concepto.descuento));
    }
    fields.push(concepto.objetoImp ?? '02');

    // Traslados del concepto
    for (const t of concepto.impuestos.traslados) {
      fields.push(formatDecimals(t.base));
      fields.push(t.impuesto);
      fields.push(t.tipoFactor);
      fields.push(formatRate(t.tasaOCuota));
      fields.push(formatDecimals(t.importe));
    }

    // Retenciones del concepto
    for (const r of concepto.impuestos.retenciones) {
      fields.push(formatDecimals(r.base));
      fields.push(r.impuesto);
      fields.push(r.tipoFactor);
      fields.push(formatRate(r.tasaOCuota));
      fields.push(formatDecimals(r.importe));
    }
  }

  // ─── Impuestos globales ──────────────────────────
  // Retenciones globales
  for (const r of data.impuestos.retenciones) {
    fields.push(r.impuesto);
    fields.push(formatDecimals(r.importe));
  }

  if (data.impuestos.totalImpuestosRetenidos > 0) {
    fields.push(formatDecimals(data.impuestos.totalImpuestosRetenidos));
  }

  // Traslados globales
  for (const t of data.impuestos.traslados) {
    if (t.base !== undefined) fields.push(formatDecimals(t.base));
    fields.push(t.impuesto);
    if (t.tipoFactor) fields.push(t.tipoFactor);
    if (t.tasaOCuota !== undefined) fields.push(formatRate(t.tasaOCuota));
    fields.push(formatDecimals(t.importe));
  }

  if (data.impuestos.totalImpuestosTrasladados > 0) {
    fields.push(formatDecimals(data.impuestos.totalImpuestosTrasladados));
  }

  // Normalizar: trim whitespace y colapsar espacios múltiples
  const normalized = fields.map((f) => f.trim().replace(/\s+/g, ' '));

  return `||${normalized.join('|')}||`;
}
