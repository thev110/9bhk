-- Apply in one transaction. Existing overlaps must be resolved before deployment.
begin;

-- Legacy inventory below the marketplace floor must be reviewed as a draft,
-- never silently relabelled as a three-bedroom property.
update public.bhk_properties set status='draft' where bedrooms < 3;

alter table public.bhk_properties
  add column if not exists weekend_price integer check (weekend_price > 0),
  add column if not exists tax_rate numeric not null default 0.12 check (tax_rate between 0 and 1),
  add column if not exists platform_fee_rate numeric not null default 0 check (platform_fee_rate between 0 and 1);
create table public.bhk_property_rates (
  id uuid primary key default gen_random_uuid(), property_id text not null references public.bhk_properties(id),
  host_id uuid not null references auth.users(id), start_date date not null, end_date date not null,
  nightly_price integer not null check (nightly_price > 0), check (end_date > start_date),
  exclude using gist (property_id with =, daterange(start_date,end_date,'[)') with &&)
);
alter table public.bhk_property_rates enable row level security;
grant select,insert,update,delete on public.bhk_property_rates to authenticated;
create policy bhk_rates_own on public.bhk_property_rates for all to authenticated
  using (host_id=auth.uid()) with check (host_id=auth.uid() and exists(select 1 from public.bhk_properties p where p.id=property_id and p.host_id=auth.uid()));

alter table public.bhk_bookings
  add column if not exists order_id text,
  add column if not exists hold_expires_at timestamptz,
  add column if not exists payment_status text not null default 'unpaid' check(payment_status in ('unpaid','partial','paid','review')),
  add column if not exists refund_status text not null default 'none' check(refund_status in ('none','requested','processing','processed','failed')),
  add column if not exists quote jsonb,
  add column if not exists funding_mode text not null default 'full' check(funding_mode in ('full','split'));
-- Legacy paid rows remain visible, but require reconciliation before settlement.
update public.bhk_bookings set payment_status='review' where payment_ref is not null;
alter table public.bhk_bookings drop constraint if exists bhk_bookings_no_overlap;
alter table public.bhk_bookings add constraint bhk_bookings_valid_stay check(check_out > check_in and adults > 0 and children >= 0 and total > 0);
alter table public.bhk_bookings add constraint bhk_bookings_no_overlap exclude using gist (property_id with =, stay with &&) where(status <> 'cancelled');
revoke insert,update,delete on public.bhk_bookings from anon,authenticated;
create policy bhk_bookings_staff_read on public.bhk_bookings for select to authenticated using(public.bhk_is_staff());
revoke insert,update,delete on public.bhk_split_shares from anon,authenticated;
grant all on public.bhk_bookings,public.bhk_split_shares,public.bhk_properties to service_role;
alter table public.bhk_split_shares add column if not exists order_id text;

