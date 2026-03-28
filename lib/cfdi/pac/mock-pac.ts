/**
 * CIFRA — PAC Mock / Sandbox
 * ===============================
 * Implementación mock del PAC para desarrollo y pruebas.
 * Genera UUIDs ficticios y timbres simulados sin contactar al SAT.
 *
 * COSTO: $0 — no requiere cuenta PAC ni API keys.
 *
 * En producción, se reemplaza por un PAC real (Finkok, SW Sapien, etc.)
 * simplemente cambiando la instancia del adapter.
 */

import crypto from 'crypto';
import type { PacAdapter, PacStampResult, PacCancelResult, PacStatusResult } from './adapter';

export class MockPac implements PacAdapter {
  readonly name = 'MockPAC-Sandbox';

  async stamp(xmlSellado: string): Promise<PacStampResult> {
    // Simular latencia de red
    await sleep(200);

    const uuid = crypto.randomUUID();
    const fechaTimbrado = new Date().toISOString().replace('Z', '');
    const selloSat = crypto.randomBytes(128).toString('base64');
    const noCertificadoSat = '00001000000504465028';
    const rfcProvCertif = 'SAT970701NN3';

    // Inyectar complemento TimbreFiscalDigital en el XML
    const tfdComplement = [
      '<cfdi:Complemento>',
      `  <tfd:TimbreFiscalDigital`,
      `    xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"`,
      `    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
      `    xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd"`,
      `    Version="1.1"`,
      `    UUID="${uuid}"`,
      `    FechaTimbrado="${fechaTimbrado}"`,
      `    RfcProvCertif="${rfcProvCertif}"`,
      `    SelloCFD="${extractSello(xmlSellado)}"`,
      `    NoCertificadoSAT="${noCertificadoSat}"`,
      `    SelloSAT="${selloSat}"`,
      `  />`,
      '</cfdi:Complemento>',
    ].join('\n');

    // Insertar antes del cierre de </cfdi:Comprobante>
    const xmlTimbrado = xmlSellado.replace(
      '</cfdi:Comprobante>',
      `${tfdComplement}\n</cfdi:Comprobante>`
    );

    return {
      success: true,
      uuid,
      fechaTimbrado,
      selloSat,
      noCertificadoSat,
      rfcProvCertif,
      xmlTimbrado,
    };
  }

  async cancel(
    uuid: string,
    _rfcEmisor: string,
    motivo: string,
    folioSustitucion?: string
  ): Promise<PacCancelResult> {
    await sleep(150);

    const acuse = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<Acuse>`,
      `  <UUID>${uuid}</UUID>`,
      `  <Motivo>${motivo}</Motivo>`,
      folioSustitucion ? `  <FolioSustitucion>${folioSustitucion}</FolioSustitucion>` : '',
      `  <Estatus>Cancelado</Estatus>`,
      `  <Fecha>${new Date().toISOString()}</Fecha>`,
      `</Acuse>`,
    ].filter(Boolean).join('\n');

    return {
      success: true,
      acuse,
    };
  }

  async status(
    uuid: string,
    _rfcEmisor: string,
    _rfcReceptor: string,
    _total: string
  ): Promise<PacStatusResult> {
    await sleep(100);

    return {
      esCancelable: 'Cancelable sin aceptación',
      estado: 'Vigente',
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSello(xml: string): string {
  const match = xml.match(/Sello="([^"]*)"/);
  return match?.[1] ?? '';
}
