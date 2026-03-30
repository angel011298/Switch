/**
 * CIFRA — Cadena Original CFDI 4.0 Nómina v1.2
 * ================================================
 * Construye la cadena original para un CFDI tipo "N" incluyendo
 * los campos del Complemento Nómina v1.2.
 *
 * Orden de campos según xslt oficial SAT:
 * cadenaoriginal_4_0.xslt + nomina12.xslt
 *
 * Ref: SAT Anexo 20 CFDI 4.0 | Complemento Nómina v1.2
 */

import { formatDecimals } from '../arithmetic';
import type { NominaInput } from './builder';

export function buildNominaCadenaOriginal(input: NominaInput): string {
  const deducciones = input.isr + input.imss;
  const neto = input.bruto - deducciones;

  const fields: string[] = [];

  // ─── CFDI Comprobante ─────────────────────────────────────────────────────
  fields.push('4.0');                                      // Version
  if (input.serie) fields.push(input.serie);              // Serie (opcional)
  fields.push(String(input.folio));                       // Folio
  fields.push(input.fecha);                               // Fecha
  // FormaPago: NO se incluye para tipo N
  fields.push(input.noCertificado);                       // NoCertificado
  // CondicionesDePago: no aplica nómina
  fields.push(formatDecimals(input.bruto));               // SubTotal
  fields.push(formatDecimals(deducciones));               // Descuento
  fields.push('MXN');                                     // Moneda
  // TipoCambio: no aplica (MXN)
  fields.push(formatDecimals(neto));                      // Total
  fields.push('N');                                       // TipoDeComprobante
  fields.push('01');                                      // Exportacion
  // MetodoPago: NO se incluye para tipo N
  fields.push(input.lugarExpedicion);                     // LugarExpedicion

  // ─── Emisor ───────────────────────────────────────────────────────────────
  fields.push(input.emisorRfc);
  fields.push(input.emisorNombre);
  fields.push(input.emisorRegimenFiscal);

  // ─── Receptor ─────────────────────────────────────────────────────────────
  fields.push(input.receptorRfc);
  fields.push(input.receptorNombre);
  fields.push(input.receptorZip);
  fields.push('605');
  fields.push('CN01');

  // ─── Conceptos ────────────────────────────────────────────────────────────
  fields.push('84111505');                                // ClaveProdServ
  // NoIdentificacion: no aplica
  fields.push('1.000000');                                // Cantidad
  fields.push('ACT');                                     // ClaveUnidad
  // Unidad: no aplica
  fields.push('Pago de nómina');                         // Descripcion
  fields.push(formatDecimals(input.bruto, 6));            // ValorUnitario
  fields.push(formatDecimals(input.bruto));               // Importe
  fields.push(formatDecimals(deducciones));               // Descuento
  fields.push('01');                                      // ObjetoImp

  // ─── Complemento Nómina v1.2 ─────────────────────────────────────────────
  fields.push('1.2');                                     // Version
  fields.push(input.tipoNomina);                         // TipoNomina
  fields.push(input.fechaPago);                          // FechaPago
  fields.push(input.fechaInicialPago);                   // FechaInicialPago
  fields.push(input.fechaFinalPago);                     // FechaFinalPago
  fields.push(String(input.numDiasPagados));             // NumDiasPagados
  fields.push(formatDecimals(input.bruto));              // TotalPercepciones
  fields.push(formatDecimals(deducciones));              // TotalDeducciones
  fields.push('0.00');                                   // TotalOtrosPagos

  // Nómina Emisor
  if (input.registroPatronal) {
    fields.push(input.registroPatronal);                 // RegistroPatronal (opcional)
  }

  // Nómina Receptor
  fields.push(input.receptorCurp);                      // Curp
  fields.push('01');                                    // TipoContrato
  fields.push('No');                                    // Sindicalizado
  fields.push('01');                                    // TipoJornada
  fields.push('02');                                    // TipoRegimen
  fields.push(input.numEmpleado);                       // NumEmpleado
  if (input.departamento) fields.push(input.departamento); // Departamento (opcional)
  fields.push(input.puesto);                            // Puesto
  fields.push('1');                                     // RiesgoPuesto
  fields.push(input.periodicidadPago);                  // PeriodicidadPago
  fields.push(formatDecimals(input.salarioDiarioIntegrado, 6)); // SalarioDiarioIntegrado
  fields.push(input.claveEntFed ?? 'CMX');              // ClaveEntFed

  // Percepciones
  fields.push(formatDecimals(input.bruto));             // TotalGravado
  fields.push('0.00');                                  // TotalExento

  // Percepcion
  fields.push('001');                                   // TipoPercepcion
  fields.push('P001');                                  // Clave
  fields.push('Sueldos, Salarios Rayas y Jornales');    // Concepto
  fields.push(formatDecimals(input.bruto));             // ImporteGravado
  fields.push('0.00');                                  // ImporteExento

  // Deducciones
  if (input.isr > 0 || input.imss > 0) {
    fields.push('0.00');                                // TotalOtrosPagos
    fields.push(formatDecimals(input.isr));             // TotalImpuestosRetenidos

    if (input.isr > 0) {
      fields.push('002');                               // TipoDeduccion (ISR)
      fields.push('D001');                              // Clave
      fields.push('ISR');                               // Concepto
      fields.push(formatDecimals(input.isr));           // Importe
    }
    if (input.imss > 0) {
      fields.push('001');                               // TipoDeduccion (SS)
      fields.push('D002');                              // Clave
      fields.push('Seguridad Social');                  // Concepto
      fields.push(formatDecimals(input.imss));          // Importe
    }
  }

  // Normalizar: trim + colapsar espacios
  const normalized = fields.map((f) => f.trim().replace(/\s+/g, ' '));
  return `||${normalized.join('|')}||`;
}
