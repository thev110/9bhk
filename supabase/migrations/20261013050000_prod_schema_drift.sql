-- Reconcile repo with production schema drift (read from prod 2026-10-20 via
-- information_schema / pg_get_functiondef). These objects exist in prod with no
-- migration. Everything here is idempotent, so applying it to prod is a no-op.
begin;

alter table public.bhk_properties
  add column if not exists is_featured boolean default false,
  add column if not exists featured_until timestamp with time zone,
  add column if not exists host_tier text default 'free'::text,
  add column if not exists media_verified boolean default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.bhk_properties'::regclass and conname='bhk_properties_host_tier_check') then
    alter table public.bhk_properties add constraint bhk_properties_host_tier_check check ((host_tier = any (array['free'::text, 'pro'::text])));
  end if;
end $$;

-- Supabase "auto-enable RLS" event-trigger function, verbatim from prod.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- Prod also has: event trigger ensure_rls on ddl_command_end
--   when tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') execute function rls_auto_enable().
-- Creating event triggers needs elevated privileges, so skip quietly where
-- that is not allowed (e.g. PGlite tests or restricted roles).
do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname='ensure_rls') then
    execute $et$create event trigger ensure_rls on ddl_command_end
      when tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') execute function public.rls_auto_enable()$et$;
  end if;
exception when insufficient_privilege or feature_not_supported or object_not_in_prerequisite_state then
  raise notice 'ensure_rls event trigger not created: %', sqlerrm;
end $$;

commit;
