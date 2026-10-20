begin;
create table public.bhk_occasion_requests(
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties(id),
  guest_id uuid not null references auth.users(id),
  host_id uuid not null references auth.users(id),
  occasion text not null check(occasion in ('family_stay','celebration','wedding','shoot','corporate_retreat','external_services')),
  check_in date not null,
  check_out date not null,
  adults integer not null check(adults>=1),
  children integer not null check(children>=0),
  attendees integer not null check(attendees>0),
  details text not null check(length(trim(details)) between 10 and 2000),
  status text not null default 'requested' check(status in ('requested','approved','rejected','revoked','booked')),
  host_conditions text,
  approved_at timestamptz,
  expires_at timestamptz,
  booking_id uuid unique references public.bhk_bookings(id),
  created_at timestamptz not null default now(),
  check(check_out>check_in and check_out-check_in<=90)
);
alter table public.bhk_occasion_requests enable row level security;
grant select on public.bhk_occasion_requests to authenticated;
grant all on public.bhk_occasion_requests to service_role;
create policy occasion_request_participants on public.bhk_occasion_requests for select to authenticated using(auth.uid() in (guest_id,host_id));
create function public.bhk_assert_occasion(p_property text,p_occasion text,p_attendees integer,p_adults integer,p_children integer)
returns void language plpgsql security definer set search_path=public as $$
declare listing bhk_properties; capacity integer;
begin
  select * into listing from bhk_properties where id=p_property and status='published' and bedrooms>=3;
  if not found or not exists(select 1 from bhk_listing_occasions where property_id=p_property and occasion=p_occasion and permission='approval_required') then raise exception 'This occasion requires an available host permission policy'; end if;
  if p_adults is null or p_children is null or p_adults<1 or p_children<0 or p_adults::bigint+p_children>listing.guests then raise exception 'Overnight capacity exceeded'; end if;
  select (value::text)::integer into capacity from bhk_listing_facts where property_id=p_property
    and fact_key=case when p_occasion in ('celebration','wedding','shoot','corporate_retreat') then 'event_capacity' else 'visitor_capacity' end
    and review_status<>'rejected';
  if capacity is null and p_occasion in ('celebration','wedding','shoot','corporate_retreat') and listing.hosts_celebrations then capacity:=listing.max_event_guests; end if;
  if p_attendees is null or capacity is null or p_attendees<1 or p_attendees>capacity or p_attendees<p_adults::bigint+p_children then raise exception 'Recorded visitor/event capacity must cover all attendees'; end if;
end $$;
revoke all on function public.bhk_assert_occasion(text,text,integer,integer,integer) from public, anon, authenticated;
create function public.bhk_request_occasion(p_property text,p_occasion text,p_in date,p_out date,p_adults integer,p_children integer,p_attendees integer,p_details text)
returns uuid language plpgsql security definer set search_path=public as $$
declare owner uuid; result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform bhk_assert_occasion(p_property,p_occasion,p_attendees,p_adults,p_children);
  if p_in is null or p_out is null or p_in<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Valid future stay dates required'; end if;
  select host_id into owner from bhk_properties where id=p_property;
  if owner=auth.uid() or owner is null then raise exception 'Choose another host property'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,17000));
  if (select count(*) from bhk_occasion_requests where guest_id=auth.uid() and status in ('requested','approved') and check_out>current_date)>=20 then raise exception 'Too many open occasion requests'; end if;
  insert into bhk_occasion_requests(property_id,guest_id,host_id,occasion,check_in,check_out,adults,children,attendees,details)
    values(p_property,auth.uid(),owner,p_occasion,p_in,p_out,p_adults,p_children,p_attendees,p_details) returning id into result;
  return result;
end $$;
create function public.bhk_decide_occasion(p_request uuid,p_approve boolean,p_conditions text)
returns void language plpgsql security definer set search_path=public as $$
declare request bhk_occasion_requests;
begin
  select r.* into request from bhk_occasion_requests r join bhk_properties p on p.id=r.property_id
    where r.id=p_request and r.host_id=auth.uid() and p.host_id=auth.uid() and r.status='requested' for update of r;
  if not found or p_approve is null then raise exception 'Open host request required'; end if;
  if p_approve then
    perform bhk_assert_occasion(request.property_id,request.occasion,request.attendees,request.adults,request.children);
    if p_conditions is null or length(trim(p_conditions)) not between 5 and 2000 or request.check_in<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Current dates and explicit host conditions required'; end if;
  end if;
  update bhk_occasion_requests set status=case when p_approve then 'approved' else 'rejected' end,host_conditions=p_conditions,
    approved_at=case when p_approve then now() else null end,
    expires_at=case when p_approve then least(now()+interval '7 days',(request.check_in+1)::timestamp at time zone 'Asia/Kolkata') else null end where id=p_request;
end $$;
create function public.bhk_revoke_occasion(p_request uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update bhk_occasion_requests set status='revoked' where id=p_request and auth.uid() in (guest_id,host_id) and status in ('requested','approved');
  if not found then raise exception 'Unused request not found; booked stays use booking cancellation'; end if;
end $$;
-- Service-only wrapper binds host approval to immutable dates, party and listing.
-- Ordinary bookings remain unchanged; the API must explicitly route occasion
-- checkout to this wrapper using its authenticated user ID.
create function public.bhk_prepare_occasion_booking(p_user uuid,p_request uuid,p_name text,p_email text,p_phone text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare request bhk_occasion_requests; result jsonb;
begin
  select * into request from bhk_occasion_requests where id=p_request and guest_id=p_user for update;
  if not found or request.status<>'approved' or request.expires_at is null or request.expires_at<=now() then raise exception 'Current host approval required'; end if;
  perform 1 from bhk_properties where id=request.property_id and host_id=request.host_id for update;
  if not found then raise exception 'Host ownership changed; request new approval'; end if;
  perform bhk_assert_occasion(request.property_id,request.occasion,request.attendees,request.adults,request.children);
  result:=bhk_prepare_booking(p_user,request.property_id,request.check_in,request.check_out,request.adults,request.children,p_name,p_email,p_phone);
  update bhk_occasion_requests set status='booked',booking_id=(result->>'bookingId')::uuid where id=request.id;
  return result||jsonb_build_object('occasionRequestId',request.id,'occasion',request.occasion,'hostConditions',request.host_conditions);
end $$;
revoke all on function public.bhk_request_occasion(text,text,date,date,integer,integer,integer,text),
  public.bhk_decide_occasion(uuid,boolean,text),public.bhk_revoke_occasion(uuid),public.bhk_prepare_occasion_booking(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.bhk_request_occasion(text,text,date,date,integer,integer,integer,text),
  public.bhk_decide_occasion(uuid,boolean,text),public.bhk_revoke_occasion(uuid) to authenticated;
grant execute on function public.bhk_prepare_occasion_booking(uuid,uuid,text,text,text) to service_role;
commit;
