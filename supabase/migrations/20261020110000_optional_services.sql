begin;
create table public.bhk_service_providers(
  user_id uuid primary key references auth.users(id),
  display_name text not null check(length(trim(display_name)) between 2 and 150),
  review_status text not null default 'pending' check(review_status in ('pending','approved','suspended')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);
create table public.bhk_service_offerings(
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.bhk_service_providers(user_id),
  kind text not null check(kind in ('cook','catering','transport','decoration')),
  title text not null check(length(trim(title)) between 2 and 150),
  description text not null check(length(trim(description)) between 10 and 2000),
  city text not null check(length(trim(city)) between 1 and 100),
  available_from date not null,
  available_until date not null,
  active boolean not null default true,
  check(available_until>available_from)
);
create table public.bhk_service_requests(
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.bhk_service_offerings(id),
  provider_id uuid not null references public.bhk_service_providers(user_id),
  guest_id uuid not null references auth.users(id),
  host_id uuid not null references auth.users(id),
  booking_id uuid not null references public.bhk_bookings(id),
  starts_on date not null,
  ends_on date not null,
  service_period daterange generated always as(daterange(starts_on,ends_on,'[)')) stored,
  details text not null check(length(trim(details)) between 5 and 2000),
  status text not null default 'requested' check(status in ('requested','quoted','accepted','confirmed','completed','cancelled')),
  host_approved boolean not null default false,
  host_approved_at timestamptz,
  quote_paise bigint check(quote_paise between 1 and 200000000000),
  currency text not null default 'INR' check(currency='INR'),
  quote_terms text check(length(trim(quote_terms)) between 5 and 2000),
  quote_expires_at timestamptz,
  accepted_at timestamptz,
  confirmed_at timestamptz,
  completion_evidence text check(length(trim(completion_evidence)) between 10 and 2000),
  completed_at timestamptz,
  cancellation_reason text,
  payment_status text not null default 'pending' check(payment_status='pending'),
  created_at timestamptz not null default now(),
  check(ends_on>starts_on),
  exclude using gist(provider_id with =,service_period with &&) where(status in ('accepted','confirmed'))
);
alter table public.bhk_service_providers enable row level security;
alter table public.bhk_service_offerings enable row level security;
alter table public.bhk_service_requests enable row level security;
grant select on public.bhk_service_providers,public.bhk_service_offerings,public.bhk_service_requests to authenticated;
grant all on public.bhk_service_providers,public.bhk_service_offerings,public.bhk_service_requests to service_role;
create policy service_providers_read on public.bhk_service_providers for select to authenticated using(review_status='approved' or user_id=auth.uid() or bhk_is_staff());
create policy service_offerings_read on public.bhk_service_offerings for select to authenticated using(provider_id=auth.uid() or bhk_is_staff() or (active and exists(select 1 from bhk_service_providers p where p.user_id=provider_id and p.review_status='approved')));
create policy service_requests_read on public.bhk_service_requests for select to authenticated using(auth.uid() in (guest_id,host_id,provider_id) or bhk_is_staff());

create function public.bhk_register_service_provider(p_name text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sign in to register'; end if;
  insert into bhk_service_providers(user_id,display_name) values(auth.uid(),p_name);
end $$;
create function public.bhk_review_service_provider(p_provider uuid,p_approved boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not coalesce(bhk_is_staff(),false) or auth.uid()=p_provider then raise exception 'Independent staff review required'; end if;
  if p_approved is null then raise exception 'Choose a review decision'; end if;
  update bhk_service_providers set review_status=case when p_approved then 'approved' else 'suspended' end,reviewed_by=auth.uid(),reviewed_at=now() where user_id=p_provider;
  if not found then raise exception 'Provider not found'; end if;
end $$;
create function public.bhk_add_service_offering(p_kind text,p_title text,p_description text,p_city text,p_from date,p_until date)
returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
  if not exists(select 1 from bhk_service_providers where user_id=auth.uid() and review_status='approved') then raise exception 'Approved provider required'; end if;
  insert into bhk_service_offerings(provider_id,kind,title,description,city,available_from,available_until)
    values(auth.uid(),p_kind,p_title,p_description,p_city,p_from,p_until) returning id into result;
  return result;
end $$;
create function public.bhk_set_service_offering_active(p_offering uuid,p_active boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  update bhk_service_offerings set active=p_active where id=p_offering and provider_id=auth.uid();
  if not found then raise exception 'Offering not found'; end if;
end $$;
create function public.bhk_request_service(p_offering uuid,p_booking uuid,p_start date,p_end date,p_details text)
returns uuid language plpgsql security definer set search_path=public as $$
declare offer bhk_service_offerings; booking bhk_bookings; result uuid; property_city text;
begin
  select * into booking from bhk_bookings where id=p_booking and guest_id=auth.uid() and status='confirmed' for update;
  if not found then raise exception 'A confirmed booking owned by you is required'; end if;
  select * into offer from bhk_service_offerings where id=p_offering and active;
  if not found or offer.provider_id=auth.uid() or not exists(select 1 from bhk_service_providers where user_id=offer.provider_id and review_status='approved') then raise exception 'Service provider unavailable'; end if;
  select city into property_city from bhk_properties where id=booking.property_id;
  if lower(trim(property_city)) is distinct from lower(trim(offer.city)) then raise exception 'Outside provider service area'; end if;
  if p_start is null or p_end is null or p_start<(now() at time zone 'Asia/Kolkata')::date or p_start<booking.check_in or p_end>booking.check_out
    or p_end<=p_start or p_start<offer.available_from or p_end>offer.available_until then raise exception 'Choose service dates within your stay and provider availability'; end if;
  if (select count(*) from bhk_service_requests where booking_id=p_booking and status not in ('cancelled','completed'))>=10 then raise exception 'Too many open service requests'; end if;
  insert into bhk_service_requests(offering_id,provider_id,guest_id,host_id,booking_id,starts_on,ends_on,details)
    values(offer.id,offer.provider_id,auth.uid(),booking.host_id,booking.id,p_start,p_end,p_details) returning id into result;
  return result;
end $$;
create function public.bhk_approve_service_at_property(p_request uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update bhk_service_requests set host_approved=true,host_approved_at=now() where id=p_request and host_id=auth.uid() and status in ('requested','quoted')
    and exists(select 1 from bhk_bookings b where b.id=booking_id and b.status='confirmed' and b.host_id=auth.uid());
  if not found then raise exception 'Only the booking host can approve an open request'; end if;
end $$;
create function public.bhk_quote_service(p_request uuid,p_amount bigint,p_terms text,p_expires timestamptz)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_expires is null or p_expires<=now() or p_expires>now()+interval '7 days' then raise exception 'Quote expiry must be within seven days'; end if;
  if p_amount is null or p_amount<1 or p_amount>200000000000 or p_terms is null or length(trim(p_terms)) not between 5 and 2000 then raise exception 'A positive quote and service terms are required'; end if;
  if not exists(select 1 from bhk_service_providers where user_id=auth.uid() and review_status='approved') then raise exception 'Approved provider required'; end if;
  update bhk_service_requests set quote_paise=p_amount,quote_terms=p_terms,quote_expires_at=p_expires,status='quoted',host_approved=false,host_approved_at=null
    where id=p_request and provider_id=auth.uid() and status in ('requested','quoted') and starts_on>=(now() at time zone 'Asia/Kolkata')::date;
  if not found then raise exception 'Open service request not found'; end if;
end $$;
create function public.bhk_transition_service(p_request uuid,p_action text,p_note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare request bhk_service_requests;
begin
  select * into request from bhk_service_requests where id=p_request for update;
  if not found or auth.uid() is null or auth.uid() not in (request.guest_id,request.host_id,request.provider_id) then raise exception 'Service request not found'; end if;
  if p_action='cancel' then
    if request.status='cancelled' then return; end if;
    if request.status='completed' or p_note is null or length(trim(p_note)) not between 5 and 2000 then raise exception 'An open request and cancellation reason are required'; end if;
    update bhk_service_requests set status='cancelled',cancellation_reason=p_note where id=request.id;
    return;
  end if;
  if not exists(select 1 from bhk_bookings where id=request.booking_id and status in ('confirmed','completed')) then raise exception 'Stay booking is no longer active'; end if;
  if p_action='accept' then
    perform 1 from bhk_service_providers where user_id=request.provider_id and review_status='approved' for update;
    if not found then raise exception 'Provider approval is required'; end if;
    if auth.uid()<>request.guest_id or request.status<>'quoted' or not request.host_approved or request.quote_paise is null or request.quote_terms is null
      or request.quote_expires_at<=now() or request.starts_on<(now() at time zone 'Asia/Kolkata')::date
      or not exists(select 1 from bhk_service_offerings where id=request.offering_id and active) then raise exception 'An active quote and host approval are required'; end if;
    -- Exclusion constraint reserves the provider for the whole requested date
    -- range across ALL offerings. This conservative capacity is one service.
    update bhk_service_requests set status='accepted',accepted_at=now() where id=request.id;
  elsif p_action='confirm' then
    if auth.uid()<>request.provider_id or request.status<>'accepted' or request.ends_on<=(now() at time zone 'Asia/Kolkata')::date
      or not exists(select 1 from bhk_service_providers where user_id=request.provider_id and review_status='approved') then raise exception 'Approved provider must confirm an accepted request'; end if;
    update bhk_service_requests set status='confirmed',confirmed_at=now() where id=request.id;
  elsif p_action='complete' then
    if auth.uid()<>request.provider_id or request.status<>'confirmed' or request.ends_on>(now() at time zone 'Asia/Kolkata')::date
      or p_note is null or length(trim(p_note)) not between 10 and 2000 then raise exception 'Provider completion evidence is required after service dates'; end if;
    update bhk_service_requests set status='completed',completion_evidence=p_note,completed_at=now() where id=request.id;
  else raise exception 'Unknown service action';
  end if;
end $$;
-- Booking cancellation releases capacity and truthfully cancels unfulfilled work.
create function public.bhk_cancel_booking_services()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='cancelled' and old.status<>'cancelled' then
    update bhk_service_requests set status='cancelled',cancellation_reason='Stay booking cancelled' where booking_id=new.id and status not in ('cancelled','completed');
  end if;
  return new;
end $$;
create trigger cancel_booking_services after update of status on public.bhk_bookings for each row execute function public.bhk_cancel_booking_services();
revoke all on function public.bhk_cancel_booking_services() from public;
revoke all on function public.bhk_register_service_provider(text),public.bhk_review_service_provider(uuid,boolean),
  public.bhk_add_service_offering(text,text,text,text,date,date),public.bhk_set_service_offering_active(uuid,boolean),
  public.bhk_request_service(uuid,uuid,date,date,text),public.bhk_approve_service_at_property(uuid),
  public.bhk_quote_service(uuid,bigint,text,timestamptz),public.bhk_transition_service(uuid,text,text) from public;
grant execute on function public.bhk_register_service_provider(text),public.bhk_review_service_provider(uuid,boolean),
  public.bhk_add_service_offering(text,text,text,text,date,date),public.bhk_set_service_offering_active(uuid,boolean),
  public.bhk_request_service(uuid,uuid,date,date,text),public.bhk_approve_service_at_property(uuid),
  public.bhk_quote_service(uuid,bigint,text,timestamptz),public.bhk_transition_service(uuid,text,text) to authenticated;
commit;
