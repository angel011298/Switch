/**
 * CIFRA — Motor TOTP para 2FA
 * ============================
 * Usa otplib (RFC 6238) — compatible con Google Authenticator,
 * Authy, Microsoft Authenticator y cualquier app TOTP.
 */

import { authenticator } from 'otplib';

// Ventana de ±1 paso (30s cada uno) para tolerar drift de reloj
authenticator.options = { window: 1 };

/**
 * Genera un nuevo secreto TOTP aleatorio para el usuario.
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret(20);
}

/**
 * Genera la URL otpauth:// para mostrar como QR al usuario.
 * @param email - email del usuario (se muestra en la app)
 * @param secret - secreto TOTP del usuario
 */
export function generateOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, 'CIFRA ERP', secret);
}

/**
 * Verifica un código TOTP de 6 dígitos.
 * @returns true si el código es válido en la ventana actual
 */
export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
