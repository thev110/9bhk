-- Persistent guest communication and private group planning. Settlement stays
-- in the transaction migration; these policies never grant payment writes.
create table public.bhk_booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bhk_bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create table public.bhk_support_tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bhk_bookings(id),
  requester_id uuid not null references auth.users(id),
  subject text not null check (char_length(trim(subject)) between 1 and 200),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
create table public.bhk_stay_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bhk_bookings(id),
  property_id text not null references public.bhk_properties(id),
  author_id uuid not null references auth.users(id),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 10 and 4000),
  verified_stay boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create or replace function public.bhk_can_message_booking(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.bhk_bookings where id=target and
    (guest_id=auth.uid() or host_id=auth.uid())) or public.bhk_is_staff();
$$;
revoke all on function public.bhk_can_message_booking(uuid) from public;
grant execute on function public.bhk_can_message_booking(uuid) to authenticated;

alter table public.bhk_booking_messages enable row level security;
alter table public.bhk_support_tickets enable row level security;
alter table public.bhk_stay_reviews enable row level security;
grant select,insert on public.bhk_booking_messages,public.bhk_support_tickets to authenticated;
grant select on public.bhk_stay_reviews to anon,authenticated;
grant insert on public.bhk_stay_reviews to authenticated;
grant update(status) on public.bhk_support_tickets to authenticated;
grant update(verified_stay,published) on public.bhk_stay_reviews to authenticated;
create policy booking_messages_read on public.bhk_booking_messages for select to authenticated
  using(public.bhk_can_message_booking(booking_id));
create policy booking_messages_send on public.bhk_booking_messages for insert to authenticated
  with check(sender_id=auth.uid() and public.bhk_can_message_booking(booking_id));
create policy support_tickets_read on public.bhk_support_tickets for select to authenticated
  using(requester_id=auth.uid() or public.bhk_is_staff());
create policy support_tickets_create on public.bhk_support_tickets for insert to authenticated
  with check(requester_id=auth.uid() and status='open' and public.bhk_can_message_booking(booking_id));
create policy support_tickets_staff on public.bhk_support_tickets for update to authenticated
  using(public.bhk_is_staff()) with check(public.bhk_is_staff());
create policy stay_reviews_public_read on public.bhk_stay_reviews for select to anon,authenticated
  using(published and verified_stay);
create policy stay_reviews_private_read on public.bhk_stay_reviews for select to authenticated
  using(author_id=auth.uid() or public.bhk_is_staff());
create policy stay_reviews_submit on public.bhk_stay_reviews for insert to authenticated
  with check(author_id=auth.uid() and not verified_stay and not published and exists(
    select 1 from public.bhk_bookings b where b.id=booking_id and b.guest_id=auth.uid()
      and b.property_id=bhk_stay_reviews.property_id and b.status='completed'
      and b.check_out <= current_date));
create policy stay_reviews_staff on public.bhk_stay_reviews for update to authenticated
  using(public.bhk_is_staff()) with check(public.bhk_is_staff());
create index booking_messages_thread on public.bhk_booking_messages(booking_id,created_at);
create index stay_reviews_property on public.bhk_stay_reviews(property_id) where published and verified_stay;

-- Keep the public projection's established shape, sourcing reputation only
-- from the completed-stay review workflow above.
create or replace view public.bhk_public_properties with (security_barrier=true) as
  select p.id,p.name,p.description,p.type,p.location,p.city,p.area,p.guests,p.bedrooms,p.beds,p.bathrooms,
    p.price,p.cleaning,p.deposit,p.min_stay,p.weekend_price,p.tax_rate,p.platform_fee_rate,p.amenities,p.vibes,p.image_urls,
    p.highlights,p.blurb,p.alt,p.guest_favourite,p.group_name,p.status,p.created_at,p.blocked_dates,
    p.setting,p.setting_name,p.setting_detail,p.beach_frontage,p.coastal_zone,p.private_beach_access,p.tide_distance_meters,
    p.garage_type,p.garage_capacity,p.supercar_friendly,p.ev_charging_kw,p.washdown_station,p.is_for_sale,p.sale_price,p.land_area,
    p.hosts_celebrations,p.max_event_guests,p.power_load_kw,p.sound_curfew_hour,p.parking_cars,p.generator_kw,p.caterer_kitchen,
    p.check_in_time,p.check_out_time,p.house_rules,p.pets_allowed,p.seo_title,p.seo_description,p.canonical_url,p.noindex,
    p.verification_status,p.verification_type,p.verification_date,p.verified_by,
    (select coalesce(avg(r.rating),0) from public.bhk_stay_reviews r where r.property_id=p.id and r.published and r.verified_stay) as verified_review_rating,
    (select count(*) from public.bhk_stay_reviews r where r.property_id=p.id and r.published and r.verified_stay) as verified_review_count
  from public.bhk_properties p where p.status='published' and p.bedrooms>=3;

