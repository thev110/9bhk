create table public.bhk_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  city text,
  upi_id text,
  created_at timestamptz not null default now()
);

create table public.bhk_bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  property_id text not null,
  property_name text not null,
  guest_id uuid references auth.users (id) on delete set null,
  host_id uuid references auth.users (id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  adults integer not null default 1,
  children integer not null default 0,
  total integer not null,
  status text not null check (status in ('awaiting', 'confirmed', 'completed', 'cancelled')),
  upi_id text,
  payment_ref text,
  created_at timestamptz not null default now()
);

create table public.bhk_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  created_at timestamptz not null default now()
);

alter table public.bhk_profiles enable row level security;
alter table public.bhk_bookings enable row level security;
alter table public.bhk_notifications enable row level security;

grant select, insert, update, delete on public.bhk_profiles to authenticated;
grant select, insert, update on public.bhk_bookings to authenticated;
grant select, insert on public.bhk_notifications to authenticated;

create policy bhk_profiles_select_own on public.bhk_profiles
  for select using (id = auth.uid());
create policy bhk_profiles_insert_own on public.bhk_profiles
  for insert with check (id = auth.uid());
create policy bhk_profiles_update_own on public.bhk_profiles
  for update using (id = auth.uid());

create policy bhk_bookings_select on public.bhk_bookings
  for select using (guest_id = auth.uid() or host_id = auth.uid());
create policy bhk_bookings_insert on public.bhk_bookings
  for insert with check (guest_id = auth.uid());
create policy bhk_bookings_update on public.bhk_bookings
  for update using (guest_id = auth.uid() or host_id = auth.uid());

create policy bhk_notifications_select on public.bhk_notifications
  for select using (user_id = auth.uid());
create policy bhk_notifications_insert on public.bhk_notifications
  for insert with check (user_id = auth.uid());

create or replace function public.bhk_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bhk_profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.bhk_profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists bhk_on_auth_user_created on auth.users;
create trigger bhk_on_auth_user_created
  after insert on auth.users
  for each row execute function public.bhk_handle_new_user();
