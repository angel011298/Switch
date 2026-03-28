'use server';

import { revalidatePath } from 'next/cache';
import { getSwitchSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { logAudit, canManageUsers } from '@/lib/auth/rbac';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// ─── Obtener usuarios del tenant ─────────────────────────────────────────────

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export async function getOrgUsers(): Promise<TenantUser[]> {
  const session = await getSwitchSession();
  if (!session?.tenantId) return [];

  const users = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));
}

// ─── Cambiar rol de un usuario ────────────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  newRole: 'ADMIN' | 'MANAGER' | 'OPERATIVE'
): Promise<{ success: boolean; error?: string }> {
  const session = await getSwitchSession();

  if (!session?.tenantId) {
    return { success: false, error: 'No autorizado' };
  }

  if (!canManageUsers(session.userRole) && !session.isSuperAdmin) {
    await logAudit({
      tenantId: session.tenantId,
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: 'ACCESS_DENIED',
      resource: 'User',
      resourceId: userId,
      severity: 'warning',
      newData: { attempted: 'ROLE_CHANGE', newRole },
    });
    return { success: false, error: 'No tienes permisos para cambiar roles' };
  }

  // Validar que el usuario pertenece al tenant
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, tenantId: true },
  });

  if (!target || target.tenantId !== session.tenantId) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  const oldRole = target.role;

  // Actualizar en base de datos
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // Actualizar app_metadata en Supabase Auth (para que el JWT refleje el nuevo rol)
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    // Buscar el auth user por email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((u) => u.email === target.email);
    if (authUser) {
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        app_metadata: { user_role: newRole },
      });
    }
  } catch (err) {
    console.error('[updateUserRole] Supabase sync failed:', err);
    // No es fatal — el DB ya fue actualizado
  }

  // Registrar auditoría
  await logAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    actorName: session.name,
    actorEmail: session.email,
    action: 'ROLE_CHANGE',
    resource: 'User',
    resourceId: userId,
    severity: newRole === 'ADMIN' ? 'warning' : 'info',
    oldData: { role: oldRole },
    newData: { role: newRole, userEmail: target.email },
  });

  revalidatePath('/admin/organizacion');
  return { success: true };
}
