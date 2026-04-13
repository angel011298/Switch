'use server';

/**
 * CIFRA — Admin Cuenta: Server Actions
 * ======================================
 * Actualiza perfil del tenant (legalName, rfc, etc.) y contraseña
 * del super-admin. Ambas acciones requieren isSuperAdmin === true.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { getSwitchSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/auth/rbac';
import prisma from '@/lib/prisma';

// ─── Supabase Admin Client ────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Variables de entorno Supabase Admin no configuradas.');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Update Tenant Profile ────────────────────────────────────────────────────

export interface TenantProfileData {
  /** Nombre de display de la empresa */
  name:       string;
  /** Razón social para CFDI 4.0 */
  legalName:  string;
  /** RFC del tenant */
  rfc:        string;
  /** Código postal del domicilio fiscal */
  zipCode:    string;
  /** ID del régimen fiscal (TaxRegime.id) */
  taxRegimeId: string;
  /** Nombre completo del usuario super-admin */
  userName:   string;
  /** Teléfono del super-admin */
  phone:      string;
}

export async function updateTenantProfile(
  data: TenantProfileData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.isSuperAdmin) {
      return { success: false, error: 'No autorizado.' };
    }
    if (!session.tenantId) {
      return { success: false, error: 'Tenant no encontrado en la sesión.' };
    }

    // Validaciones básicas
    if (!data.name?.trim()) {
      return { success: false, error: 'El nombre de la empresa es requerido.' };
    }

    await Promise.all([
      prisma.tenant.update({
        where: { id: session.tenantId },
        data: {
          name:        data.name.trim(),
          legalName:   data.legalName.trim() || null,
          rfc:         data.rfc.trim().toUpperCase() || null,
          zipCode:     data.zipCode.trim() || null,
          taxRegimeId: data.taxRegimeId || null,
        },
      }),
      prisma.user.update({
        where: { id: session.userId },
        data: {
          name:  data.userName.trim() || null,
          phone: data.phone.trim() || null,
        },
      }),
    ]);

    void logAudit({
      tenantId:    session.tenantId,
      actorId:     session.userId,
      actorName:   session.name,
      actorEmail:  session.email,
      action:      'TENANT_PROFILE_UPDATED',
      resource:    'Tenant',
      resourceId:  session.tenantId,
      severity:    'info',
    });

    revalidatePath('/admin/cuenta');
    return { success: true };
  } catch (err) {
    console.error('[updateTenantProfile]', err);
    return { success: false, error: 'Error interno al guardar el perfil.' };
  }
}

// ─── Update Password ──────────────────────────────────────────────────────────

export async function updateUserPassword(
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSwitchSession();
    if (!session?.isSuperAdmin) {
      return { success: false, error: 'No autorizado.' };
    }

    if (!newPassword || newPassword.length < 12) {
      return { success: false, error: 'La contraseña debe tener al menos 12 caracteres.' };
    }

    // Verificar que tiene al menos una mayúscula y un símbolo
    const hasUpper  = /[A-Z]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUpper || !hasSymbol) {
      return {
        success: false,
        error: 'La contraseña debe incluir al menos una mayúscula y un símbolo.',
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(session.userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    void logAudit({
      tenantId:   session.tenantId!,
      actorId:    session.userId,
      actorName:  session.name,
      actorEmail: session.email,
      action:     'PASSWORD_CHANGED',
      resource:   'User',
      resourceId: session.userId,
      severity:   'info',
    });

    return { success: true };
  } catch (err) {
    console.error('[updateUserPassword]', err);
    return { success: false, error: 'Error interno al cambiar la contraseña.' };
  }
}