-- Invoker permissions and the property guard remain in force. Locking the
-- listing makes closures atomic against both other edits and checkout holds.
create function public.bhk_set_blocked_dates(target_property text, dates date[], blocked boolean)
returns void language plpgsql set search_path=public as $$
declare current_dates date[];
begin
  if auth.uid() is null or coalesce(cardinality(dates),0) not between 1 and 366 then raise exception 'Choose 1-366 nights'; end if;
  select coalesce(blocked_dates,'{}'::date[]) into current_dates from public.bhk_properties
    where id=target_property and host_id=auth.uid() for update;
  if not found then raise exception 'Listing not found'; end if;
  if blocked then
    select array_agg(distinct d order by d) into current_dates from unnest(current_dates||dates) d where d is not null;
  else
    select coalesce(array_agg(d order by d),'{}'::date[]) into current_dates from unnest(current_dates) d where not(d=any(dates));
  end if;
  update public.bhk_properties set blocked_dates=current_dates where id=target_property and host_id=auth.uid();
end;
$$;
revoke all on function public.bhk_set_blocked_dates(text,date[],boolean) from public;
grant execute on function public.bhk_set_blocked_dates(text,date[],boolean) to authenticated;

create table public.bhk_group_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check(char_length(trim(name)) between 1 and 100),
  check_in date,
  check_out date,
  created_at timestamptz not null default now(),
  check(check_in is null or check_out is null or check_out>check_in)
);
create table public.bhk_group_members (
  plan_id uuid not null references public.bhk_group_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(plan_id,user_id)
);
create table public.bhk_group_invitations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.bhk_group_plans(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default now()+interval '7 days',
  created_at timestamptz not null default now()
);
create table public.bhk_group_shortlist (
  plan_id uuid not null references public.bhk_group_plans(id) on delete cascade,
  property_id text not null references public.bhk_properties(id),
  added_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(plan_id,property_id)
);
create table public.bhk_group_votes (
  plan_id uuid not null,
  property_id text not null,
  user_id uuid not null references auth.users(id),
  vote boolean not null,
  primary key(plan_id,property_id,user_id),
  foreign key(plan_id,property_id) references public.bhk_group_shortlist(plan_id,property_id) on delete cascade
);
create or replace function public.bhk_group_member(target uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.bhk_group_plans where id=target and owner_id=auth.uid())
    or exists(select 1 from public.bhk_group_members where plan_id=target and user_id=auth.uid());
