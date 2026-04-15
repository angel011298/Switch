/**
 * CIFRA — Session helpers (Server-side only)
 * ================================================
 * Extrae datos de sesión del JWT de Supabase para Server Components.
 * Los custom claims (tenant_id, active_modules, etc.) vienen del
 * custom_access_token_hook configurado en FASE 3.
 * FASE 12: Agrega subscriptionStatus y validUntil del JWT.
 */

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface SwitchSession {
  userId: string;
  email: string;
  name: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  userRole: string;
  activeModules: string[];
  // FASE 12: Paywall claims inyectados por custom_access_token_hook
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' | null;
  validUntil: string | null; // ISO date string, ej: "2026-04-08T06:00:00.000Z"
}

/**
 * Obtiene la sesión completa con custom claims del JWT.
 * Diseñado para ser llamado desde Server Components y Route Handlers.
 */
export async function getSwitchSession(): Promise<SwitchSession | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Los custom claims vienen del app_metadata inyectados por el hook,
  // pero Supabase también los expone en el JWT decodificado.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // FASE Multi-Tenant: Soporte para cambio de tenant vía cookie
  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get('cifra_active_tenant_id')?.value;

  // Extraer claims custom del JWT (inyectados por custom_access_token_hook)
  const jwtPayload = session?.access_token
    ? JSON.parse(
        Buffer.from(session.access_token.split('.')[1], 'base64').toString()
      )
    : null;

  // Prioridad: Cookie > JWT > Metadata
  const tenantId = cookieTenantId ?? jwtPayload?.tenant_id ?? user.user_metadata?.tenant_id ?? null;
  // Fallback: verificar email directamente cuando el hook de Supabase no inyecta el claim.
  // Comparación case-insensitive con trim para tolerar variaciones de formato.
  const SUPER_ADMIN_EMAIL = '553angelortiz@gmail.com';
  const isSuperAdmin: boolean =
    jwtPayload?.is_super_admin === true ||
    user.user_metadata?.is_super_admin === true ||
    (user.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL);
  const userRole = jwtPayload?.user_role ?? 'OPERATIVE';
  const activeModules: string[] = jwtPayload?.active_modules ?? [];

  // FASE 12: Paywall — sub_status y valid_until inyectados por el hook
  const subscriptionStatus = jwtPayload?.sub_status ?? null;
  const validUntil = jwtPayload?.valid_until ?? null;

  return {
    userId: user.id,
    email: user.email ?? '',
    name:
      user.user_metadata?.name ??
      user.user_metadata?.full_name ??
      user.email?.split('@')[0] ??
      'Usuario',
    tenantId,
    isSuperAdmin,
    userRole,
    activeModules,
    subscriptionStatus,
    validUntil,
  };
}
