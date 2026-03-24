/**
 * Switch OS — Sello Digital CFDI 4.0
 * ====================================
 * Firma la cadena original con SHA256-RSA usando crypto nativo.
 *
 * El sello digital es la firma electrónica del comprobante,
 * generada con la llave privada del CSD del emisor.
 *
 * Algoritmo: SHA-256 con RSA (RSA-SHA256)
 * Resultado: Base64
 *
 * COSTO: $0 — crypto nativo de Node.js.
 *
 * Ref: Anexo 20, atributo Sello del nodo Comprobante.
 *      CFF Art. 29 fraccion II — "sello digital del contribuyente"
 */

import crypto from 'crypto';

/**
 * Firma la cadena original con SHA256-RSA y retorna Base64.
 *
 * @param cadenaOriginal - La cadena original pipe-delimited del CFDI
 * @param privateKey - KeyObject de la llave privada descifrada del CSD
 * @returns Sello digital en Base64
 */
export function signCadenaOriginal(
  cadenaOriginal: string,
  privateKey: crypto.KeyObject
): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(cadenaOriginal, 'utf8');
  sign.end();
  return sign.sign(privateKey, 'base64');
}
