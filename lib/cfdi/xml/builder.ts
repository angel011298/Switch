/**
 * CIFRA — Constructor de XML CFDI 4.0
 * =========================================
 * Genera el XML estructurado del comprobante fiscal digital
 * conforme al Anexo 20 del SAT, usando fast-xml-parser.
 *
 * COSTO: $0 — fast-xml-parser ya está en el proyecto.
 *
 * Estructura del XML:
 * <cfdi:Comprobante>
 *   <cfdi:Emisor />
 *   <cfdi:Receptor />
 *   <cfdi:Conceptos>
 *     <cfdi:Concepto>
 *       <cfdi:Impuestos>
 *         <cfdi:Traslados><cfdi:Traslado /></cfdi:Traslados>
 *         <cfdi:Retenciones><cfdi:Retencion /></cfdi:Retenciones>
 *       </cfdi:Impuestos>
 *     </cfdi:Concepto>
 *   </cfdi:Conceptos>
 *   <cfdi:Impuestos>
 *     <cfdi:Traslados><cfdi:Traslado /></cfdi:Traslados>
 *     <cfdi:Retenciones><cfdi:Retencion /></cfdi:Retenciones>
 *   </cfdi:Impuestos>
 * </cfdi:Comprobante>
 *
 * Ref: Anexo 20 CFDI 4.0, XSD cfdv40.xsd
 */

import { XMLBuilder } from 'fast-xml-parser';
import { CFDI_NAMESPACE, XSI_NAMESPACE, CFDI_SCHEMA_LOCATION } from './namespaces';
import { formatDecimals, formatRate } from '../arithmetic';
import type { CfdiData } from '../types';

/**
 * Construye el XML del CFDI 4.0 completo.
 * Si sello no está presente, genera el XML sin sello (para calcular cadena original).
 */
export function buildCfdiXml(data: CfdiData): string {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    'cfdi:Comprobante': {
      '@_xmlns:cfdi': CFDI_NAMESPACE,
      '@_xmlns:xsi': XSI_NAMESPACE,
      '@_xsi:schemaLocation': CFDI_SCHEMA_LOCATION,
      '@_Version': '4.0',
      ...(data.serie && { '@_Serie': data.serie }),
      '@_Folio': String(data.folio),
      '@_Fecha': data.fecha,
      '@_Sello': data.sello ?? '',
      '@_FormaPago': data.formaPago,
      '@_NoCertificado': data.noCertificado,
      '@_Certificado': data.certificado,
      ...(data.condicionesDePago && { '@_CondicionesDePago': data.condicionesDePago }),
      '@_SubTotal': formatDecimals(data.subtotal),
      ...(data.descuento && data.descuento > 0 && { '@_Descuento': formatDecimals(data.descuento) }),
      '@_Moneda': data.moneda,
      ...(data.moneda !== 'MXN' && data.tipoCambio && {
        '@_TipoCambio': formatDecimals(data.tipoCambio, 4),
      }),
      '@_Total': formatDecimals(data.total),
      '@_TipoDeComprobante': data.tipoDeComprobante,
      '@_Exportacion': data.exportacion,
      '@_MetodoPago': data.metodoPago,
      '@_LugarExpedicion': data.lugarExpedicion,

      // Emisor
      'cfdi:Emisor': {
        '@_Rfc': data.emisor.rfc,
        '@_Nombre': data.emisor.nombre,
        '@_RegimenFiscal': data.emisor.regimenFiscal,
      },

      // Receptor
      'cfdi:Receptor': {
        '@_Rfc': data.receptor.rfc,
        '@_Nombre': data.receptor.nombre,
        '@_DomicilioFiscalReceptor': data.receptor.domicilioFiscalReceptor,
        '@_RegimenFiscalReceptor': data.receptor.regimenFiscalReceptor,
        '@_UsoCFDI': data.receptor.usoCfdi,
      },

      // Conceptos
      'cfdi:Conceptos': {
        'cfdi:Concepto': data.conceptos.map((c) => {
          const concepto: Record<string, unknown> = {
            '@_ClaveProdServ': c.claveProdServ,
            ...(c.noIdentificacion && { '@_NoIdentificacion': c.noIdentificacion }),
            '@_Cantidad': formatDecimals(c.cantidad, 6),
            '@_ClaveUnidad': c.claveUnidad,
            ...(c.unidad && { '@_Unidad': c.unidad }),
            '@_Descripcion': c.descripcion,
            '@_ValorUnitario': formatDecimals(c.valorUnitario, 6),
            '@_Importe': formatDecimals(c.importe),
            ...(c.descuento && c.descuento > 0 && { '@_Descuento': formatDecimals(c.descuento) }),
            '@_ObjetoImp': c.objetoImp ?? '02',
          };

          // Impuestos del concepto
          if (c.impuestos.traslados.length > 0 || c.impuestos.retenciones.length > 0) {
            const impuestos: Record<string, unknown> = {};

            if (c.impuestos.traslados.length > 0) {
              impuestos['cfdi:Traslados'] = {
                'cfdi:Traslado': c.impuestos.traslados.map((t) => ({
                  '@_Base': formatDecimals(t.base),
                  '@_Impuesto': t.impuesto,
                  '@_TipoFactor': t.tipoFactor,
                  '@_TasaOCuota': formatRate(t.tasaOCuota),
                  '@_Importe': formatDecimals(t.importe),
                })),
              };
            }

            if (c.impuestos.retenciones.length > 0) {
              impuestos['cfdi:Retenciones'] = {
                'cfdi:Retencion': c.impuestos.retenciones.map((r) => ({
                  '@_Base': formatDecimals(r.base),
                  '@_Impuesto': r.impuesto,
                  '@_TipoFactor': r.tipoFactor,
                  '@_TasaOCuota': formatRate(r.tasaOCuota),
                  '@_Importe': formatDecimals(r.importe),
                })),
              };
            }

            concepto['cfdi:Impuestos'] = impuestos;
          }

          return concepto;
        }),
      },

      // Impuestos globales del comprobante
      'cfdi:Impuestos': buildImpuestosGlobales(data),
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    suppressEmptyNode: true,
    processEntities: false,
  });

  return builder.build(xmlObj);
}

function buildImpuestosGlobales(data: CfdiData): Record<string, unknown> {
  const impuestos: Record<string, unknown> = {};

  if (data.impuestos.totalImpuestosRetenidos > 0) {
    impuestos['@_TotalImpuestosRetenidos'] = formatDecimals(data.impuestos.totalImpuestosRetenidos);
  }

  if (data.impuestos.totalImpuestosTrasladados > 0) {
    impuestos['@_TotalImpuestosTrasladados'] = formatDecimals(data.impuestos.totalImpuestosTrasladados);
  }

  if (data.impuestos.retenciones.length > 0) {
    impuestos['cfdi:Retenciones'] = {
      'cfdi:Retencion': data.impuestos.retenciones.map((r) => ({
        '@_Impuesto': r.impuesto,
        '@_Importe': formatDecimals(r.importe),
      })),
    };
  }

  if (data.impuestos.traslados.length > 0) {
    impuestos['cfdi:Traslados'] = {
      'cfdi:Traslado': data.impuestos.traslados.map((t) => ({
        '@_Base': formatDecimals(t.base!),
        '@_Impuesto': t.impuesto,
        '@_TipoFactor': t.tipoFactor!,
        '@_TasaOCuota': formatRate(t.tasaOCuota!),
        '@_Importe': formatDecimals(t.importe),
      })),
    };
  }

  return impuestos;
}
