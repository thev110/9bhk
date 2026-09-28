-- Migration: Realtor Profiles, Client Rosters, and Walkthrough Requests

-- 1. Extend Profiles for Multi-Role Onboarding (Buyer, Realtor, Seller, Admin)
alter table if exists public.bhk_profiles
  add column if not exists role text not null default 'buyer',
  add column if not exists agency_name text,
  add column if not exists rera_number text,
  add column if not exists verified_broker boolean default false,
  add column if not exists commission_rate numeric default 2.0;

-- 2. Realtor Client Roster Table (Private Client Mandates)
create table if not exists public.bhk_realtor_clients (
  id uuid primary key default gen_random_uuid(),
  realtor_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  budget_min_cr numeric not null default 5,
  budget_max_cr numeric not null default 50,
  preferred_stretch text default 'Mahabalipuram Dune Strip',
  garage_need text default 'Collector Vault (3+ cars)',
  confidential boolean default true,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.bhk_realtor_clients enable row level security;
grant select, insert, update, delete on public.bhk_realtor_clients to authenticated;

drop policy if exists bhk_realtor_clients_select on public.bhk_realtor_clients;
create policy bhk_realtor_clients_select on public.bhk_realtor_clients
  for select using (realtor_id = auth.uid());

drop policy if exists bhk_realtor_clients_insert on public.bhk_realtor_clients;
create policy bhk_realtor_clients_insert on public.bhk_realtor_clients
  for insert with check (realtor_id = auth.uid());

drop policy if exists bhk_realtor_clients_update on public.bhk_realtor_clients;
create policy bhk_realtor_clients_update on public.bhk_realtor_clients
  for update using (realtor_id = auth.uid());

drop policy if exists bhk_realtor_clients_delete on public.bhk_realtor_clients;
create policy bhk_realtor_clients_delete on public.bhk_realtor_clients
  for delete using (realtor_id = auth.uid());

-- 3. Private Walkthrough & Acquisition Viewing Requests Table
create table if not exists public.bhk_viewing_requests (
  id uuid primary key default gen_random_uuid(),
  property_id text not null,
  property_name text not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,
  user_id uuid references auth.users (id) on delete set null,
  automotive_mandate text,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.bhk_viewing_requests enable row level security;
grant select, insert on public.bhk_viewing_requests to anon, authenticated;

drop policy if exists bhk_viewing_requests_insert on public.bhk_viewing_requests;
create policy bhk_viewing_requests_insert on public.bhk_viewing_requests
  for insert with check (true);

drop policy if exists bhk_viewing_requests_select on public.bhk_viewing_requests;
create policy bhk_viewing_requests_select on public.bhk_viewing_requests
  for select using (user_id = auth.uid() or auth.uid() in (select id from public.bhk_profiles where role = 'admin'));

-- 4. Storage Bucket for Verification Documents (RERA Licenses, CRZ Title Clearances)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-docs', 'verification-docs', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set file_size_limit = 15728640;

drop policy if exists bhk_verification_docs_insert on storage.objects;
create policy bhk_verification_docs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists bhk_verification_docs_select on storage.objects;
create policy bhk_verification_docs_select on storage.objects
  for select using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
