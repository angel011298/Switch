'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Actualiza nombre y avatar en Prisma (Identidad Global).
 */
export async function updateProfile(data: { name: string; avatarUrl?: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false, error: 'No autorizado' };

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl || null,
      },
    });
    revalidatePath('/settings/profile');
    return { ok: true };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return { ok: false, error: 'Error al actualizar base de datos' };
  }
}

/**
 * Actualiza email o password en Supabase Auth.
 */
export async function updateSecurity(data: { email: string; password?: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false, error: 'No autorizado' };

  const supabase = createClient();

  try {
    const updates: any = { email: data.email };
    if (data.password) updates.password = data.password;

    const { error } = await supabase.auth.updateUser(updates);
    if (error) throw error;

    revalidatePath('/settings/profile');
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || 'Error al actualizar seguridad' };
  }
}

/**
 * Elimina la membresía a un tenant.
 */
export async function leaveTenant(membershipId: string) {
  const session = await getSwitchSession();
  if (!session) return { ok: false, error: 'No autorizado' };

  try {
    // Verificar que la membresía pertenezca al usuario
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.userId !== session.userId) {
      return { ok: false, error: 'Membresía no encontrada' };
    }

    await prisma.tenantMembership.delete({
      where: { id: membershipId },
    });

    revalidatePath('/settings/profile');
    revalidatePath('/'); // Revalidar layout para el Header switcher
    return { ok: true };
  } catch (error) {
    return { ok: false, error: 'Error al abandonar empresa' };
  }
}

/**
 * Actualiza preferencias (zona horaria).
 */
export async function updatePreferences(timezone: string) {
  const session = await getSwitchSession();
  if (!session) return { ok: false, error: 'No autorizado' };

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { timezone },
    });
    revalidatePath('/settings/profile');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: 'Error al actualizar preferencias' };
  }
}
