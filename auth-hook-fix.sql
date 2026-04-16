-- =============================================================
-- REPARACIÓN COMPLETA DEL HOOK DE AUTENTICACIÓN (ARQUITECTURA M:N)
-- =============================================================
-- PROBLEMA: "Error running hook URI: pg-functions://postgres/public/custom_access_token_hook"
-- CAUSA:    La función existe pero le faltan permisos para supabase_auth_admin.
--
-- INSTRUCCIONES:
--   1. Abre el SQL Editor de tu proyecto en app.supabase.com
--   2. Ejecuta TODO este script como superusuario (postgres)
--   3. Ve a Authentication → Hooks en el Dashboard de Supabase
--   4. Habilita el hook "custom_access_token" apuntando a:
--      pg-functions://postgres/public/custom_access_token_hook
-- =============================================================

-- ── PASO 1: Recrear la función con SECURITY DEFINER ───────────
-- SECURITY DEFINER es necesario para que supabase_auth_admin
-- pueda leer las tablas del esquema public sin grants explícitos.

DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  DECLARE
    claims            jsonb;
    v_user_id         uuid;
    v_tenant_id       text;
    v_role            text;
    v_is_super_admin  boolean;
    v_onboarding      boolean;
    v_modules         text[];
    v_sub_status      text;
    v_valid_until     timestamp with time zone;
  BEGIN
    -- 1. Extraer UUID del usuario desde el evento
    v_user_id := (event->'user'->>'id')::uuid;

    -- 2. Flag global de super-admin (tabla public."User")
    SELECT u."isSuperAdmin"
    INTO v_is_super_admin
    FROM public."User" u
    WHERE u.id = v_user_id::text;

    -- 3. Membresía primaria (primer tenant asociado al usuario)
    SELECT tm."tenantId", tm.role::text
    INTO v_tenant_id, v_role
    FROM public."TenantMembership" tm
    WHERE tm."userId" = v_user_id::text
    ORDER BY tm.id ASC
    LIMIT 1;

    -- 4. Datos del tenant (sólo si tiene membresía)
    IF v_tenant_id IS NOT NULL THEN

      SELECT t."onboardingComplete"
      INTO v_onboarding
      FROM public."Tenant" t
      WHERE t.id = v_tenant_id;

      SELECT array_agg(m."moduleKey"::text)
      INTO v_modules
      FROM public."TenantModule" m
      WHERE m."tenantId" = v_tenant_id
        AND m."isActive" = true;

      SELECT s.status::text, s."validUntil"
      INTO v_sub_status, v_valid_until
      FROM public."Subscription" s
      WHERE s."tenantId" = v_tenant_id
      LIMIT 1;

    END IF;

    -- 5. Inyectar custom claims en el JWT
    claims := event->'claims';
    claims := jsonb_set(claims, '{tenant_id}',          to_jsonb(v_tenant_id));
    claims := jsonb_set(claims, '{user_role}',          to_jsonb(COALESCE(v_role, 'OPERATIVE')));
    claims := jsonb_set(claims, '{is_super_admin}',     to_jsonb(COALESCE(v_is_super_admin, false)));
    claims := jsonb_set(claims, '{onboarding_complete}',to_jsonb(COALESCE(v_onboarding, false)));
    claims := jsonb_set(claims, '{active_modules}',     to_jsonb(COALESCE(v_modules, '{}'::text[])));
    claims := jsonb_set(claims, '{sub_status}',         to_jsonb(COALESCE(v_sub_status, 'TRIAL')));
    claims := jsonb_set(claims, '{valid_until}',        to_jsonb(v_valid_until));

    RETURN jsonb_set(event, '{claims}', claims);
  END;
$$;

-- ── PASO 2: Permisos sobre la función ─────────────────────────
-- supabase_auth_admin es el rol que ejecuta los hooks de Auth.

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Evitar que roles no privilegiados invoquen el hook directamente.
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;

-- ── PASO 3: Grants de lectura sobre tablas del negocio ─────────
-- Aunque la función usa SECURITY DEFINER, el owner de la función
-- debe tener acceso a las tablas. Si el owner es "postgres" (el
-- superusuario por defecto), los siguientes GRANTs son redundantes
-- pero se incluyen para entornos con owner distinto (ej. "authenticator").

GRANT SELECT ON TABLE public."User"             TO supabase_auth_admin;
GRANT SELECT ON TABLE public."TenantMembership" TO supabase_auth_admin;
GRANT SELECT ON TABLE public."Tenant"           TO supabase_auth_admin;
GRANT SELECT ON TABLE public."TenantModule"     TO supabase_auth_admin;
GRANT SELECT ON TABLE public."Subscription"     TO supabase_auth_admin;

-- ── PASO 4: Verificación rápida ────────────────────────────────
-- Descomenta para verificar que la función existe y tiene el owner correcto:
-- SELECT routine_name, security_type FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name = 'custom_access_token_hook';