create table public.bhk_payment_orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  kind text not null check(kind in ('booking','share','subscription')), booking_id uuid references public.bhk_bookings(id),
  share_id uuid references public.bhk_split_shares(id), gateway_order_id text unique,
  amount_paise bigint not null check(amount_paise > 0), currency text not null default 'INR' check(currency='INR'),
  status text not null default 'creating' check(status in ('creating','ready','captured','failed','review')),
  payment_id text unique, captured_at timestamptz, created_at timestamptz not null default now(),
  check((kind='booking' and booking_id is not null and share_id is null) or (kind='share' and booking_id is not null and share_id is not null) or (kind='subscription' and booking_id is null and share_id is null))
);
create unique index bhk_one_live_booking_order on public.bhk_payment_orders(booking_id) where kind='booking' and status <> 'failed';
create unique index bhk_one_live_share_order on public.bhk_payment_orders(share_id) where kind='share' and status <> 'failed';
create unique index bhk_one_subscription_checkout on public.bhk_payment_orders(user_id) where kind='subscription' and status in ('creating','ready');
create table public.bhk_broker_subscriptions (
  user_id uuid primary key references auth.users(id), status text not null default 'active' check(status in ('active','expired')),
  expires_at timestamptz not null, payment_id text not null unique, created_at timestamptz not null default now()
);
create table public.bhk_payment_events (event_id text primary key, payment_id text not null, created_at timestamptz not null default now());
create table public.bhk_refund_requests (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bhk_bookings(id),
  payment_order_id uuid not null unique references public.bhk_payment_orders(id), requested_by uuid references auth.users(id),
  amount integer not null check(amount > 0), reason text not null,
  status text not null default 'requested' check(status in ('requested','processing','processed','failed')),
  gateway_refund_id text unique, created_at timestamptz not null default now()
);
create table public.bhk_payout_requests (
  id uuid primary key default gen_random_uuid(), host_id uuid not null references auth.users(id),
  amount integer not null check(amount > 0), booking_ids uuid[] not null,
  status text not null default 'requested' check(status in ('requested','approved','paid','rejected')),
  created_at timestamptz not null default now()
);
alter table public.bhk_payment_orders enable row level security;
alter table public.bhk_payment_events enable row level security;
alter table public.bhk_broker_subscriptions enable row level security;
alter table public.bhk_refund_requests enable row level security;
alter table public.bhk_payout_requests enable row level security;
grant select on public.bhk_broker_subscriptions,public.bhk_refund_requests,public.bhk_payout_requests to authenticated;
create policy bhk_subscription_own on public.bhk_broker_subscriptions for select using(user_id=auth.uid());
create policy bhk_refund_read on public.bhk_refund_requests for select using(public.bhk_is_staff() or exists(select 1 from public.bhk_bookings b where b.id=booking_id and b.guest_id=auth.uid()));
create policy bhk_payout_read on public.bhk_payout_requests for select using(host_id=auth.uid() or public.bhk_is_staff());
grant all on public.bhk_property_rates,public.bhk_payment_orders,public.bhk_payment_events,public.bhk_broker_subscriptions,public.bhk_refund_requests,public.bhk_payout_requests to service_role;

-- Anonymous inventory uses a projection. Raw addresses and coordinates remain private.
drop policy if exists bhk_properties_public_read on public.bhk_properties;
create policy bhk_properties_owner_read on public.bhk_properties for select to authenticated using(host_id=auth.uid());
revoke select on public.bhk_properties from anon;
create view public.bhk_public_properties with (security_barrier=true) as
  select p.id,p.name,p.description,p.type,p.location,p.city,p.area,p.guests,p.bedrooms,p.beds,p.bathrooms,
    p.price,p.cleaning,p.deposit,p.min_stay,p.weekend_price,p.tax_rate,p.platform_fee_rate,p.amenities,p.vibes,p.image_urls,
    p.highlights,p.blurb,p.alt,p.guest_favourite,p.group_name,p.status,p.created_at,p.blocked_dates,
    p.setting,p.setting_name,p.setting_detail,p.beach_frontage,p.coastal_zone,p.private_beach_access,p.tide_distance_meters,
    p.garage_type,p.garage_capacity,p.supercar_friendly,p.ev_charging_kw,p.washdown_station,p.is_for_sale,p.sale_price,p.land_area,
    p.hosts_celebrations,p.max_event_guests,p.power_load_kw,p.sound_curfew_hour,p.parking_cars,p.generator_kw,p.caterer_kitchen,
    p.check_in_time,p.check_out_time,p.house_rules,p.pets_allowed,p.seo_title,p.seo_description,p.canonical_url,p.noindex,
    p.verification_status,p.verification_type,p.verification_date,p.verified_by,
    (select coalesce(avg(r.rating),0) from public.bhk_reviews r where r.property_id=p.id and r.status='published' and r.verified_stay) as verified_review_rating,
    (select count(*) from public.bhk_reviews r where r.property_id=p.id and r.status='published' and r.verified_stay) as verified_review_count
  from public.bhk_properties p where p.status='published' and p.bedrooms>=3;
