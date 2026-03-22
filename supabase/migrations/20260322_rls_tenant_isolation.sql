-- ============================================================================
-- Switch OS — Row Level Security: Aislamiento por Tenant
-- ============================================================================
-- ESTRATEGIA DE SEGURIDAD (2 capas):
--
-- CAPA 1 — RLS (PostgreSQL, impenetrable):
--   Cada fila se filtra por tenant_id. Un usuario NUNCA puede leer/escribir
--   datos de otro tenant. El Super Admin bypasea esta restricción.
--   NO se hacen JOINs a tenant_modules aquí para evitar degradar performance.
--
-- CAPA 2 — Módulos activos (Aplicación, Next.js middleware + queries):
--   La restricción de "¿tiene este módulo activo?" se valida en la capa
--   de aplicación, NO en RLS. Razón: un JOIN a tenant_modules en cada
--   policy de cada tabla transaccional multiplicaría la latencia de cada
--   query. En su lugar, los módulos activos se cachean en el JWT custom
--   claim `active_modules` (array de strings), y el middleware/API de
--   Next.js valida el acceso antes de ejecutar queries.
--
-- Ver función set_active_modules_claim() al final de este archivo.
-- ============================================================================

-- ─── 0. Habilitar RLS en todas las tablas ───────────────────────────────────

ALTER TABLE "Tenant"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantModule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntry"    ENABLE ROW LEVEL SECURITY;

-- ─── 1. Función helper: extraer tenant_id del JWT ───────────────────────────

CREATE OR REPLACE FUNCTION requesting_tenant_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    (
      SELECT "tenantId"
      FROM "User"
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')
      LIMIT 1
    )
  )
$$;

-- ─── 2. Función helper: ¿es super admin? ───────────────────────────────────

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_super_admin')::boolean,
    false
  )
$$;

-- ─── 3. POLICIES: Tenant ───────────────────────────────────────────────────

-- Super Admin ve todos los tenants
CREATE POLICY "super_admin_all_tenants" ON "Tenant"
  FOR ALL
  USING (is_super_admin());

-- Admin/usuarios solo ven su propio tenant
CREATE POLICY "tenant_isolation" ON "Tenant"
  FOR ALL
  USING (id = requesting_tenant_id());

-- ─── 4. POLICIES: TenantModule ─────────────────────────────────────────────

CREATE POLICY "super_admin_all_modules" ON "TenantModule"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "tenant_modules_isolation" ON "TenantModule"
  FOR ALL
  USING ("tenantId" = requesting_tenant_id());

-- ─── 5. POLICIES: Subscription ─────────────────────────────────────────────

CREATE POLICY "super_admin_all_subscriptions" ON "Subscription"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "tenant_subscription_isolation" ON "Subscription"
  FOR ALL
  USING ("tenantId" = requesting_tenant_id());

-- ─── 6. POLICIES: User ─────────────────────────────────────────────────────

CREATE POLICY "super_admin_all_users" ON "User"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "tenant_users_isolation" ON "User"
  FOR ALL
  USING ("tenantId" = requesting_tenant_id());

-- ─── 7. POLICIES: Project ──────────────────────────────────────────────────

CREATE POLICY "super_admin_all_projects" ON "Project"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "tenant_projects_isolation" ON "Project"
  FOR ALL
  USING ("tenantId" = requesting_tenant_id());

-- ─── 8. POLICIES: Task (via Project.tenantId) ──────────────────────────────

CREATE POLICY "super_admin_all_tasks" ON "Task"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "tenant_tasks_isolation" ON "Task"
  FOR ALL
  USING (
    "projectId" IN (
      SELECT id FROM "Project" WHERE "tenantId" = requesting_tenant_id()
    )
  );

-- ─── 9. POLICIES: TimeEntry (via User.tenantId) ────────────────────────────

CREATE POLICY "super_admin_all_time_entries" ON "TimeEntry"
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "tenant_time_entries_isolation" ON "TimeEntry"
  FOR ALL
  USING (
    "userId" IN (
      SELECT id FROM "User" WHERE "tenantId" = requesting_tenant_id()
    )
  );

-- ============================================================================
-- CAPA 2: Custom JWT Claim para módulos activos
-- ============================================================================
-- Esta función se registra como hook en Supabase (Auth → Hooks → Custom
-- Access Token). Inyecta los módulos activos del tenant directamente en
-- el JWT, evitando JOINs en cada request.
--
-- CONFIGURACIÓN EN SUPABASE DASHBOARD:
--   Authentication → Hooks → Custom Access Token Hook
--   Schema: public
--   Function: custom_access_token_hook
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims        jsonb;
  user_tenant   TEXT;
  user_is_super BOOLEAN;
  user_role     TEXT;
  active_mods   TEXT[];
BEGIN
  claims := event->'claims';

  -- Buscar datos del usuario en la tabla User de Prisma
  SELECT u."tenantId", u."isSuperAdmin", u."role"::text
  INTO user_tenant, user_is_super, user_role
  FROM "User" u
  WHERE u.id = (event->'claims'->>'sub')
  LIMIT 1;

  -- Si no existe el usuario en Prisma, devolver claims sin modificar
  IF user_tenant IS NULL THEN
    RETURN event;
  END IF;

  -- Obtener módulos activos del tenant
  SELECT ARRAY_AGG(tm."moduleKey"::text)
  INTO active_mods
  FROM "TenantModule" tm
  WHERE tm."tenantId" = user_tenant
    AND tm."isActive" = true;

  -- Inyectar claims custom en el JWT
  claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant));
  claims := jsonb_set(claims, '{is_super_admin}', to_jsonb(COALESCE(user_is_super, false)));
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  claims := jsonb_set(claims, '{active_modules}', to_jsonb(COALESCE(active_mods, ARRAY[]::TEXT[])));

  -- Escribir claims de vuelta
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Otorgar permisos para que Supabase Auth pueda invocar el hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Asegurar que supabase_auth_admin pueda leer las tablas necesarias
GRANT SELECT ON "User" TO supabase_auth_admin;
GRANT SELECT ON "TenantModule" TO supabase_auth_admin;

-- Revocar acceso del hook a roles que no lo necesitan
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
