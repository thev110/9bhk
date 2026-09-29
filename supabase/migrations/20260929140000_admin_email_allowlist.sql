-- 9bhk — the admin console belongs to one allow-listed address.
--
-- This closes a privilege-escalation hole that the document work would
-- otherwise have widened.
--
-- `bhk_is_staff()` trusted `bhk_profiles.role = 'admin'`, and that column is
-- written by the browser: `persistProfile` sends whatever role the client
-- happens to hold, and `bhk_profiles_update_own` accepts it because the row is
-- the caller's own. So any signed-in user could set `role = 'admin'` in local
-- state, persist it, and be treated as staff — which, with the document
-- policies added alongside this, means reading every host's ownership proof,
-- tax receipt and ID.
--
-- The lesson is not "add a check", it is that **a role column its subject can
-- write is not an authorization control**. Staff-ness now comes from the email
-- the auth provider verified, which no client can forge.

-- ── 1. The allow-list ────────────────────────────────────────────────────
--
-- A literal, not configuration: a missing or mistyped environment variable must
-- never be able to grant the console to the next person who signs up. Keep in
-- step with ADMIN_EMAILS in lib/admin.ts.
create or replace function public.bhk_admin_emails()
returns text[]
language sql
immutable
as $$ select array['rathnavelkarthi1@gmail.com']::text[] $$;

revoke all on function public.bhk_admin_emails() from public;
grant execute on function public.bhk_admin_emails() to authenticated;

-- ── 2. The caller's real email ───────────────────────────────────────────
--
-- Read from `auth.users`, never from `bhk_profiles`. A user can write their own
-- profile row — including its `email` column — so that column is a claim. This
-- one is the provider-verified fact, and it is what an access decision has to
-- rest on. `security definer` because `auth.users` is not exposed to clients.
create or replace function public.bhk_current_email()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select lower(coalesce(u.email, ''))
  from auth.users u
  where u.id = auth.uid();
$$;

revoke all on function public.bhk_current_email() from public;
grant execute on function public.bhk_current_email() to authenticated;

-- ── 3. Staff-ness, redefined ─────────────────────────────────────────────
--
-- Replaces the `role = 'admin'` version from the documents migration. Every
-- policy already written against this function — documents, the storage bucket,
-- listings, profiles, split shares — inherits the stronger test with no change.
create or replace function public.bhk_is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    where public.bhk_current_email() in (
      select lower(trim(unnest(public.bhk_admin_emails())))
    )
  );
$$;

revoke all on function public.bhk_is_staff() from public;
grant execute on function public.bhk_is_staff() to authenticated;

-- Backfill: anyone who promoted themselves under the old rule loses it now.
-- Without this the role column would keep disagreeing with the allow-list, and
-- any policy or screen still reading `role` would keep trusting it.
update public.bhk_profiles
set role = 'buyer'
where role = 'admin'
  and lower(coalesce(email, '')) not in (
    select lower(trim(unnest(public.bhk_admin_emails())))
  );

-- ── 4. Keep the role column honest ───────────────────────────────────────
--
-- `role` is still read for display and by older code paths, so it is normalised
-- on every write to match the allow-list. The decision is made against
-- `auth.users` for the row's own id, so a client cannot grant itself the badge
-- by writing an admin address into its profile email.
--
-- A non-operator asking for 'admin' is silently downgraded rather than rejected:
-- the rest of a profile save is the user's own data and should still go through.
create or replace function public.bhk_normalize_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  verified_email text;
  allowlisted boolean;
begin
  select lower(coalesce(u.email, '')) into verified_email
  from auth.users u
  where u.id = new.id;

  allowlisted := coalesce(verified_email, '') in (
    select lower(trim(unnest(public.bhk_admin_emails())))
  );

  if allowlisted then
    new.role := 'admin';
  elsif new.role = 'admin' then
    new.role := 'buyer';
  end if;

  return new;
end $$;

drop trigger if exists bhk_profiles_normalize_role on public.bhk_profiles;
create trigger bhk_profiles_normalize_role
  before insert or update on public.bhk_profiles
  for each row
  execute function public.bhk_normalize_profile_role();
