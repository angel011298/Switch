-- Migration: Fix custom_access_token_hook
-- Adds SECURITY DEFINER + proper grants so supabase_auth_admin
-- can execute the hook without "Error running hook URI" failures.

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
    v_user_id := (event->'user'->>'id')::uuid;

    SELECT u."isSuperAdmin"
    INTO v_is_super_admin
    FROM public."User" u
    WHERE u.id = v_user_id::text;

    SELECT tm."tenantId", tm.role::text
    INTO v_tenant_id, v_role
    FROM public."TenantMembership" tm
    WHERE tm."userId" = v_user_id::text
    ORDER BY tm.id ASC
    LIMIT 1;

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

    claims := event->'claims';
    claims := jsonb_set(claims, '{tenant_id}',           to_jsonb(v_tenant_id));
    claims := jsonb_set(claims, '{user_role}',           to_jsonb(COALESCE(v_role, 'OPERATIVE')));
    claims := jsonb_set(claims, '{is_super_admin}',      to_jsonb(COALESCE(v_is_super_admin, false)));
    claims := jsonb_set(claims, '{onboarding_complete}', to_jsonb(COALESCE(v_onboarding, false)));
    claims := jsonb_set(claims, '{active_modules}',      to_jsonb(COALESCE(v_modules, '{}'::text[])));
    claims := jsonb_set(claims, '{sub_status}',          to_jsonb(COALESCE(v_sub_status, 'TRIAL')));
    claims := jsonb_set(claims, '{valid_until}',         to_jsonb(v_valid_until));

    RETURN jsonb_set(event, '{claims}', claims);
  END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;

GRANT SELECT ON TABLE public."User"             TO supabase_auth_admin;
GRANT SELECT ON TABLE public."TenantMembership" TO supabase_auth_admin;
GRANT SELECT ON TABLE public."Tenant"           TO supabase_auth_admin;
GRANT SELECT ON TABLE public."TenantModule"     TO supabase_auth_admin;
GRANT SELECT ON TABLE public."Subscription"     TO supabase_auth_admin;
