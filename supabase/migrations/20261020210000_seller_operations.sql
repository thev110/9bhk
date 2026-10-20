begin;
create table public.bhk_property_sale_lifecycle(
  property_id text primary key references bhk_properties(id),
  state text not null check(state in ('active','withdrawn','sold')),
  changed_by uuid not null references auth.users(id),
  reason text not null check(length(trim(reason)) between 10 and 2000),
  changed_at timestamptz not null default now()
);
create table public.bhk_property_sale_events(
  id uuid primary key default gen_random_uuid(),property_id text not null references bhk_properties(id),
  state text not null,actor_id uuid not null references auth.users(id),reason text not null,created_at timestamptz not null default now()
);
alter table bhk_property_sale_lifecycle enable row level security;
alter table bhk_property_sale_events enable row level security;
grant select on bhk_property_sale_lifecycle,bhk_property_sale_events to authenticated;
grant all on bhk_property_sale_lifecycle,bhk_property_sale_events to service_role;
create policy property_sale_state_owner on bhk_property_sale_lifecycle for select to authenticated using(exists(select 1 from bhk_properties where id=property_id and host_id=auth.uid()));
create policy property_sale_events_owner on bhk_property_sale_events for select to authenticated using(exists(select 1 from bhk_properties where id=property_id and host_id=auth.uid()));
create function public.bhk_set_sale_lifecycle(p_property text,p_state text,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare property bhk_properties;
begin
  select * into property from bhk_properties where id=p_property and host_id=auth.uid() for update;
  if not found then raise exception 'Property unavailable'; end if;
  if p_state is null or p_state not in ('active','withdrawn','sold') or p_reason is null or length(trim(p_reason)) not between 10 and 2000 then raise exception 'Record a valid state and reason'; end if;
  if p_state='active' and exists(select 1 from bhk_property_sale_lifecycle where property_id=p_property and state='sold') then raise exception 'Sold inventory requires staff ownership review'; end if;
  if p_state in ('withdrawn','sold') then
    if exists(select 1 from bhk_viewing_appointments where property_id=p_property and status in ('proposed','confirmed')) then raise exception 'Cancel or complete active viewing appointments first'; end if;
    if exists(select 1 from bhk_sales_offers where property_id=p_property and status='submitted') then raise exception 'Resolve open purchase offers first'; end if;
  end if;
  if p_state='sold' and exists(select 1 from bhk_bookings where property_id=p_property and status in ('confirmed','awaiting')
      and (status='confirmed' or hold_expires_at is null or hold_expires_at>now())) then
    raise exception 'Resolve outstanding guest stays before marking this property sold';
  end if;
  if p_state='sold' and exists(select 1 from bhk_service_requests r join bhk_bookings b on b.id=r.booking_id
    where b.property_id=p_property and r.status in ('requested','quoted','accepted','confirmed')) then raise exception 'Resolve active service requests first'; end if;
  insert into bhk_property_sale_lifecycle(property_id,state,changed_by,reason) values(p_property,p_state,auth.uid(),p_reason)
  on conflict(property_id) do update set state=excluded.state,changed_by=excluded.changed_by,reason=excluded.reason,changed_at=now();
  insert into bhk_property_sale_events(property_id,state,actor_id,reason) values(p_property,p_state,auth.uid(),p_reason);
  -- Publication changes use the existing draft/review guard; no automatic republishing.
  update bhk_properties set status='draft',is_for_sale=(p_state='active') where id=p_property;
  if p_state in ('withdrawn','sold') then
    update bhk_property_mandates set status='revoked',revoked_at=now() where property_id=p_property and status in ('pending','approved');
    update bhk_viewing_requests set status='cancelled' where property_id=p_property and status in ('pending','scheduled');
    update bhk_sale_document_grants g set revoked_at=now() where revoked_at is null and exists(
      select 1 from bhk_sale_document_versions v join bhk_sale_documents d on d.id=v.document_id where v.id=g.version_id and d.property_id=p_property);
  end if;
end $$;
create function public.bhk_seller_dashboard() returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'propertyId',p.id,'name',p.name,'listingStatus',p.status,'forSale',p.is_for_sale,
    'enquiries',(select count(*) from bhk_viewing_requests v where v.property_id=p.id),
    'pendingEnquiries',(select count(*) from bhk_viewing_requests v where v.property_id=p.id and v.status='pending'),
    'upcomingViewings',(select count(*) from bhk_viewing_appointments a where a.property_id=p.id and a.status in ('proposed','confirmed') and a.ends_at>now()),
    'openOffers',(select count(*) from bhk_sales_offers o where o.property_id=p.id and o.status='submitted'),
    'acceptedOffers',(select count(*) from bhk_sales_offers o where o.property_id=p.id and o.status='accepted'),
    'pendingMandates',(select count(*) from bhk_property_mandates m where m.property_id=p.id and m.status='pending' and m.expires_at>now()),
    'upcomingStays',(select count(*) from bhk_bookings b where b.property_id=p.id and b.status='confirmed' and b.checkout_at>now())
  )),'[]'::jsonb) into result from (select * from bhk_properties where host_id=auth.uid() order by created_at desc limit 100) p;
  return jsonb_build_object('properties',result,'generatedAt',now(),'limit',100);
end $$;
revoke all on function bhk_set_sale_lifecycle(text,text,text),bhk_seller_dashboard() from public,anon;
grant execute on function bhk_set_sale_lifecycle(text,text,text),bhk_seller_dashboard() to authenticated;
commit;
