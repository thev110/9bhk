-- Remove Supabase's default write grants on the public listing table and the
-- public listing views. anon reads listings only through the bhk_public_*
-- views (SELECT); hosts write bhk_properties as `authenticated`, under RLS.
--
-- Already applied to prod on 2026-10-20 (19:22 IST) as a reviewed one-off.
-- This file brings it into version control. It is idempotent: REVOKE of a
-- privilege that is not held is a no-op, and every object is guarded with
-- to_regclass, so re-running it (on prod, on a fresh database, or on a branch)
-- changes nothing that is already hardened.
do $$
declare obj text;
begin
  if to_regclass('public.bhk_properties') is not null then
    execute 'revoke insert, update, delete, truncate on public.bhk_properties from anon';
  end if;
  foreach obj in array array['public.bhk_public_properties','public.bhk_public_listing_facts',
                             'public.bhk_public_listing_media','public.bhk_public_listing_occasions'] loop
    if to_regclass(obj) is not null then
      execute format('revoke insert, update, delete, truncate on %s from anon, authenticated', obj);
    end if;
  end loop;
end $$;
