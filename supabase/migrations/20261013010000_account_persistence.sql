begin;
-- Account persistence; subscriptions and profile guards are in the preceding security migration.
create table if not exists public.bhk_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
alter table public.bhk_wishlist enable row level security;
grant select, insert, delete on public.bhk_wishlist to authenticated;
create policy bhk_wishlist_owner on public.bhk_wishlist for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create table if not exists public.bhk_broker_properties (
  id uuid primary key default gen_random_uuid(), realtor_id uuid not null references auth.users(id) on delete cascade,
  source_property_id text, name text not null check (length(trim(name)) between 1 and 200), location text not null, city text not null,
  bedrooms integer not null check (bedrooms between 1 and 100), bathrooms integer not null check (bathrooms between 1 and 100),
  guests integer not null check (guests between 1 and 1000), for_rent boolean not null default true, for_sale boolean not null default false,
  nightly_rate numeric check (nightly_rate > 0), sale_price_cr numeric check (sale_price_cr > 0), pool boolean not null default false,
  notes text, created_at timestamptz not null default now()
);
alter table public.bhk_broker_properties enable row level security;
grant select, insert, update, delete on public.bhk_broker_properties to authenticated;
create policy bhk_broker_properties_read on public.bhk_broker_properties for select to authenticated using (realtor_id = auth.uid());
create policy bhk_broker_properties_delete on public.bhk_broker_properties for delete to authenticated using (realtor_id = auth.uid());
create policy bhk_broker_properties_insert on public.bhk_broker_properties for insert to authenticated
  with check (realtor_id = auth.uid() and exists (select 1 from public.bhk_broker_subscriptions s where s.user_id = auth.uid() and s.status = 'active' and s.expires_at > now()));
create policy bhk_broker_properties_update on public.bhk_broker_properties for update to authenticated
  using (realtor_id = auth.uid()) with check (realtor_id = auth.uid() and exists (select 1 from public.bhk_broker_subscriptions s where s.user_id = auth.uid() and s.status = 'active' and s.expires_at > now()));
drop policy if exists bhk_realtor_clients_insert on public.bhk_realtor_clients;
create policy bhk_realtor_clients_insert on public.bhk_realtor_clients for insert to authenticated
  with check (realtor_id = auth.uid() and exists (select 1 from public.bhk_broker_subscriptions s where s.user_id = auth.uid() and s.status = 'active' and s.expires_at > now()));
alter table public.bhk_notifications add column if not exists read_at timestamptz;
grant update (read_at) on public.bhk_notifications to authenticated;
create policy bhk_notifications_read_update on public.bhk_notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Populate new account details once; login must never overwrite existing profile preferences.
create or replace function public.bhk_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.bhk_profiles (id, full_name, email, phone, avatar_url, city)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''),'@',1)),
    new.email, coalesce(nullif(new.phone,''),new.raw_user_meta_data->>'phone'),
    coalesce(new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'picture'), 'Chennai')
  on conflict (id) do nothing;
  return new;
end;
$$;
grant all on public.bhk_wishlist, public.bhk_broker_properties to service_role;
commit;
