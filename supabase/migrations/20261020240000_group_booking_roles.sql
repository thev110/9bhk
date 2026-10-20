begin;
create table public.bhk_group_booking_links(
  plan_id uuid primary key references bhk_group_plans(id) on delete cascade,
  booking_id uuid not null unique references bhk_bookings(id),
  booker_id uuid not null references auth.users(id),created_at timestamptz not null default now()
);
create table public.bhk_group_booking_guests(
  plan_id uuid not null references bhk_group_booking_links(plan_id) on delete cascade,
  user_id uuid not null references auth.users(id),approved_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),primary key(plan_id,user_id)
);
alter table bhk_group_booking_links enable row level security;
alter table bhk_group_booking_guests enable row level security;
grant select on bhk_group_booking_links,bhk_group_booking_guests to authenticated;
grant all on bhk_group_booking_links,bhk_group_booking_guests to service_role;
create policy group_booking_read on bhk_group_booking_links for select to authenticated using(bhk_group_member(plan_id));
create policy group_booking_guests_read on bhk_group_booking_guests for select to authenticated using(bhk_group_member(plan_id));
create function public.bhk_link_group_booking(p_plan uuid,p_booking uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  perform 1 from bhk_group_plans where id=p_plan and owner_id=auth.uid() for update;
  if not found then raise exception 'Only the organiser can link a booking'; end if;
  perform 1 from bhk_bookings where id=p_booking and guest_id=auth.uid() and status<>'cancelled' for share;
  if not found then raise exception 'Choose your own active reservation'; end if;
  insert into bhk_group_booking_links(plan_id,booking_id,booker_id) values(p_plan,p_booking,auth.uid());
  insert into bhk_group_booking_guests(plan_id,user_id,approved_by) values(p_plan,auth.uid(),auth.uid());
end $$;
create function public.bhk_set_group_booked_guest(p_plan uuid,p_user uuid,p_approved boolean) returns void
language plpgsql security definer set search_path=public as $$
declare link bhk_group_booking_links; booking bhk_bookings;
begin
  perform 1 from bhk_group_plans where id=p_plan for update;
  select * into link from bhk_group_booking_links where plan_id=p_plan and booker_id=auth.uid() for update;
  if not found or not bhk_group_member(p_plan) then raise exception 'Only the original booker can approve booked guests'; end if;
  select * into booking from bhk_bookings where id=link.booking_id and status<>'cancelled';
  if not found then raise exception 'Reservation unavailable'; end if;
  if p_approved is null then raise exception 'Choose approve or remove'; end if;
  if not p_approved then delete from bhk_group_booking_guests where plan_id=p_plan and user_id=p_user; return; end if;
  if p_user<>auth.uid() and not exists(select 1 from bhk_group_members where plan_id=p_plan and user_id=p_user) then raise exception 'Choose a current group member'; end if;
  if exists(select 1 from bhk_group_booking_guests where plan_id=p_plan and user_id=p_user) then return; end if;
  if (select count(*) from bhk_group_booking_guests where plan_id=p_plan)>=booking.adults+booking.children then raise exception 'Booked party capacity reached'; end if;
  insert into bhk_group_booking_guests(plan_id,user_id,approved_by) values(p_plan,p_user,auth.uid());
end $$;
create function public.bhk_group_booking_progress(p_plan uuid) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare booking bhk_bookings;
begin
  if not bhk_group_member(p_plan) then raise exception 'Group unavailable'; end if;
  select b.* into booking from bhk_bookings b join bhk_group_booking_links l on l.booking_id=b.id where l.plan_id=p_plan;
  if not found then return null; end if;
  -- Collaboration does not disclose contact details, payment IDs, private location, or grant payment authority.
  return jsonb_build_object('propertyName',booking.property_name,'checkIn',booking.check_in,'checkOut',booking.check_out,
    'status',booking.status,'paymentStatus',booking.payment_status,'totalRupees',booking.total,
    'isApprovedGuest',exists(select 1 from bhk_group_booking_guests where plan_id=p_plan and user_id=auth.uid()));
end $$;
create function public.bhk_remove_group_booking_guest() returns trigger language plpgsql security definer set search_path=public as $$
begin delete from bhk_group_booking_guests where plan_id=old.plan_id and user_id=old.user_id; return old; end $$;
create trigger remove_group_booking_guest after delete on bhk_group_members for each row execute function bhk_remove_group_booking_guest();
create function public.bhk_group_arrival(p_plan uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare booking bhk_bookings; property bhk_properties;
begin
  if not bhk_group_member(p_plan) or not exists(select 1 from bhk_group_booking_guests where plan_id=p_plan and user_id=auth.uid()) then raise exception 'Approved booked guest access required'; end if;
  select b.* into booking from bhk_bookings b join bhk_group_booking_links l on l.booking_id=b.id
    where l.plan_id=p_plan and b.status in ('confirmed','completed') and b.payment_status='paid';
  if not found then raise exception 'Confirmed paid reservation required'; end if;
  select * into property from bhk_properties where id=booking.property_id;
  return jsonb_build_object('address',property.address,'checkInTime',property.check_in_time,
    'checkoutAt',booking.checkout_at,'houseRules',property.house_rules);
end $$;
revoke all on function bhk_group_arrival(uuid) from public,anon;
grant execute on function bhk_group_arrival(uuid) to authenticated;
revoke all on function bhk_link_group_booking(uuid,uuid),bhk_set_group_booked_guest(uuid,uuid,boolean),bhk_group_booking_progress(uuid),bhk_remove_group_booking_guest() from public,anon,authenticated;
grant execute on function bhk_link_group_booking(uuid,uuid),bhk_set_group_booked_guest(uuid,uuid,boolean),bhk_group_booking_progress(uuid) to authenticated;
commit;
