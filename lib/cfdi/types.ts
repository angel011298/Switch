/**
 * Switch OS — Tipos del Motor de Facturación CFDI 4.0
 * ====================================================
 * Interfaces TypeScript que mapean 1:1 con la estructura
 * del Anexo 20 del SAT para CFDI versión 4.0.
 */

import type { TipoComprobante, MetodoPago, InvoiceStatus } from '@prisma/client';

// ─── INPUT: Lo que el usuario proporciona ──────────────

export interface CfdiInput {
  tenantId: string;
  serie?: string;
  tipoComprobante?: TipoComprobante;
  formaPago: string;           // c_FormaPago (ej. "01", "03", "99")
  metodoPago: MetodoPago;
  moneda?: string;             // Default "MXN"
  tipoCambio?: number;
  condicionesDePago?: string;
  exportacion?: string;        // Default "01"

  // Receptor
  receptor: CfdiReceptor;

  // Conceptos (líneas de la factura)
  conceptos: CfdiConceptoInput[];
}

export interface CfdiReceptor {
  rfc: string;
  nombre: string;
  domicilioFiscalReceptor: string;  // Código postal
  regimenFiscalReceptor: string;    // c_RegimenFiscal
  usoCfdi: string;                  // c_UsoCFDI
}

export interface CfdiConceptoInput {
  claveProdServ: string;       // c_ClaveProdServ
  noIdentificacion?: string;
  cantidad: number;
  claveUnidad: string;         // c_ClaveUnidad
  unidad?: string;
  descripcion: string;
  valorUnitario: number;
  descuento?: number;
  objetoImp?: string;          // Default "02"
}

// ─── DATOS PROCESADOS (internos del engine) ────────────

export interface CfdiEmisor {
  rfc: string;
  nombre: string;
  regimenFiscal: string;
}

export interface CfdiConcepto extends CfdiConceptoInput {
  importe: number;             // cantidad * valorUnitario (redondeado 2 dec)
  impuestos: CfdiConceptoImpuestos;
}

export interface CfdiConceptoImpuestos {
  traslados: CfdiImpuestoLinea[];
  retenciones: CfdiImpuestoLinea[];
}

export interface CfdiImpuestoLinea {
  base: number;
  impuesto: string;            // "001" = ISR, "002" = IVA, "003" = IEPS
  tipoFactor: string;          // "Tasa", "Cuota", "Exento"
  tasaOCuota: number;          // 6 decimales (ej. 0.160000)
  importe: number;             // 2 decimales
}

// ─── DOCUMENTO COMPLETO (antes de sellado) ─────────────

export interface CfdiData {
  version: '4.0';
  serie?: string;
  folio: number;
  fecha: string;               // ISO: "2024-01-15T10:30:00"
  formaPago: string;
  noCertificado: string;
  certificado: string;         // Base64 del .cer
  condicionesDePago?: string;
  subtotal: number;
  descuento?: number;
  moneda: string;
  tipoCambio?: number;
  total: number;
  tipoDeComprobante: string;   // "I", "E", "T", "P", "N"
  exportacion: string;
  metodoPago: string;
  lugarExpedicion: string;
  sello?: string;              // Se inyecta después de firmar

  emisor: CfdiEmisor;
  receptor: CfdiReceptor;
  conceptos: CfdiConcepto[];

  impuestos: CfdiImpuestosGlobal;
}

export interface CfdiImpuestosGlobal {
  totalImpuestosTrasladados: number;
  totalImpuestosRetenidos: number;
  traslados: CfdiImpuestoAgregado[];
  retenciones: CfdiImpuestoAgregado[];
}

export interface CfdiImpuestoAgregado {
  base?: number;               // Solo en traslados
  impuesto: string;
  tipoFactor?: string;         // Solo en traslados
  tasaOCuota?: number;         // Solo en traslados
  importe: number;
}

// ─── RESULTADO FINAL ───────────────────────────────────

export interface CfdiResult {
  invoiceId: string;
  uuid: string | null;
  status: InvoiceStatus;
  serie: string | null;
  folio: number;
  xml: string;
  cadenaOriginal: string;
  sello: string;
  total: number;
  fechaEmision: string;
  fechaTimbrado: string | null;
}

// ─── CSD ───────────────────────────────────────────────

export interface CsdInfo {
  noCertificado: string;
  base64Cert: string;
  validFrom: Date;
  validTo: Date;
}

export interface CsdDecrypted {
  cerDer: Buffer;
  keyDer: Buffer;
  password: string;
  noCertificado: string;
  base64Cert: string;
}