grant select on public.bhk_public_properties to anon,authenticated;
-- Host updates cannot publish themselves or change verification facts.
alter table public.bhk_properties alter column status set default 'draft';
create function public.bhk_guard_property() returns trigger language plpgsql set search_path=public as $$
begin
  if new.status in ('published','pending') and new.bedrooms<3 then raise exception 'Public listings require at least three bedrooms'; end if;
  if current_user in ('postgres','service_role','supabase_admin') or public.bhk_is_staff() then return new; end if;
  if new.host_id is distinct from auth.uid() then raise exception 'Property ownership cannot change'; end if;
  if tg_op='INSERT' and new.status not in ('draft','pending') then raise exception 'Only staff can publish or reject a listing'; end if;
  if tg_op='UPDATE' and new.status is distinct from old.status and new.status not in ('draft','pending') then raise exception 'Only staff can publish or reject a listing'; end if;
  if tg_op='INSERT' then
    if coalesce(new.verification_status,'unverified') <> 'unverified' or new.verification_type is not null or new.review_note is not null or new.reviewed_by is not null or new.reviewed_at is not null or new.verified_by is not null or new.verification_date is not null then raise exception 'Verification requires staff review'; end if;
  elsif row(new.verification_status,new.verification_type,new.verification_date,new.verified_by,new.reviewed_by,new.reviewed_at,new.review_note) is distinct from row(old.verification_status,old.verification_type,old.verification_date,old.verified_by,old.reviewed_by,old.reviewed_at,old.review_note) then
    raise exception 'Verification requires staff review';
  end if;
  if tg_op='UPDATE' and old.status='published' and new.status='published' and (to_jsonb(new)-array['blocked_dates','min_stay','weekend_price','price','cleaning','deposit']) is distinct from (to_jsonb(old)-array['blocked_dates','min_stay','weekend_price','price','cleaning','deposit']) then raise exception 'Move the listing to draft before editing published content'; end if;
  if new.status='pending' and (tg_op='INSERT' or old.status is distinct from new.status) and (select count(distinct d.kind) from public.bhk_property_documents d where d.property_id=new.id and d.host_id=auth.uid() and d.status<>'rejected')<3 then raise exception 'Upload ownership proof, tax receipt, and host ID before submitting'; end if;
  if exists(select 1 from public.bhk_bookings b where b.property_id=new.id and b.status <> 'cancelled' and (b.hold_expires_at is null or b.hold_expires_at>now() or b.payment_status='paid') and exists(select 1 from unnest(new.blocked_dates) d where d>=b.check_in and d<b.check_out)) then raise exception 'Cannot block reserved nights'; end if;
  return new;
end $$;
create trigger bhk_property_write_guard before insert or update on public.bhk_properties for each row execute function public.bhk_guard_property();
create function public.bhk_guard_broker_verification() returns trigger language plpgsql set search_path=public as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin') and not public.bhk_is_staff() then
    if tg_op='INSERT' then new.verified_broker:=false; elsif new.verified_broker is distinct from old.verified_broker then raise exception 'Broker verification requires staff review'; end if;
  end if;
  return new;
