-- 9bhk — property verification documents and a real review queue.
--
-- Two gaps close here:
--   1. "Submitted documents" in the admin console was a hardcoded checklist.
--      There was nowhere for a host to upload an ownership proof, and nowhere
--      for staff to read one back.
--   2. The review queue was demo data. A listing called itself "submitted for
--      review" and then went live immediately, so nothing ever waited for a
--      decision.

-- ── 1. Staff test ────────────────────────────────────────────────────────
--
-- `bhk_profiles.role = 'admin'` is already the staff marker (the viewing
-- requests policy keys off it). Wrapped in a `security definer` function
-- because row-level policies cannot read `bhk_profiles` for the caller without
-- recursing into that table's own policies.
create or replace function public.bhk_is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bhk_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.bhk_is_staff() from public;
grant execute on function public.bhk_is_staff() to authenticated;

-- ── 2. Listings can actually wait for a decision ─────────────────────────
--
-- `status` gains 'rejected' so a refused listing is distinguishable from a
-- draft the host is still working on. Submitting from the wizard will write
-- 'pending', and only a staff decision writes 'published'.
alter table public.bhk_properties
  add column if not exists submitted_at timestamptz,
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.bhk_properties drop constraint if exists bhk_properties_status_check;
alter table public.bhk_properties
  add constraint bhk_properties_status_check
  check (status in ('draft', 'pending', 'published', 'rejected'));

-- Staff see the whole queue, not just what is already published. This stacks
-- on top of `bhk_properties_public_read` (policies are OR'd), so nothing about
-- the public read path changes.
drop policy if exists bhk_properties_staff_read on public.bhk_properties;
create policy bhk_properties_staff_read on public.bhk_properties
  for select using (public.bhk_is_staff());

-- Staff also have to be able to write the decision.
drop policy if exists bhk_properties_staff_review on public.bhk_properties;
create policy bhk_properties_staff_review on public.bhk_properties
  for update using (public.bhk_is_staff()) with check (public.bhk_is_staff());

-- A queue that shows "host" but cannot name the host is not a queue. The
-- profile policy is own-row, so staff need their own read to resolve a
-- submission's `host_id` into a name.
drop policy if exists bhk_profiles_staff_read on public.bhk_profiles;
create policy bhk_profiles_staff_read on public.bhk_profiles
  for select using (public.bhk_is_staff());

-- ── 3. The documents themselves ──────────────────────────────────────────
--
-- The file lives in the private `verification-docs` bucket (created with the
-- onboarding work); this table is the index of what was submitted, so the
-- admin console can list a listing's papers without walking the bucket.
create table if not exists public.bhk_property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties (id) on delete cascade,
  host_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('ownership_proof', 'tax_receipt', 'host_id')),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  -- Why a document was refused. Null until a reviewer writes one.
  note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  -- One document per slot. Re-submitting replaces the row, so a reviewer never
  -- has to guess which of three ownership proofs is the current one.
  unique (property_id, kind)
);

create index if not exists bhk_property_documents_property_idx
  on public.bhk_property_documents (property_id);

alter table public.bhk_property_documents enable row level security;

grant select, insert, update, delete on public.bhk_property_documents to authenticated;

-- The host owns their own paperwork and can replace or withdraw it.
drop policy if exists bhk_property_documents_host_select on public.bhk_property_documents;
create policy bhk_property_documents_host_select on public.bhk_property_documents
  for select using (host_id = auth.uid());

drop policy if exists bhk_property_documents_host_insert on public.bhk_property_documents;
create policy bhk_property_documents_host_insert on public.bhk_property_documents
  for insert with check (host_id = auth.uid());

drop policy if exists bhk_property_documents_host_delete on public.bhk_property_documents;
create policy bhk_property_documents_host_delete on public.bhk_property_documents
  for delete using (host_id = auth.uid());

-- Staff read every host's documents and set their verdict. Split into separate
-- policies so it is explicit that the review columns are the only write staff
-- get here — the upload itself stays the host's row.
drop policy if exists bhk_property_documents_staff_select on public.bhk_property_documents;
create policy bhk_property_documents_staff_select on public.bhk_property_documents
  for select using (public.bhk_is_staff());

drop policy if exists bhk_property_documents_staff_update on public.bhk_property_documents;
create policy bhk_property_documents_staff_update on public.bhk_property_documents
  for update using (public.bhk_is_staff()) with check (public.bhk_is_staff());

-- ── 4. Staff have to be able to read the files ───────────────────────────
--
-- The bucket's existing select policy is scoped to a host's own folder, which
-- is right for hosts and useless for a reviewer: staff could see the row in
-- the console and still be unable to open the PDF. This adds a second policy
-- for staff only. Generated links are short-lived signed URLs, so the bucket
-- itself stays private.
drop policy if exists bhk_verification_docs_staff_read on storage.objects;
create policy bhk_verification_docs_staff_read on storage.objects
  for select to authenticated
  using (bucket_id = 'verification-docs' and public.bhk_is_staff());
