/**
 * CIFRA — Orquestador del Motor CFDI 4.0
 * =============================================
 * Pipeline completo de facturación electrónica:
 *
 * 1. Validar input
 * 2. Cargar perfil fiscal del Tenant + CSD
 * 3. Calcular impuestos por concepto (Tax Engine)
 * 4. Computar totales con aritmética SAT
 * 5. Construir XML CFDI 4.0
 * 6. Generar cadena original
 * 7. Firmar con sello digital (SHA256-RSA)
 * 8. Inyectar sello en XML
 * 9. Enviar a PAC para timbrado
 * 10. Persistir factura en DB
 *
 * COSTO: $0 — todo nativo, sin APIs de pago.
 *
 * Ref: CFF Art. 29, 29-A | Anexo 20 CFDI 4.0 | LIVA | LISR
 */

import prisma from '@/lib/prisma';
import { getCsd } from './csd/vault';
import { decryptPrivateKey } from './csd/key-reader';
import { buildCfdiXml } from './xml/builder';
import { buildCadenaOriginal } from './seal/cadena-original';
import { signCadenaOriginal } from './seal/digital-seal';
import { roundSat, computeImporte, computeTax } from './arithmetic';
import { TAX_TYPE_TO_SAT, TIPO_FACTOR } from './catalogs/sat-catalogs';
import { calculateTransactionTaxes } from '@/lib/taxes/taxEngine';
import type { PacAdapter } from './pac/adapter';
import { MockPac } from './pac/mock-pac';
import { SwSapienPac } from './pac/sw-sapien';
import type {
  CfdiInput,
  CfdiData,
  CfdiResult,
  CfdiConcepto,
  CfdiImpuestoLinea,
  CfdiImpuestoAgregado,
  CfdiImpuestosGlobal,
  CfdiEmisor,
} from './types';
import type { OperationType } from '@prisma/client';

// ─── CONFIGURACIÓN ─────────────────────────────────────

function getPacAdapter(): PacAdapter {
  const swToken = process.env.SW_SAPIEN_TOKEN;
  if (swToken) {
    // Usar SW Sapien real (sandbox si la URL contiene "test", producción si no)
    const isSandbox = (process.env.SW_SAPIEN_URL ?? 'test').includes('test');
    return new SwSapienPac(swToken, isSandbox);
  }
  // Sin token → mock (desarrollo)
  return new MockPac();
}

// ─── PIPELINE PRINCIPAL ────────────────────────────────

