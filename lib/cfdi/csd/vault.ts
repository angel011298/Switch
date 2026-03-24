/**
 * Switch OS — Bóveda de CSD (Certificado de Sello Digital)
 * =========================================================
 * Cifrado AES-256-GCM para la contraseña del .key.
 * Los archivos .cer y .key se almacenan como bytes en PostgreSQL.
 *
 * Seguridad:
 * - La contraseña del .key se cifra con AES-256-GCM (authenticated encryption)
 * - La clave de cifrado viene de process.env.CSD_ENCRYPTION_KEY (32 bytes hex)
 * - IV de 12 bytes + Auth Tag de 16 bytes almacenados junto al ciphertext
 *
 * Ref: CFF Art. 17-D (certificados), Art. 29 fraccion II (sellos digitales)
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { extractCertInfo } from './cert-reader';
import type { CsdDecrypted } from '../types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // GCM standard
const TAG_LENGTH = 16;   // GCM auth tag

function getEncryptionKey(): Buffer {
  const key = process.env.CSD_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'CSD_ENCRYPTION_KEY no configurada o inválida. ' +
      'Debe ser un string hexadecimal de 64 caracteres (32 bytes). ' +
      'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(key, 'hex');
}

/**
 * Cifra la contraseña del .key con AES-256-GCM.
 */
export function encryptPassword(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Descifra la contraseña del .key.
 */
export function decryptPassword(encrypted: string, iv: string, tag: string): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Almacena el CSD de un Tenant en la bóveda.
 * Extrae automáticamente el número de certificado y vigencia del .cer.
 */
export async function storeCsd(
  tenantId: string,
  cerBuffer: Buffer,
  keyBuffer: Buffer,
  password: string
) {
  // Extraer info del certificado
  const certInfo = extractCertInfo(cerBuffer);

  // Cifrar la contraseña
  const { encrypted, iv, tag } = encryptPassword(password);

  // Upsert en la bóveda
  const vault = await prisma.csdVault.upsert({
    where: { tenantId },
    update: {
      cerDer: cerBuffer,
      keyDer: keyBuffer,
      passwordEnc: encrypted,
      passwordIv: iv,
      passwordTag: tag,
      noCertificado: certInfo.noCertificado,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      isActive: true,
    },
    create: {
      tenantId,
      cerDer: cerBuffer,
      keyDer: keyBuffer,
      passwordEnc: encrypted,
      passwordIv: iv,
      passwordTag: tag,
      noCertificado: certInfo.noCertificado,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      isActive: true,
    },
  });

  // Actualizar flags del Tenant
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { csdCerUploaded: true, csdKeyUploaded: true },
  });

  return vault;
}

/**
 * Recupera el CSD descifrado de un Tenant.
 */
export async function getCsd(tenantId: string): Promise<CsdDecrypted> {
  const vault = await prisma.csdVault.findUnique({
    where: { tenantId },
  });

  if (!vault) {
    throw new Error(`CSD no encontrado para Tenant: ${tenantId}. Suba su .cer y .key primero.`);
  }

  if (!vault.isActive) {
    throw new Error('El CSD está desactivado. Suba un nuevo certificado.');
  }

  // Verificar vigencia
  const now = new Date();
  if (now > vault.validTo) {
    throw new Error(
      `El CSD expiró el ${vault.validTo.toISOString().split('T')[0]}. ` +
      'Renueve su certificado en el portal del SAT.'
    );
  }

  const password = decryptPassword(vault.passwordEnc, vault.passwordIv, vault.passwordTag);

  const cerDer = Buffer.from(vault.cerDer);
  const base64Cert = cerDer.toString('base64');

  return {
    cerDer,
    keyDer: Buffer.from(vault.keyDer),
    password,
    noCertificado: vault.noCertificado,
    base64Cert,
  };
}
