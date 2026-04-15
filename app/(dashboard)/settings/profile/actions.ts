'use server';

import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ModuleKey } from '@prisma/client';

// ─── IDENTIDAD ───────────────────────────────────────────────────────────────

export async function updateProfile(data: { name: string; avatarUrl?: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { name: data.name, avatarUrl: data.avatarUrl || null },
    });
    revalidatePath('/settings/profile');
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Error al actualizar base de datos' };
  }
}

// ─── SEGURIDAD — Contraseña ────────────────────────────────────────────────

export async function updatePassword(data: { password: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };
  if (data.password.length < 8) return { ok: false as const, error: 'La contraseña debe tener al menos 8 caracteres' };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ─── SEGURIDAD — Datos de contacto ──────────────────────────────────────────

export async function updateContactInfo(data: { email: string; phone: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  try {
    // Update email in Supabase Auth (sends confirmation email)
    if (data.email !== session.email) {
      const { error } = await supabase.auth.updateUser({ email: data.email });
      if (error) return { ok: false as const, error: error.message };
    }

    // Update phone in Prisma
    await prisma.user.update({
      where: { id: session.userId },
      data: { phone: data.phone || null },
    });

    revalidatePath('/settings/profile');
    return {
      ok: true as const,
      message: data.email !== session.email
        ? 'Revisa tu nuevo correo para confirmar el cambio.'
        : 'Datos de contacto actualizados.',
    };
  } catch {
    return { ok: false as const, error: 'Error al actualizar contacto' };
  }
}

// ─── MIS EMPRESAS — Crear ─────────────────────────────────────────────────

export async function createCompany(data: { name: string; rfc?: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  const name = data.name.trim();
  if (!name) return { ok: false as const, error: 'El nombre es requerido' };

  try {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);

    await prisma.tenant.create({
      data: {
        name,
        rfc: data.rfc?.trim().toUpperCase() || null,
        onboardingComplete: false,
        memberships: {
          create: {
            userId: session.userId,
            role: 'ADMIN',
          },
        },
        subscription: { create: { status: 'TRIAL', validUntil } },
        modules: {
          createMany: {
            data: ['DASHBOARD', 'BILLING_CFDI', 'POS', 'CRM'].map((moduleKey) => ({
              moduleKey: moduleKey as ModuleKey,
              isActive: true,
            })),
          },
        },
      },
    });

    revalidatePath('/settings/profile');
    return { ok: true as const };
  } catch (e: any) {
    if (e?.code === 'P2002') return { ok: false as const, error: 'Ya existe una empresa con ese RFC o nombre' };
    return { ok: false as const, error: 'Error al crear empresa' };
  }
}

// ─── MIS EMPRESAS — Editar ────────────────────────────────────────────────

export async function updateCompany(tenantId: string, data: { name: string; rfc?: string }) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  const name = data.name.trim();
  if (!name) return { ok: false as const, error: 'El nombre es requerido' };

  // Only ADMIN members can edit
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: session.userId, role: 'ADMIN' },
  });
  if (!membership) return { ok: false as const, error: 'Sin permisos para editar esta empresa' };

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, rfc: data.rfc?.trim().toUpperCase() || null },
    });
    revalidatePath('/settings/profile');
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Error al actualizar empresa' };
  }
}

// ─── MIS EMPRESAS — Abandonar ────────────────────────────────────────────

export async function leaveTenant(membershipId: string) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  try {
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.userId !== session.userId) {
      return { ok: false as const, error: 'Membresía no encontrada' };
    }

    await prisma.tenantMembership.delete({ where: { id: membershipId } });
    revalidatePath('/settings/profile');
    revalidatePath('/');
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Error al abandonar empresa' };
  }
}

// ─── MÓDULOS — Activar / Desactivar ──────────────────────────────────────

export async function toggleModule(tenantId: string, moduleKey: ModuleKey, activate: boolean) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  // Only ADMIN members can toggle modules
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: session.userId, role: 'ADMIN' },
  });
  if (!membership) return { ok: false as const, error: 'Sin permisos para gestionar módulos' };

  try {
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      update: { isActive: activate },
      create: { tenantId, moduleKey, isActive: activate },
    });
    revalidatePath('/settings/profile');
    revalidatePath('/dashboard');
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Error al actualizar módulo' };
  }
}

// ─── PREFERENCIAS ────────────────────────────────────────────────────────────

export async function updatePreferences(timezone: string) {
  const session = await getSwitchSession();
  if (!session) return { ok: false as const, error: 'No autorizado' };

  try {
    await prisma.user.update({ where: { id: session.userId }, data: { timezone } });
    revalidatePath('/settings/profile');
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Error al actualizar preferencias' };
  }
}
