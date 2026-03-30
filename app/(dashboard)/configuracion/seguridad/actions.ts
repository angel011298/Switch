'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSwitchSession } from '@/lib/auth/session';
import { generateTotpSecret, verifyTotp } from '@/lib/2fa/totp';

// ─── Obtener estado 2FA del usuario ──────────────────────────────────────────

export async function get2FAStatus(): Promise<{ enabled: boolean; email: string }> {
  const session = await getSwitchSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorEnabled: true, email: true },
  });
  return {
    enabled: user?.twoFactorEnabled ?? false,
    email: user?.email ?? session.email ?? '',
  };
}

// ─── Iniciar setup de 2FA — genera secreto temporal ─────────────────────────

export async function initiate2FASetup(): Promise<{ secret: string; otpAuthUrl: string }> {
  const session = await getSwitchSession();
  const secret = generateTotpSecret();

  // Guardamos el secreto PENDIENTE (no activado aún)
  await prisma.user.update({
    where: { id: session.userId },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  const { generateOtpAuthUrl } = await import('@/lib/2fa/totp');
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  const otpAuthUrl = generateOtpAuthUrl(user?.email ?? '', secret);

  return { secret, otpAuthUrl };
}

// ─── Confirmar setup de 2FA — verificar primer código ────────────────────────

export async function confirm2FASetup(code: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return { success: false, error: 'Primero inicia la configuración de 2FA' };
  }

  const valid = verifyTotp(code, user.twoFactorSecret);
  if (!valid) {
    return { success: false, error: 'Código incorrecto. Verifica tu app autenticadora.' };
  }

  // Activar 2FA
  await prisma.user.update({
    where: { id: session.userId },
    data: { twoFactorEnabled: true },
  });

  // Marcar sesión actual como verificada (no pedir 2FA en esta sesión)
  const cookieStore = await cookies();
  cookieStore.set('cifra_2fa_verified', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  });

  // Log auditoría
  const userEmail = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: userEmail?.email ?? '',
      action: '2FA_ENABLED',
      resource: 'User',
      resourceId: session.userId,
      severity: 'warning',
    },
  });

  revalidatePath('/configuracion/seguridad');
  return { success: true };
}

// ─── Deshabilitar 2FA ─────────────────────────────────────────────────────────

export async function disable2FA(code: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true, email: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: '2FA no está habilitado' };
  }

  const valid = verifyTotp(code, user.twoFactorSecret);
  if (!valid) {
    return { success: false, error: 'Código incorrecto. Ingresa el código actual de tu app.' };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  // Eliminar cookie de verificación
  const cookieStore = await cookies();
  cookieStore.delete('cifra_2fa_verified');

  // Log auditoría
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: user.email,
      action: '2FA_DISABLED',
      resource: 'User',
      resourceId: session.userId,
      severity: 'critical',
    },
  });

  revalidatePath('/configuracion/seguridad');
  return { success: true };
}

// ─── Verificar código 2FA durante login ───────────────────────────────────────

export async function verify2FALogin(code: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    // 2FA no habilitado — marcar como verificado de todas formas
    const cookieStore = await cookies();
    cookieStore.set('cifra_2fa_verified', '1', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24, path: '/' });
    return { success: true };
  }

  const valid = verifyTotp(code, user.twoFactorSecret);
  if (!valid) {
    return { success: false, error: 'Código incorrecto. Intenta de nuevo.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('cifra_2fa_verified', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  });

  // Log
  const userEmail = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: userEmail?.email ?? '',
      action: '2FA_VERIFIED',
      resource: 'User',
      resourceId: session.userId,
      severity: 'info',
    },
  });

  return { success: true };
}
