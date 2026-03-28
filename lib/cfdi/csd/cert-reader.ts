/**
 * CIFRA — Lector de Certificados CSD (.cer)
 * ===============================================
 * Extrae información del certificado X.509 del SAT:
 * - Número de certificado (20 dígitos)
 * - Fechas de vigencia
 * - Certificado en Base64 para incluir en el XML
 *
 * Usa crypto.X509Certificate nativo de Node.js (>= 15).
 * COSTO: $0 — sin dependencias externas.
 *
 * Ref: CFF Art. 17-D, Anexo 20 atributo NoCertificado.
 */

import crypto from 'crypto';
import type { CsdInfo } from '../types';

/**
 * Extrae información del certificado .cer (formato DER).
 *
 * El número de certificado del SAT se obtiene del serial number
 * del X.509. El SAT usa seriales de 20 dígitos hexadecimales
 * que se leen como ASCII (cada par hex = un dígito).
 */
export function extractCertInfo(cerDer: Buffer): CsdInfo {
  // Convertir DER a PEM para X509Certificate
  const pem = derToPem(cerDer, 'CERTIFICATE');
  const cert = new crypto.X509Certificate(pem);

  // El serial number viene en hex con separadores ":"
  // SAT usa seriales donde cada byte hex es un dígito ASCII
  const serialHex = cert.serialNumber; // Hex string sin separadores
  const noCertificado = hexToAsciiDigits(serialHex);

  return {
    noCertificado,
    base64Cert: cerDer.toString('base64'),
    validFrom: new Date(cert.validFrom),
    validTo: new Date(cert.validTo),
  };
}

/**
 * Convierte un buffer DER a formato PEM.
 */
function derToPem(der: Buffer, label: string): string {
  const base64 = der.toString('base64');
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

/**
 * Convierte el serial number hexadecimal del SAT a los 20 dígitos
 * del número de certificado.
 *
 * El SAT codifica el número de certificado como bytes ASCII en el
 * campo serial del X.509. Cada byte hex representa un carácter.
 * Ej: hex "3330303031303030303030353030303030303031" → "30001000000500000001"
 */
function hexToAsciiDigits(hex: string): string {
  // Limpiar separadores si los hay
  const clean = hex.replace(/:/g, '').toLowerCase();

  // Cada par de hex = un carácter ASCII (dígito)
  let result = '';
  for (let i = 0; i < clean.length; i += 2) {
    const charCode = parseInt(clean.slice(i, i + 2), 16);
    // Solo dígitos ASCII (0x30 - 0x39 = '0' - '9')
    if (charCode >= 0x30 && charCode <= 0x39) {
      result += String.fromCharCode(charCode);
    }
  }

  return result;
}