export async function createCfdi(
  input: CfdiInput,
  pac?: PacAdapter
): Promise<CfdiResult> {
  const pacAdapter = pac ?? getPacAdapter();

  // ─── 1. Cargar perfil fiscal del Tenant ──────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    include: { taxRegime: true },
  });

  if (!tenant) throw new CfdiError('Tenant no encontrado', 'TENANT_NOT_FOUND');
  if (!tenant.rfc) throw new CfdiError('RFC del emisor no configurado', 'MISSING_RFC');
  if (!tenant.legalName) throw new CfdiError('Razón social no configurada', 'MISSING_LEGAL_NAME');
  if (!tenant.taxRegime) throw new CfdiError('Régimen fiscal no configurado', 'MISSING_REGIME');
  if (!tenant.zipCode) throw new CfdiError('Código postal fiscal no configurado', 'MISSING_ZIP');

  // ─── 2. Cargar CSD ──────────────────────────────
  const csd = await getCsd(input.tenantId);
  const privateKey = decryptPrivateKey(csd.keyDer, csd.password);

  const emisor: CfdiEmisor = {
    rfc: tenant.rfc,
    nombre: tenant.legalName,
    regimenFiscal: tenant.taxRegime.satCode,
  };

  // ─── 3. Calcular impuestos por concepto ──────────
  const operationType = inferOperationType(input);
  const conceptos: CfdiConcepto[] = [];

  for (const c of input.conceptos) {
    const importe = computeImporte(c.cantidad, c.valorUnitario);
    const base = roundSat(importe - (c.descuento ?? 0));

    // Usar Tax Engine para calcular impuestos
    const taxResult = await calculateTransactionTaxes({
      amount: base,
      tenantId: input.tenantId,
      operationType,
    });

    const traslados: CfdiImpuestoLinea[] = taxResult.transferredTaxes.map((t) => ({
      base,
      impuesto: TAX_TYPE_TO_SAT[t.taxType] ?? '002',
      tipoFactor: TIPO_FACTOR.TASA,
      tasaOCuota: t.rate,
      importe: t.amount,
    }));

    const retenciones: CfdiImpuestoLinea[] = taxResult.withheldTaxes.map((r) => ({
      base,
      impuesto: TAX_TYPE_TO_SAT[r.taxType] ?? '001',
      tipoFactor: TIPO_FACTOR.TASA,
      tasaOCuota: r.rate,
      importe: r.amount,
    }));

    conceptos.push({
      ...c,
      importe,
      objetoImp: c.objetoImp ?? '02',
      impuestos: { traslados, retenciones },
    });
  }

  // ─── 4. Computar totales ─────────────────────────
  const subtotal = roundSat(conceptos.reduce((sum, c) => sum + c.importe, 0));
  const descuento = roundSat(conceptos.reduce((sum, c) => sum + (c.descuento ?? 0), 0));

  const impuestosGlobal = aggregateImpuestos(conceptos);

  const total = roundSat(
    subtotal - descuento +
    impuestosGlobal.totalImpuestosTrasladados -
    impuestosGlobal.totalImpuestosRetenidos
  );

  // ─── 5. Obtener folio ───────────────────────────
  const folio = await getNextFolio(input.tenantId, input.serie ?? null);

  // ─── 6. Construir CfdiData ──────────────────────
  const fecha = new Date().toISOString().replace('Z', '').split('.')[0];

  const cfdiData: CfdiData = {
    version: '4.0',
    serie: input.serie,
    folio,
    fecha,
    formaPago: input.formaPago,
    noCertificado: csd.noCertificado,
    certificado: csd.base64Cert,
    condicionesDePago: input.condicionesDePago,
    subtotal,
    descuento: descuento > 0 ? descuento : undefined,
    moneda: input.moneda ?? 'MXN',
    tipoCambio: input.tipoCambio,
    total,
    tipoDeComprobante: input.tipoComprobante ?? 'I',
    exportacion: input.exportacion ?? '01',
    metodoPago: input.metodoPago,
    lugarExpedicion: tenant.zipCode,
    emisor,
    receptor: input.receptor,
    conceptos,
    impuestos: impuestosGlobal,
  };

  // ─── 7. Generar cadena original ─────────────────
  const cadenaOriginal = buildCadenaOriginal(cfdiData);

  // ─── 8. Firmar (sello digital) ──────────────────
  const sello = signCadenaOriginal(cadenaOriginal, privateKey);
  cfdiData.sello = sello;

  // ─── 9. Construir XML final con sello ───────────
  const xmlSellado = buildCfdiXml(cfdiData);

  // ─── 10. Timbrar con PAC ────────────────────────
  const stampResult = await pacAdapter.stamp(xmlSellado);

  if (!stampResult.success) {
    // Guardar como ERROR
    const invoice = await persistInvoice(cfdiData, input, cadenaOriginal, sello, null, 'ERROR');
    throw new CfdiError(
      `Error de timbrado PAC (${pacAdapter.name}): ${stampResult.error}`,
      'PAC_STAMP_ERROR'
    );
  }

  // ─── 11. Persistir en DB ────────────────────────
  const invoice = await persistInvoice(
    cfdiData,
    input,
    cadenaOriginal,
    sello,
    stampResult,
    'STAMPED'
  );

  return {
    invoiceId: invoice.id,
    uuid: stampResult.uuid,
    status: 'STAMPED',
    serie: input.serie ?? null,
    folio,
    xml: stampResult.xmlTimbrado ?? xmlSellado,
    cadenaOriginal,
    sello,
    total,
    fechaEmision: fecha,
    fechaTimbrado: stampResult.fechaTimbrado,
  };
}

// ─── HELPERS ───────────────────────────────────────────

/**
 * Agrega impuestos de todos los conceptos al nivel global del comprobante.
 */
function aggregateImpuestos(conceptos: CfdiConcepto[]): CfdiImpuestosGlobal {
  // Agrupar traslados por impuesto+tasa
  const trasladosMap = new Map<string, CfdiImpuestoAgregado>();
  const retencionesMap = new Map<string, CfdiImpuestoAgregado>();

  for (const c of conceptos) {
    for (const t of c.impuestos.traslados) {
      const key = `${t.impuesto}:${t.tasaOCuota}`;
      const existing = trasladosMap.get(key);
      if (existing) {
        existing.base = roundSat((existing.base ?? 0) + t.base);
        existing.importe = roundSat(existing.importe + t.importe);
      } else {
        trasladosMap.set(key, {
          base: t.base,
          impuesto: t.impuesto,
          tipoFactor: t.tipoFactor,
          tasaOCuota: t.tasaOCuota,
          importe: t.importe,
        });
      }
    }

    for (const r of c.impuestos.retenciones) {
      const key = r.impuesto;
      const existing = retencionesMap.get(key);
      if (existing) {
        existing.importe = roundSat(existing.importe + r.importe);
      } else {
        retencionesMap.set(key, {
          impuesto: r.impuesto,
          importe: r.importe,
        });
      }
    }
  }

  const traslados = Array.from(trasladosMap.values());
  const retenciones = Array.from(retencionesMap.values());

  return {
    totalImpuestosTrasladados: roundSat(traslados.reduce((s, t) => s + t.importe, 0)),
    totalImpuestosRetenidos: roundSat(retenciones.reduce((s, r) => s + r.importe, 0)),
    traslados,
    retenciones,
  };
}

/**
 * Obtiene el siguiente folio para un tenant+serie.
 */
