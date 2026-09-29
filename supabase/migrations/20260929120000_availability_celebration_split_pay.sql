-- 9bhk — availability, celebration capacity and Split Pay.
--
-- Three related gaps close here:
--   1. Availability had no representation at all. Nothing stopped two guests
--      being sold the same weekend, and the search "When" picker filtered
--      nothing.
--   2. Celebration capacity is spec'd on the listing — power load, sound
--      curfew, parking, generator — and is optional, exactly like the garage.
--   3. Split Pay needs a per-person ledger, because a group funds the stay
--      together instead of one organiser fronting the whole amount.

-- ── 1. Availability ──────────────────────────────────────────────────────

-- The host's own closures, independent of any booking. An empty/NULL array
-- means the host has closed nothing.
alter table public.bhk_properties
  add column if not exists blocked_dates date[];

-- The real fix for double-booking is to make it impossible in the database
-- rather than in application code a future caller can forget to invoke.
--
-- A stay occupies the half-open range [check_in, check_out), so a same-day
-- turnover (11th→13th, then 13th→15th) remains legal — which is exactly what
-- hosts do between weekend groups.
create extension if not exists btree_gist;

alter table public.bhk_bookings
  add column if not exists stay daterange
  generated always as (daterange(check_in, check_out, '[)')) stored;

do $$
begin
  alter table public.bhk_bookings
    add constraint bhk_bookings_no_overlap
    exclude using gist (property_id with =, stay with &&)
    where (status <> 'cancelled');
exception
  when duplicate_object then null;
  when duplicate_table then null;
  when exclusion_violation then
    raise warning
      'bhk_bookings already has overlapping stays; resolve them and re-run this migration to add bhk_bookings_no_overlap';
end $$;

-- ── 2. Celebration capacity (optional, like the garage) ──────────────────

alter table public.bhk_properties
  add column if not exists hosts_celebrations boolean not null default false,
  add column if not exists max_event_guests integer,
  add column if not exists power_load_kw integer,
  add column if not exists sound_curfew_hour integer,
  add column if not exists parking_cars integer,
  add column if not exists generator_kw integer,
  add column if not exists caterer_kitchen boolean;

-- A curfew outside a real clock is meaningless, and a negative capacity is a
-- data bug. Enforced here so no surface has to defend against it.
do $$
begin
  alter table public.bhk_properties
    add constraint bhk_properties_curfew_range
      check (sound_curfew_hour is null or sound_curfew_hour between 0 and 23),
    add constraint bhk_properties_event_capacity
      check (max_event_guests is null or max_event_guests > 0),
    add constraint bhk_properties_power_positive
      check (power_load_kw is null or power_load_kw > 0);
exception
  when duplicate_object then null;
end $$;

-- ── 3. Split Pay ledger ──────────────────────────────────────────────────

create table if not exists public.bhk_split_shares (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bhk_bookings (id) on delete cascade,
  slot integer not null,
  member_name text not null,
  -- Whole rupees. Shares are computed to sum exactly to the booking total,
  -- so the group never under- or over-funds the stay by a rounding error.
  amount integer not null check (amount >= 0),
  paid boolean not null default false,
  paid_at timestamptz,
  -- Gateway reference for the individual share payment.
  payment_ref text,
  created_at timestamptz not null default now(),
  unique (booking_id, slot)
);

create index if not exists bhk_split_shares_booking_idx
  on public.bhk_split_shares (booking_id);

alter table public.bhk_split_shares enable row level security;

grant select, insert, update, delete on public.bhk_split_shares to authenticated;

-- The organiser and the host can see and settle the whole ledger.
drop policy if exists bhk_split_shares_select on public.bhk_split_shares;
create policy bhk_split_shares_select on public.bhk_split_shares
  for select using (
    exists (
      select 1 from public.bhk_bookings b
      where b.id = booking_id and (b.guest_id = auth.uid() or b.host_id = auth.uid())
    )
  );

drop policy if exists bhk_split_shares_insert on public.bhk_split_shares;
create policy bhk_split_shares_insert on public.bhk_split_shares
  for insert with check (
    exists (
      select 1 from public.bhk_bookings b
      where b.id = booking_id and (b.guest_id = auth.uid() or b.host_id = auth.uid())
    )
  );

drop policy if exists bhk_split_shares_update on public.bhk_split_shares;
create policy bhk_split_shares_update on public.bhk_split_shares
  for update using (
    exists (
      select 1 from public.bhk_bookings b
      where b.id = booking_id and (b.guest_id = auth.uid() or b.host_id = auth.uid())
    )
  );

-- NOTE for the payments work: an invited guest is not yet `guest_id` on the
-- booking, so they cannot read their own share under the policies above. Their
-- access has to be mediated by a server route holding a signed invite token
-- that uses the service role — do not widen these policies to anonymous reads
-- to work around it, or every split becomes publicly enumerable.

-- ── 4. Public availability projection ────────────────────────────────────

-- A calendar has to show a weekend as taken even when the booking was made by
-- a stranger, but `bhk_bookings_select` above is scoped to
-- `guest_id = auth.uid() or host_id = auth.uid()`. Read that table directly
-- from a picker and every booking made by someone else is invisible — the
-- calendar cheerfully advertises a house that is already sold, and offers the
-- nights that are gone.
--
-- Widening the table's SELECT policy is not an option: a row carries the
-- guest's name, email address, phone number and total. So expose the minimum a
-- calendar needs and nothing else. Which nights are taken is already public
-- information — it is literally what the calendar draws — while identity and
-- money are not, and never leave this function.
--
-- `security definer` is deliberate: the function runs as its owner so it sees
-- across guests. It is the *only* booking read a client-side calendar should
-- use, and it returns four columns.
create or replace function public.bhk_availability()
returns table (property_id text, check_in date, check_out date, status text)
language sql
security definer
set search_path = public
stable
as $$
  select b.property_id, b.check_in, b.check_out, b.status
  from public.bhk_bookings b
  where b.status <> 'cancelled';
$$;

revoke all on function public.bhk_availability() from public;
grant execute on function public.bhk_availability() to anon, authenticated;
