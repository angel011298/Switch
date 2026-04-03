-- REPARACIÓN DE HOOK DE AUTENTICACIÓN (ARQUITECTURA M:N)
-- Ejecuta este script en el SQL Editor de Supabase para restaurar el acceso.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_id uuid;
    primary_tenant_id text;
    membership_role text;
    is_super_admin boolean;
    onboarding_complete boolean;
    active_modules text[];
    sub_status text;
    valid_until timestamp with time zone;
  begin
    -- 1. Extraer ID de usuario (UUID de auth.users)
    user_id := (event->'user'->>'id')::uuid;

    -- 2. Obtener identidad global del usuario (en tabla public."User")
    select 
      u."isSuperAdmin"
    into 
      is_super_admin
    from public."User" u 
    where u.id = user_id::text;

    -- 3. Obtener membresía primaria
    select 
      tm."tenantId", 
      tm.role::text 
    into 
      primary_tenant_id, 
      membership_role
    from public."TenantMembership" tm
    where tm."userId" = user_id::text
    order by tm."id" asc -- O cualquier criterio de prioridad
    limit 1;

    -- 4. Si tiene empresa, obtener sus datos y módulos
    if primary_tenant_id is not null then
      -- Datos del Tenant
      select 
        t."onboardingComplete"
      into 
        onboarding_complete
      from public."Tenant" t
      where t.id = primary_tenant_id;

      -- Módulos Activos
      select 
        array_agg(tm."moduleKey") 
      into 
        active_modules
      from public."TenantModule" tm
      where tm."tenantId" = primary_tenant_id and tm."isActive" = true;

      -- Suscripción
      select 
        s.status::text, 
        s."validUntil" 
      into 
        sub_status, 
        valid_until
      from public."Subscription" s
      where s."tenantId" = primary_tenant_id
      limit 1;
    end if;

    -- 5. Preparar claims del JWT
    claims := event->'claims';
    
    -- Inyectar custom claims
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(primary_tenant_id));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(membership_role, 'OPERATIVE')));
    claims := jsonb_set(claims, '{is_super_admin}', to_jsonb(to_json(coalesce(is_super_admin, false))));
    claims := jsonb_set(claims, '{onboarding_complete}', to_jsonb(to_json(coalesce(onboarding_complete, false))));
    claims := jsonb_set(claims, '{active_modules}', to_jsonb(coalesce(active_modules, '{}'::text[])));
    claims := jsonb_set(claims, '{sub_status}', to_jsonb(coalesce(sub_status, 'TRIAL')));
    claims := jsonb_set(claims, '{valid_until}', to_jsonb(valid_until));

    -- Retornar el evento con los claims actualizados
    return jsonb_set(event, '{claims}', claims);
  end;
$$;