async function getNextFolio(tenantId: string, serie: string | null): Promise<number> {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { tenantId, serie },
    orderBy: { folio: 'desc' },
    select: { folio: true },
  });
  return (lastInvoice?.folio ?? 0) + 1;
}

/**
 * Infiere el tipo de operación del Tax Engine basándose en el comprobante.
 */
function inferOperationType(input: CfdiInput): OperationType {
  // Por defecto, venta de servicios para tipo Ingreso
  // En el futuro, esto puede ser más sofisticado
  const tipo = input.tipoComprobante ?? 'I';
  if (tipo === 'E') return 'PURCHASE_PRODUCT';
  if (tipo === 'N') return 'PAYROLL';
  return 'SALE_SERVICE';
}

/**
 * Persiste la factura y sus conceptos en la base de datos.
 */
async function persistInvoice(
  data: CfdiData,
  input: CfdiInput,
  cadenaOriginal: string,
  sello: string,
  stamp: { uuid: string | null; fechaTimbrado: string | null; selloSat: string | null; noCertificadoSat: string | null; rfcProvCertif: string | null; xmlTimbrado: string | null } | null,
  status: 'STAMPED' | 'ERROR'
) {
  return prisma.invoice.create({
    data: {
      tenantId: input.tenantId,
      status,
      serie: data.serie,
      folio: data.folio,
      uuid: stamp?.uuid,
      fechaEmision: new Date(data.fecha),
      tipoComprobante: data.tipoDeComprobante as 'I' | 'E' | 'T' | 'P' | 'N',
      formaPago: data.formaPago,
      metodoPago: data.metodoPago as 'PUE' | 'PPD',
      moneda: data.moneda,
      tipoCambio: data.tipoCambio,
      lugarExpedicion: data.lugarExpedicion,
      exportacion: data.exportacion,
      condicionesDePago: data.condicionesDePago,

      emisorRfc: data.emisor.rfc,
      emisorNombre: data.emisor.nombre,
      emisorRegimenFiscal: data.emisor.regimenFiscal,

      receptorRfc: data.receptor.rfc,
      receptorNombre: data.receptor.nombre,
      receptorDomicilioFiscal: data.receptor.domicilioFiscalReceptor,
      receptorRegimenFiscal: data.receptor.regimenFiscalReceptor,
      receptorUsoCfdi: data.receptor.usoCfdi,

      subtotal: data.subtotal,
      descuento: data.descuento ?? 0,
      totalImpuestosTrasladados: data.impuestos.totalImpuestosTrasladados,
      totalImpuestosRetenidos: data.impuestos.totalImpuestosRetenidos,
      total: data.total,

      noCertificado: data.noCertificado,
      certificado: data.certificado,
      sello,
      cadenaOriginal,

      selloSat: stamp?.selloSat,
      noCertificadoSat: stamp?.noCertificadoSat,
      fechaTimbrado: stamp?.fechaTimbrado ? new Date(stamp.fechaTimbrado) : null,
      rfcProvCertif: stamp?.rfcProvCertif,
      xmlTimbrado: stamp?.xmlTimbrado,

      items: {
        create: data.conceptos.map((c) => ({
          claveProdServ: c.claveProdServ,
          noIdentificacion: c.noIdentificacion,
          cantidad: c.cantidad,
          claveUnidad: c.claveUnidad,
          unidad: c.unidad,
          descripcion: c.descripcion,
          valorUnitario: c.valorUnitario,
          importe: c.importe,
          descuento: c.descuento ?? 0,
          objetoImp: c.objetoImp ?? '02',

          // Primer traslado (el más común: IVA)
          trasladoBase: c.impuestos.traslados[0]?.base,
          trasladoImpuesto: c.impuestos.traslados[0]?.impuesto,
          trasladoTipoFactor: c.impuestos.traslados[0]?.tipoFactor,
          trasladoTasaOCuota: c.impuestos.traslados[0]?.tasaOCuota,
          trasladoImporte: c.impuestos.traslados[0]?.importe,

          // Primera retención
          retencionBase: c.impuestos.retenciones[0]?.base,
          retencionImpuesto: c.impuestos.retenciones[0]?.impuesto,
          retencionTipoFactor: c.impuestos.retenciones[0]?.tipoFactor,
          retencionTasaOCuota: c.impuestos.retenciones[0]?.tasaOCuota,
          retencionImporte: c.impuestos.retenciones[0]?.importe,
        })),
      },
    },
  });
}

// ─── ERRORES ───────────────────────────────────────────

export class CfdiError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'CfdiError';
  }
}

// ─── RE-EXPORTS ────────────────────────────────────────

export { getCsd, storeCsd } from './csd/vault';
export { MockPac } from './pac/mock-pac';
export { SwSapienPac } from './pac/sw-sapien';
export type { PacAdapter } from './pac/adapter';
export type { CfdiInput, CfdiResult, CfdiReceptor, CfdiConceptoInput } from './types';
