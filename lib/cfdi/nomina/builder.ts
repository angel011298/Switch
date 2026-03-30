/**
 * CIFRA — Constructor de XML CFDI 4.0 Nómina
 * ================================================
 * Genera el XML del CFDI tipo "N" con Complemento de Nómina v1.2
 * conforme al Anexo 20 del SAT.
 *
 * Ref: Anexo 20 CFDI 4.0 | Complemento Nómina v1.2 (nomina12.xsd)
 *      SAT: http://www.sat.gob.mx/nomina12
 */

import { XMLBuilder } from 'fast-xml-parser';
import { CFDI_NAMESPACE, XSI_NAMESPACE } from '../xml/namespaces';
import { formatDecimals } from '../arithmetic';

const NOMINA_NAMESPACE = 'http://www.sat.gob.mx/nomina12';

export interface NominaInput {
  // Datos del comprobante
  noCertificado: string;
  certificado: string;       // base64 del .cer
  sello?: string;            // se inyecta después de firmar
  lugarExpedicion: string;   // CP del emisor
  serie?: string;
  folio: number;
  fecha: string;             // "2026-03-15T14:00:00"

  // Emisor (empresa)
  emisorRfc: string;
  emisorNombre: string;
  emisorRegimenFiscal: string;
  registroPatronal?: string;

  // Receptor (empleado)
  receptorRfc: string;       // RFC del empleado o "XAXX010101000"
  receptorNombre: string;
  receptorCurp: string;
  receptorZip: string;       // CP fiscal del receptor
  numEmpleado: string;
  departamento?: string;
  puesto: string;
  claveEntFed?: string;      // default "CMX"

  // Periodo
  tipoNomina: 'O' | 'E';
  fechaPago: string;
  fechaInicialPago: string;
  fechaFinalPago: string;
  numDiasPagados: number;
  periodicidadPago: string;  // "04"=Quincenal "05"=Mensual

  // Cantidades
  bruto: number;
  isr: number;
  imss: number;
  salarioDiarioIntegrado: number;
}

export function buildNominaCfdiXml(input: NominaInput): string {
  const deducciones = input.isr + input.imss;
  const neto = input.bruto - deducciones;

  const schemaLocation = [
    `${CFDI_NAMESPACE} http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd`,
    `${NOMINA_NAMESPACE} http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd`,
  ].join(' ');

  // Build deducciones list
  const deduccionList: Record<string, string>[] = [];
  if (input.isr > 0) {
    deduccionList.push({
      '@_TipoDeduccion': '002',
      '@_Clave': 'D001',
      '@_Concepto': 'ISR',
      '@_Importe': formatDecimals(input.isr),
    });
  }
  if (input.imss > 0) {
    deduccionList.push({
      '@_TipoDeduccion': '001',
      '@_Clave': 'D002',
      '@_Concepto': 'Seguridad Social',
      '@_Importe': formatDecimals(input.imss),
    });
  }

  const nominaEmisor: Record<string, string> = {};
  if (input.registroPatronal) {
    nominaEmisor['@_RegistroPatronal'] = input.registroPatronal;
  }

  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    'cfdi:Comprobante': {
      '@_xmlns:cfdi': CFDI_NAMESPACE,
      '@_xmlns:xsi': XSI_NAMESPACE,
      '@_xmlns:nomina12': NOMINA_NAMESPACE,
      '@_xsi:schemaLocation': schemaLocation,
      '@_Version': '4.0',
      ...(input.serie && { '@_Serie': input.serie }),
      '@_Folio': String(input.folio),
      '@_Fecha': input.fecha,
      '@_Sello': input.sello ?? '',
      '@_NoCertificado': input.noCertificado,
      '@_Certificado': input.certificado,
      '@_SubTotal': formatDecimals(input.bruto),
      '@_Descuento': formatDecimals(deducciones),
      '@_Moneda': 'MXN',
      '@_Total': formatDecimals(neto),
      '@_TipoDeComprobante': 'N',
      '@_Exportacion': '01',
      '@_LugarExpedicion': input.lugarExpedicion,

      'cfdi:Emisor': {
        '@_Rfc': input.emisorRfc,
        '@_Nombre': input.emisorNombre,
        '@_RegimenFiscal': input.emisorRegimenFiscal,
      },

      'cfdi:Receptor': {
        '@_Rfc': input.receptorRfc,
        '@_Nombre': input.receptorNombre,
        '@_DomicilioFiscalReceptor': input.receptorZip,
        '@_RegimenFiscalReceptor': '605',
        '@_UsoCFDI': 'CN01',
      },

      'cfdi:Conceptos': {
        'cfdi:Concepto': {
          '@_ClaveProdServ': '84111505',
          '@_Cantidad': '1.000000',
          '@_ClaveUnidad': 'ACT',
          '@_Descripcion': 'Pago de nómina',
          '@_ValorUnitario': formatDecimals(input.bruto, 6),
          '@_Importe': formatDecimals(input.bruto),
          '@_Descuento': formatDecimals(deducciones),
          '@_ObjetoImp': '01',
        },
      },

      'cfdi:Complemento': {
        'nomina12:Nomina': {
          '@_Version': '1.2',
          '@_TipoNomina': input.tipoNomina,
          '@_FechaPago': input.fechaPago,
          '@_FechaInicialPago': input.fechaInicialPago,
          '@_FechaFinalPago': input.fechaFinalPago,
          '@_NumDiasPagados': String(input.numDiasPagados),
          '@_TotalPercepciones': formatDecimals(input.bruto),
          '@_TotalDeducciones': formatDecimals(deducciones),
          '@_TotalOtrosPagos': '0.00',

          ...(Object.keys(nominaEmisor).length > 0 && { 'nomina12:Emisor': nominaEmisor }),

          'nomina12:Receptor': {
            '@_Curp': input.receptorCurp,
            '@_TipoContrato': '01',
            '@_Sindicalizado': 'No',
            '@_TipoJornada': '01',
            '@_TipoRegimen': '02',
            '@_NumEmpleado': input.numEmpleado,
            ...(input.departamento && { '@_Departamento': input.departamento }),
            '@_Puesto': input.puesto,
            '@_RiesgoPuesto': '1',
            '@_PeriodicidadPago': input.periodicidadPago,
            '@_SalarioDiarioIntegrado': formatDecimals(input.salarioDiarioIntegrado, 6),
            '@_ClaveEntFed': input.claveEntFed ?? 'CMX',
          },

          'nomina12:Percepciones': {
            '@_TotalGravado': formatDecimals(input.bruto),
            '@_TotalExento': '0.00',
            'nomina12:Percepcion': {
              '@_TipoPercepcion': '001',
              '@_Clave': 'P001',
              '@_Concepto': 'Sueldos, Salarios Rayas y Jornales',
              '@_ImporteGravado': formatDecimals(input.bruto),
              '@_ImporteExento': '0.00',
            },
          },

          ...(deduccionList.length > 0 && {
            'nomina12:Deducciones': {
              '@_TotalOtrosPagos': '0.00',
              '@_TotalImpuestosRetenidos': formatDecimals(input.isr),
              'nomina12:Deduccion': deduccionList,
            },
          }),
        },
      },
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