end $$;
create trigger bhk_broker_verification_guard before insert or update on public.bhk_profiles for each row execute function public.bhk_guard_broker_verification();
drop policy if exists bhk_property_documents_host_insert on public.bhk_property_documents;
create policy bhk_property_documents_host_insert on public.bhk_property_documents for insert to authenticated with check(host_id=auth.uid() and exists(select 1 from public.bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create policy bhk_property_documents_host_update on public.bhk_property_documents for update to authenticated using(host_id=auth.uid()) with check(host_id=auth.uid() and exists(select 1 from public.bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create function public.bhk_guard_document() returns trigger language plpgsql set search_path=public as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') or public.bhk_is_staff() then return new; end if;
  if tg_op='INSERT' then
    if new.status <> 'pending' or new.note is not null or new.reviewed_by is not null or new.reviewed_at is not null then raise exception 'Document review fields are staff-only'; end if;
  else
    if row(new.status,new.note,new.reviewed_by,new.reviewed_at) is distinct from row(old.status,old.note,old.reviewed_by,old.reviewed_at) then raise exception 'Document review fields are staff-only'; end if;
    if row(new.storage_path,new.file_name,new.mime_type,new.size_bytes) is distinct from row(old.storage_path,old.file_name,old.mime_type,old.size_bytes) then new.status:='pending'; new.note:=null; new.reviewed_by:=null; new.reviewed_at:=null; end if;
  end if;
  if split_part(new.storage_path,'/',1) <> auth.uid()::text or not exists(select 1 from public.bhk_properties p where p.id=new.property_id and p.host_id=auth.uid()) then raise exception 'Document must belong to an owned property'; end if;
  if tg_op='UPDATE' and row(new.property_id,new.host_id,new.kind) is distinct from row(old.property_id,old.host_id,old.kind) then raise exception 'Document ownership cannot change'; end if;
  return new;
end $$;
create trigger bhk_document_write_guard before insert or update on public.bhk_property_documents for each row execute function public.bhk_guard_document();
create function public.bhk_invalidate_document_listing() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' or row(new.storage_path,new.file_name,new.mime_type,new.size_bytes) is distinct from row(old.storage_path,old.file_name,old.mime_type,old.size_bytes) then
    update public.bhk_properties set status='draft',verification_status='unverified',verification_type=null,verification_date=null,verified_by=null,reviewed_by=null,reviewed_at=null,review_note=null where id=new.property_id and status in ('published','pending');
  end if;
  return new;
end $$;
revoke all on function public.bhk_invalidate_document_listing() from public,anon,authenticated;
create trigger bhk_document_replacement_review after insert or update on public.bhk_property_documents for each row execute function public.bhk_invalidate_document_listing();

create function public.bhk_queue_booking_refunds(p_booking uuid,p_reason text,p_user uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.bhk_refund_requests(booking_id,payment_order_id,requested_by,amount,reason)
    select p_booking,o.id,p_user,(o.amount_paise/100)::integer,p_reason from public.bhk_payment_orders o
    where o.booking_id=p_booking and o.payment_id is not null on conflict(payment_order_id) do nothing;
  update public.bhk_bookings set refund_status=case
    when exists(select 1 from public.bhk_refund_requests r where r.booking_id=p_booking and r.status='requested') then 'requested'
    when exists(select 1 from public.bhk_refund_requests r where r.booking_id=p_booking and r.status='processing') then 'processing'
    when exists(select 1 from public.bhk_refund_requests r where r.booking_id=p_booking and r.status='failed') then 'failed'
    when exists(select 1 from public.bhk_refund_requests r where r.booking_id=p_booking) then 'processed' else 'none' end where id=p_booking;
end $$;

create function public.bhk_prepare_booking(p_user uuid,p_property text,p_check_in date,p_check_out date,p_adults integer,p_children integer,p_name text,p_email text,p_phone text) returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.bhk_properties; b public.bhk_bookings; old_hold public.bhk_bookings; stay_total bigint; fee integer; tax integer; total_amount bigint; nights integer;
begin
  select * into p from public.bhk_properties where id=p_property and status='published' and bedrooms>=3 for update;
  if not found then raise exception 'Property is unavailable'; end if;
  if p_check_in < (now() at time zone 'Asia/Kolkata')::date or p_check_out<=p_check_in or p_check_out-p_check_in < greatest(p.min_stay,1) or p_check_out-p_check_in>90 then raise exception 'Invalid stay dates'; end if;
  if p_adults<1 or p_children<0 or p_adults+p_children>p.guests then raise exception 'Guest capacity exceeded'; end if;
  if length(trim(p_name))<2 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(regexp_replace(p_phone,'\D','','g'))<10 then raise exception 'Invalid guest details'; end if;
  if p.price<=0 or p.cleaning<0 or p.deposit<0 then raise exception 'Property pricing is unavailable'; end if;
  for old_hold in select * from public.bhk_bookings where property_id=p_property and status='awaiting' and hold_expires_at<=now() for update loop
    update public.bhk_bookings set status='cancelled' where id=old_hold.id;
    perform public.bhk_queue_booking_refunds(old_hold.id,'Expired group funding hold',old_hold.guest_id);
  end loop;
  if exists(select 1 from unnest(p.blocked_dates) d where d>=p_check_in and d<p_check_out) then raise exception 'Dates include a host closure'; end if;
  if exists(select 1 from public.bhk_bookings where property_id=p_property and status<>'cancelled' and stay && daterange(p_check_in,p_check_out,'[)')) then raise exception 'Dates are already reserved'; end if;
  if (select count(*) from public.bhk_bookings where guest_id=p_user and status='awaiting' and hold_expires_at>now())>=3 then raise exception 'Finish or cancel your existing holds first'; end if;
  nights:=p_check_out-p_check_in;
  select sum(coalesce((select nightly_price from public.bhk_property_rates r where r.property_id=p.id and d::date>=r.start_date and d::date<r.end_date),case when extract(isodow from d) in (6,7) then p.weekend_price end,p.price)) into stay_total from generate_series(p_check_in::timestamp,(p_check_out-1)::timestamp,interval '1 day') d;
  fee:=round(stay_total*p.platform_fee_rate); tax:=round((stay_total+p.cleaning+fee)*p.tax_rate); total_amount:=stay_total+p.cleaning+fee+tax+p.deposit;
  if total_amount>2000000000 then raise exception 'Quote exceeds booking limit'; end if;
  insert into public.bhk_bookings(code,property_id,property_name,guest_id,host_id,guest_name,guest_email,guest_phone,check_in,check_out,adults,children,total,status,hold_expires_at,quote)
    values('9B-'||replace(gen_random_uuid()::text,'-',''),p.id,p.name,p_user,p.host_id,trim(p_name),trim(p_email),trim(p_phone),p_check_in,p_check_out,p_adults,p_children,total_amount,'awaiting',now()+interval '30 minutes',jsonb_build_object('stay',stay_total,'cleaning',p.cleaning,'platformFee',fee,'tax',tax,'deposit',p.deposit,'total',total_amount,'nights',nights,'taxRate',p.tax_rate)) returning * into b;
  return jsonb_build_object('bookingId',b.id,'bookingCode',b.code,'total',b.total,'holdExpiresAt',b.hold_expires_at,'quote',b.quote);
end $$;

create function public.bhk_claim_order(p_user uuid,p_kind text,p_booking uuid default null,p_share uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare b public.bhk_bookings; s public.bhk_split_shares; o public.bhk_payment_orders; amount bigint;
begin
  if p_kind in ('booking','share') then
    select * into b from public.bhk_bookings where id=p_booking for update;
    if not found or b.guest_id<>p_user or b.status<>'awaiting' or b.hold_expires_at is null or b.hold_expires_at<=now() then raise exception 'Booking is not payable'; end if;
    if p_kind='booking' then
      if b.funding_mode<>'full' or b.payment_status<>'unpaid' then raise exception 'Booking is already funded or split'; end if;
      amount:=b.total::bigint*100;
    else
      if b.funding_mode<>'split' then raise exception 'Booking is not split'; end if;
      select * into s from public.bhk_split_shares where id=p_share and booking_id=b.id for update;
      if not found or s.paid then raise exception 'Share is not payable'; end if;
      amount:=s.amount::bigint*100;
    end if;
    select * into o from public.bhk_payment_orders where status<>'failed' and kind=p_kind and booking_id=b.id and (p_kind='booking' or share_id=s.id);
  elsif p_kind='subscription' then
    perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
    if exists(select 1 from public.bhk_broker_subscriptions where user_id=p_user and expires_at>now() and status='active') then raise exception 'Subscription is already active'; end if;
    amount:=50000;
    select * into o from public.bhk_payment_orders where user_id=p_user and kind='subscription' and status in ('creating','ready');
  else raise exception 'Unknown checkout kind'; end if;
  if o.id is not null and o.status='creating' and o.created_at<now()-interval '2 minutes' then
    update public.bhk_payment_orders set status='failed' where id=o.id;
    o:=null;
  end if;
  if o.id is not null then
    if o.status='creating' then raise exception 'Checkout initialization is in progress; please retry shortly'; end if;
    return to_jsonb(o);
  end if;
  insert into public.bhk_payment_orders(user_id,kind,booking_id,share_id,amount_paise) values(p_user,p_kind,p_booking,p_share,amount) returning * into o;
  return to_jsonb(o);
end $$;

create function public.bhk_bind_order(p_intent uuid,p_gateway text) returns void language plpgsql security definer set search_path=public as $$
declare o public.bhk_payment_orders; b public.bhk_bookings;
begin
  select * into o from public.bhk_payment_orders where id=p_intent;
  if o.booking_id is not null then
    select * into b from public.bhk_bookings where id=o.booking_id for update;
    if b.status<>'awaiting' or b.hold_expires_at<=now() then raise exception 'Reservation closed before checkout initialized'; end if;
  end if;
  update public.bhk_payment_orders set gateway_order_id=p_gateway,status='ready' where id=p_intent and status='creating' returning * into o;
  if not found then raise exception 'Order cannot be bound'; end if;
  if o.kind='booking' then update public.bhk_bookings set order_id=p_gateway where id=o.booking_id; elsif o.kind='share' then update public.bhk_split_shares set order_id=p_gateway where id=o.share_id; end if;
end $$;

create function public.bhk_capture_payment(p_order text,p_payment text,p_amount bigint,p_currency text,p_event text,p_captured_at timestamptz) returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.bhk_payment_orders; b public.bhk_bookings; was_paid boolean;
begin
  select * into o from public.bhk_payment_orders where gateway_order_id=p_order;
  if not found then raise exception 'Unknown order'; end if;
  if o.booking_id is not null then select * into b from public.bhk_bookings where id=o.booking_id for update; else perform pg_advisory_xact_lock(hashtextextended(o.user_id::text,0)); end if;
  select * into o from public.bhk_payment_orders where id=o.id for update;
  if o.amount_paise<>p_amount or o.currency<>p_currency or p_payment is null or p_captured_at is null or p_captured_at>now()+interval '5 minutes' then raise exception 'Payment does not match the stored order'; end if;
  if o.payment_id is not null and o.payment_id<>p_payment then raise exception 'Order was already paid'; end if;
  if exists(select 1 from public.bhk_payment_events where event_id=p_event and payment_id<>p_payment) then raise exception 'Event identifier conflict'; end if;
  if o.payment_id=p_payment then return jsonb_build_object('success',true,'status',coalesce(b.status,'active'),'bookingCode',b.code,'total',b.total); end if;
  if o.status<>'ready' then raise exception 'Order is not ready for settlement'; end if;
  insert into public.bhk_payment_events(event_id,payment_id) values(p_event,p_payment) on conflict(event_id) do nothing;
  if exists(select 1 from public.bhk_payment_events where event_id=p_event and payment_id<>p_payment) then raise exception 'Event identifier conflict'; end if;
  update public.bhk_payment_orders set payment_id=p_payment,status='captured',captured_at=p_captured_at where id=o.id;
  if o.kind='subscription' then
    insert into public.bhk_broker_subscriptions(user_id,status,expires_at,payment_id) values(o.user_id,'active',now()+interval '1 month',p_payment)
      on conflict(user_id) do update set status='active',expires_at=greatest(now(),bhk_broker_subscriptions.expires_at)+interval '1 month',payment_id=excluded.payment_id;
    return jsonb_build_object('success',true,'status','active');
  end if;
  if b.status<>'awaiting' or b.hold_expires_at<=now() or p_captured_at>b.hold_expires_at or b.payment_status in ('paid','review') then
    update public.bhk_payment_orders set status='review' where id=o.id;
    update public.bhk_bookings set status=case when status='awaiting' then 'cancelled' else status end,payment_status='review' where id=b.id;
    perform public.bhk_queue_booking_refunds(b.id,'Capture after reservation closed or expired',b.guest_id);
    return jsonb_build_object('success',true,'status','refund_requested','bookingCode',b.code,'total',b.total);
  end if;
  if o.kind='share' then
    update public.bhk_split_shares set paid=true,paid_at=p_captured_at,payment_ref=p_payment where id=o.share_id and not paid;
    was_paid:=not exists(select 1 from public.bhk_split_shares where booking_id=b.id and not paid);
  else was_paid:=true; end if;
  update public.bhk_bookings set status=case when was_paid then 'confirmed' else 'awaiting' end,payment_status=case when was_paid then 'paid' else 'partial' end,payment_ref=case when o.kind='booking' then p_payment else payment_ref end where id=b.id returning * into b;
  return jsonb_build_object('success',true,'status',b.status,'bookingCode',b.code,'total',b.total);
end $$;

create function public.bhk_create_split(p_user uuid,p_code text,p_members text[]) returns jsonb language plpgsql security definer set search_path=public as $$
declare b public.bhk_bookings; count_members integer; i integer;
begin
  select * into b from public.bhk_bookings where code=p_code and guest_id=p_user for update;
  if not found or b.status<>'awaiting' or b.payment_status<>'unpaid' or b.hold_expires_at<=now() then raise exception 'Only an unpaid active hold can be split'; end if;
  if exists(select 1 from public.bhk_payment_orders where booking_id=b.id and status<>'failed') then raise exception 'Checkout has already started'; end if;
  count_members:=cardinality(p_members);
  if count_members is null or count_members<2 or count_members>20 or count_members>b.total then raise exception 'Supply between 2 and 20 members'; end if;
  if exists(select 1 from public.bhk_split_shares where booking_id=b.id) then raise exception 'Split roster is already fixed'; end if;
  for i in 1..count_members loop
    if length(trim(p_members[i]))<1 or length(p_members[i])>100 then raise exception 'Invalid member name'; end if;
    insert into public.bhk_split_shares(booking_id,slot,member_name,amount) values(b.id,i-1,trim(p_members[i]),b.total/count_members+case when i<=b.total%count_members then 1 else 0 end);
  end loop;
  update public.bhk_bookings set funding_mode='split' where id=b.id;
  return (select jsonb_agg(jsonb_build_object('id',id,'name',member_name,'amount',amount,'paid',paid) order by slot) from public.bhk_split_shares where booking_id=b.id);
end $$;

create function public.bhk_cancel_booking(p_user uuid,p_code text,p_staff boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare b public.bhk_bookings; arrival text; cutoff timestamptz;
begin
  select * into b from public.bhk_bookings where code=p_code and (guest_id=p_user or host_id=p_user or p_staff) for update;
  if not found then raise exception 'Booking not found'; end if;
  select check_in_time into arrival from public.bhk_properties where id=b.property_id;
  if arrival is null or arrival !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then arrival:='14:00'; end if;
  cutoff:=(b.check_in+arrival::time) at time zone 'Asia/Kolkata';
  if b.status='completed' or (b.status<>'cancelled' and now()>=cutoff and not p_staff) then raise exception 'Contact support to cancel a started stay'; end if;
  update public.bhk_bookings set status='cancelled' where id=b.id;
  perform public.bhk_queue_booking_refunds(b.id,case when b.host_id=p_user then 'Host cancellation: full captured payment refund obligation' else 'Cancellation requested' end,p_user);
  select * into b from public.bhk_bookings where id=b.id;
  return jsonb_build_object('success',true,'refundStatus',b.refund_status);
end $$;

create function public.bhk_request_payout(p_host uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare ids uuid[]; value integer; request_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_host::text,1));
  select array_agg(b.id),sum(b.total-coalesce((b.quote->>'tax')::integer,0)-coalesce((b.quote->>'platformFee')::integer,0)-coalesce((b.quote->>'deposit')::integer,0)) into ids,value
  from public.bhk_bookings b where b.host_id=p_host and b.status='completed' and b.payment_status='paid' and b.refund_status='none' and b.check_out<=(now() at time zone 'Asia/Kolkata')::date
    and not exists(select 1 from public.bhk_payout_requests p where b.id=any(p.booking_ids) and p.status<>'rejected');
  if value is null or value<=0 then raise exception 'No completed, reconciled stays are eligible for settlement'; end if;
  insert into public.bhk_payout_requests(host_id,amount,booking_ids) values(p_host,value,ids) returning id into request_id;
  return jsonb_build_object('success',true,'requestId',request_id,'status','requested','amount',value);
end $$;

create or replace function public.bhk_availability() returns table(property_id text,check_in date,check_out date,status text) language sql security definer set search_path=public stable as $$
  select b.property_id,b.check_in,b.check_out,b.status from public.bhk_bookings b where b.status<>'cancelled' and (b.status<>'awaiting' or b.hold_expires_at is null or b.hold_expires_at>now());
$$;
create function public.bhk_expire_holds() returns jsonb language plpgsql security definer set search_path=public as $$
declare target public.bhk_bookings; expired integer:=0; finished integer;
begin
  for target in select b.* from public.bhk_bookings b where b.status='awaiting' and b.hold_expires_at<=now() order by b.property_id,b.id for update loop
    update public.bhk_bookings set status='cancelled' where id=target.id;
    perform public.bhk_queue_booking_refunds(target.id,'Expired reservation funding hold',target.guest_id);
    expired:=expired+1;
  end loop;
  update public.bhk_bookings set status='completed' where status='confirmed' and payment_status='paid' and check_out<=(now() at time zone 'Asia/Kolkata')::date;
  get diagnostics finished=row_count;
  return jsonb_build_object('expired',expired,'completed',finished);
end $$;
revoke all on function public.bhk_expire_holds() from public,anon,authenticated;
grant execute on function public.bhk_expire_holds() to service_role;
-- Financial RPCs are private: the authenticated server verifies ownership first.
revoke all on function public.bhk_queue_booking_refunds(uuid,text,uuid),public.bhk_prepare_booking(uuid,text,date,date,integer,integer,text,text,text),public.bhk_claim_order(uuid,text,uuid,uuid),public.bhk_bind_order(uuid,text),public.bhk_capture_payment(text,text,bigint,text,text,timestamptz),public.bhk_create_split(uuid,text,text[]),public.bhk_cancel_booking(uuid,text,boolean),public.bhk_request_payout(uuid) from public,anon,authenticated;
grant execute on function public.bhk_queue_booking_refunds(uuid,text,uuid),public.bhk_prepare_booking(uuid,text,date,date,integer,integer,text,text,text),public.bhk_claim_order(uuid,text,uuid,uuid),public.bhk_bind_order(uuid,text),public.bhk_capture_payment(text,text,bigint,text,text,timestamptz),public.bhk_create_split(uuid,text,text[]),public.bhk_cancel_booking(uuid,text,boolean),public.bhk_request_payout(uuid) to service_role;
commit;