$$;
revoke all on function public.bhk_group_member(uuid) from public;
grant execute on function public.bhk_group_member(uuid) to authenticated;
create or replace function public.bhk_accept_group_invitation(invite_token uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to join a group'; end if;
  select plan_id into target from public.bhk_group_invitations where token=invite_token and expires_at>now();
  if target is null then raise exception 'Invitation expired or invalid'; end if;
  insert into public.bhk_group_members(plan_id,user_id) values(target,auth.uid()) on conflict do nothing;
  return target;
end;
$$;
revoke all on function public.bhk_accept_group_invitation(uuid) from public;
grant execute on function public.bhk_accept_group_invitation(uuid) to authenticated;
alter table public.bhk_group_plans enable row level security;
alter table public.bhk_group_members enable row level security;
alter table public.bhk_group_invitations enable row level security;
alter table public.bhk_group_shortlist enable row level security;
alter table public.bhk_group_votes enable row level security;
grant select,insert,update,delete on public.bhk_group_plans to authenticated;
grant select,delete on public.bhk_group_members to authenticated;
grant select,insert,delete on public.bhk_group_invitations to authenticated;
grant select,insert,delete on public.bhk_group_shortlist to authenticated;
grant select,insert,update,delete on public.bhk_group_votes to authenticated;
create policy group_plans_read on public.bhk_group_plans for select to authenticated using(owner_id=auth.uid() or public.bhk_group_member(id));
create policy group_plans_create on public.bhk_group_plans for insert to authenticated with check(owner_id=auth.uid());
create policy group_plans_update on public.bhk_group_plans for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy group_plans_delete on public.bhk_group_plans for delete to authenticated using(owner_id=auth.uid());
create policy group_members_read on public.bhk_group_members for select to authenticated using(public.bhk_group_member(plan_id));
create policy group_members_leave on public.bhk_group_members for delete to authenticated using(user_id=auth.uid() or exists(select 1 from public.bhk_group_plans where id=plan_id and owner_id=auth.uid()));
create policy group_invites_owner on public.bhk_group_invitations for all to authenticated
  using(exists(select 1 from public.bhk_group_plans where id=plan_id and owner_id=auth.uid()))
  with check(exists(select 1 from public.bhk_group_plans where id=plan_id and owner_id=auth.uid()));
create policy group_shortlist_read on public.bhk_group_shortlist for select to authenticated using(public.bhk_group_member(plan_id));
create policy group_shortlist_add on public.bhk_group_shortlist for insert to authenticated with check(public.bhk_group_member(plan_id) and added_by=auth.uid());
create policy group_shortlist_remove on public.bhk_group_shortlist for delete to authenticated using(public.bhk_group_member(plan_id));
create policy group_votes_read on public.bhk_group_votes for select to authenticated using(public.bhk_group_member(plan_id));
create policy group_votes_create on public.bhk_group_votes for insert to authenticated with check(public.bhk_group_member(plan_id) and user_id=auth.uid());
create policy group_votes_update on public.bhk_group_votes for update to authenticated using(public.bhk_group_member(plan_id) and user_id=auth.uid()) with check(public.bhk_group_member(plan_id) and user_id=auth.uid());
create policy group_votes_delete on public.bhk_group_votes for delete to authenticated using(public.bhk_group_member(plan_id) and user_id=auth.uid());

-- Staff activity is persisted automatically by database writes, not by UI toasts.
create table public.bhk_admin_audit (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id),
  entity_type text not null, entity_id text not null, action text not null,
  created_at timestamptz not null default now()
);
alter table public.bhk_admin_audit enable row level security;
grant select on public.bhk_admin_audit to authenticated;
create policy admin_audit_read on public.bhk_admin_audit for select to authenticated using(public.bhk_is_staff());
create or replace function public.bhk_record_staff_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if public.bhk_is_staff() then
    insert into public.bhk_admin_audit(actor_id,entity_type,entity_id,action)
      values(auth.uid(),tg_table_name,new.id::text,tg_op);
  end if;
  return new;
end;
$$;
revoke all on function public.bhk_record_staff_change() from public;
create trigger properties_staff_audit after update on public.bhk_properties for each row execute function public.bhk_record_staff_change();
create trigger documents_staff_audit after update on public.bhk_property_documents for each row execute function public.bhk_record_staff_change();
create trigger bookings_staff_audit after update on public.bhk_bookings for each row execute function public.bhk_record_staff_change();
create trigger reviews_staff_audit after update on public.bhk_stay_reviews for each row execute function public.bhk_record_staff_change();

grant all on public.bhk_booking_messages,public.bhk_support_tickets,public.bhk_stay_reviews,
  public.bhk_group_plans,public.bhk_group_members,public.bhk_group_invitations,
  public.bhk_group_shortlist,public.bhk_group_votes,public.bhk_admin_audit to service_role;
