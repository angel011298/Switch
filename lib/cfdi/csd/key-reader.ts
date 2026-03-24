/**
 * Switch OS — Lector de Llave Privada CSD (.key)
 * ================================================
 * Convierte el archivo .key del SAT (PKCS#8 DER cifrado)
 * a un KeyObject de Node.js para firmar la cadena original.
 *
 * El .key del SAT es un archivo DER cifrado con contraseña.
 * Formato: PKCS#8 EncryptedPrivateKeyInfo (RFC 5958).
 *
 * Proceso:
 * 1. Buffer DER → Base64 → PEM con headers ENCRYPTED PRIVATE KEY
 * 2. crypto.createPrivateKey() descifra con la contraseña
 *
 * COSTO: $0 — usa crypto nativo de Node.js.
 * Ref: CFF Art. 17-D.
 */

import crypto from 'crypto';

/**
 * Descifra la llave privada .key del SAT y retorna un KeyObject.
 *
 * @param keyDer - Buffer con el contenido binario del archivo .key
 * @param password - Contraseña de la llave (la que se usó al generar el CSD)
 * @returns crypto.KeyObject listo para firmar
 */
export function decryptPrivateKey(keyDer: Buffer, password: string): crypto.KeyObject {
  // Convertir DER a PEM con headers de llave cifrada
  const pem = derToPem(keyDer, 'ENCRYPTED PRIVATE KEY');

  try {
    return crypto.createPrivateKey({
      key: pem,
      format: 'pem',
      passphrase: password,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('bad decrypt') || msg.includes('wrong password')) {
      throw new Error('Contraseña del CSD incorrecta. Verifique la contraseña de su llave privada.');
    }
    throw new Error(`Error al descifrar la llave privada: ${msg}`);
  }
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
