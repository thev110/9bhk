-- 4-Portal KYC Documents Engine, Realtor Verification Sync & Category KYC RPC.
begin;

create table if not exists public.bhk_kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('guest', 'realtor', 'seller', 'buyer')),
  kind text not null check (
    kind in (
      'guest_id',
      'rera_certificate',
      'realtor_pan',
      'agency_proof',
      'ownership_proof',
      'tax_receipt',
      'host_id',
      'buyer_id',
      'proof_of_funds'
    )
  ),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 15728640),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  note text,
  reviewer_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, kind)
);

create index if not exists bhk_kyc_documents_user_category_idx
  on public.bhk_kyc_documents (user_id, category);

create index if not exists bhk_kyc_documents_status_created_idx
  on public.bhk_kyc_documents (status, created_at desc);

alter table public.bhk_kyc_documents enable row level security;

revoke all on public.bhk_kyc_documents from public, anon;
grant select, insert, update, delete on public.bhk_kyc_documents to authenticated;

drop policy if exists bhk_kyc_documents_own_select on public.bhk_kyc_documents;
create policy bhk_kyc_documents_own_select
  on public.bhk_kyc_documents
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists bhk_kyc_documents_own_insert on public.bhk_kyc_documents;
create policy bhk_kyc_documents_own_insert
  on public.bhk_kyc_documents
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists bhk_kyc_documents_own_update on public.bhk_kyc_documents;
create policy bhk_kyc_documents_own_update
  on public.bhk_kyc_documents
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists bhk_kyc_documents_own_delete on public.bhk_kyc_documents;
create policy bhk_kyc_documents_own_delete
  on public.bhk_kyc_documents
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists bhk_kyc_documents_staff_select on public.bhk_kyc_documents;
create policy bhk_kyc_documents_staff_select
  on public.bhk_kyc_documents
  for select
  to authenticated
  using (public.bhk_is_staff());

drop policy if exists bhk_kyc_documents_staff_update on public.bhk_kyc_documents;
create policy bhk_kyc_documents_staff_update
  on public.bhk_kyc_documents
  for update
  to authenticated
  using (public.bhk_is_staff())
  with check (public.bhk_is_staff());

create or replace function public.bhk_guard_kyc_document()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or public.bhk_is_staff() then
    new.note := coalesce(new.note, new.reviewer_note);
    new.reviewer_note := coalesce(new.reviewer_note, new.note);
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending'
       or new.note is not null
       or new.reviewer_note is not null
       or new.reviewed_by is not null
       or new.reviewed_at is not null then
      raise exception 'KYC review fields are staff-only';
    end if;
  elsif tg_op = 'UPDATE' then
    if row(new.user_id, new.category, new.kind) is distinct from row(old.user_id, old.category, old.kind) then
      raise exception 'KYC document ownership or slot cannot change';
    end if;

    if row(new.status, new.note, new.reviewer_note, new.reviewed_by, new.reviewed_at)
       is distinct from row(old.status, old.note, old.reviewer_note, old.reviewed_by, old.reviewed_at) then
      raise exception 'KYC review fields are staff-only';
    end if;

    if row(new.storage_path, new.file_name, new.mime_type, new.size_bytes)
       is distinct from row(old.storage_path, old.file_name, old.mime_type, old.size_bytes) then
      new.status := 'pending';
      new.note := null;
      new.reviewer_note := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
  end if;

  if split_part(new.storage_path, '/', 1) <> coalesce(auth.uid()::text, '') then
    raise exception 'KYC document storage path must belong to the authenticated user folder';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.bhk_guard_kyc_document() from public, anon, authenticated;

drop trigger if exists bhk_kyc_documents_guard on public.bhk_kyc_documents;
create trigger bhk_kyc_documents_guard
  before insert or update on public.bhk_kyc_documents
  for each row
  execute function public.bhk_guard_kyc_document();

create or replace function public.bhk_sync_realtor_kyc_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_user_id uuid;
  target_category text;
  verified_count integer;
begin
  if tg_op = 'DELETE' then
    target_user_id := old.user_id;
    target_category := old.category;
  else
    target_user_id := new.user_id;
    target_category := new.category;
  end if;

  if target_category = 'realtor' and target_user_id is not null then
    select count(distinct kind)
      into verified_count
      from public.bhk_kyc_documents
     where user_id = target_user_id
       and category = 'realtor'
       and kind in ('rera_certificate', 'realtor_pan', 'agency_proof')
       and status = 'verified';

    update public.bhk_profiles
       set verified_broker = (verified_count = 3)
     where id = target_user_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.bhk_sync_realtor_kyc_status() from public, anon, authenticated;

drop trigger if exists bhk_kyc_documents_sync_realtor on public.bhk_kyc_documents;
create trigger bhk_kyc_documents_sync_realtor
  after insert or update or delete on public.bhk_kyc_documents
  for each row
  execute function public.bhk_sync_realtor_kyc_status();

create or replace function public.bhk_category_kyc_verified(
  p_user_id uuid,
  p_category text
)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select case
    when p_user_id is null or p_category is null then false
    when p_category = 'guest' then (
      select count(distinct kind) = 1
        from public.bhk_kyc_documents
       where user_id = p_user_id
         and category = 'guest'
         and kind in ('guest_id')
         and status = 'verified'
    )
    when p_category = 'realtor' then (
      select count(distinct kind) = 3
        from public.bhk_kyc_documents
       where user_id = p_user_id
         and category = 'realtor'
         and kind in ('rera_certificate', 'realtor_pan', 'agency_proof')
         and status = 'verified'
    )
    when p_category = 'seller' then (
      select count(distinct k.kind) = 3
        from (
          select kind
            from public.bhk_kyc_documents
           where user_id = p_user_id
             and category = 'seller'
             and kind in ('ownership_proof', 'tax_receipt', 'host_id')
             and status = 'verified'
          union
          select kind
            from public.bhk_property_documents
           where host_id = p_user_id
             and kind in ('ownership_proof', 'tax_receipt', 'host_id')
             and status = 'verified'
        ) k
    )
    when p_category = 'buyer' then (
      select count(distinct kind) = 2
        from public.bhk_kyc_documents
       where user_id = p_user_id
         and category = 'buyer'
         and kind in ('buyer_id', 'proof_of_funds')
         and status = 'verified'
    )
    else false
  end;
$$;

revoke all on function public.bhk_category_kyc_verified(uuid, text) from public, anon;
grant execute on function public.bhk_category_kyc_verified(uuid, text) to authenticated, service_role;

commit;
