begin;
-- Offers record negotiation intent only; acceptance does not execute a purchase or payment.
create table public.bhk_sales_offers (
 id uuid primary key default gen_random_uuid(), property_id text not null references public.bhk_properties(id),
 buyer_id uuid not null references auth.users(id), seller_id uuid not null references auth.users(id),
 status text not null default 'submitted' check(status in ('submitted','accepted','rejected','withdrawn')),
 version integer not null default 1, created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(buyer_id<>seller_id)
);
create index bhk_sales_offers_buyer on public.bhk_sales_offers(buyer_id,updated_at);
create index bhk_sales_offers_seller on public.bhk_sales_offers(seller_id,property_id,updated_at);
create table public.bhk_sales_offer_revisions (
 offer_id uuid not null references public.bhk_sales_offers(id),revision integer not null,
 price_paise bigint not null check(price_paise between 1 and 9007199254740991),currency text not null default 'INR' check(currency='INR'),
 financing text not null check(financing in ('unknown','cash_self_reported','loan_needed','preapproved_self_reported')),
 conditions text not null check(length(conditions)<=4000),proposed_close_date date,
 valid_until timestamptz not null check(isfinite(valid_until)),created_at timestamptz not null default now(),primary key(offer_id,revision)
);
create table public.bhk_sales_offer_events (
 id uuid primary key default gen_random_uuid(),offer_id uuid not null references public.bhk_sales_offers(id),
 actor_id uuid not null references auth.users(id),revision integer not null,action text not null check(action in ('submitted','revised','accepted','rejected','withdrawn')),
 reason text not null check(length(reason)<=2000),created_at timestamptz not null default now(),
 foreign key(offer_id,revision) references public.bhk_sales_offer_revisions(offer_id,revision)
);
create index bhk_sales_offer_events_offer on public.bhk_sales_offer_events(offer_id,created_at);
alter table public.bhk_sales_offers enable row level security;
alter table public.bhk_sales_offer_revisions enable row level security;
alter table public.bhk_sales_offer_events enable row level security;
revoke all on public.bhk_sales_offers,public.bhk_sales_offer_revisions,public.bhk_sales_offer_events from anon,authenticated;
grant select on public.bhk_sales_offers,public.bhk_sales_offer_revisions,public.bhk_sales_offer_events to authenticated;
grant all on public.bhk_sales_offers,public.bhk_sales_offer_revisions,public.bhk_sales_offer_events to service_role;
create policy offer_participant on public.bhk_sales_offers for select to authenticated using(buyer_id=auth.uid() or seller_id=auth.uid());
create policy offer_revision_participant on public.bhk_sales_offer_revisions for select to authenticated using(exists(select 1 from bhk_sales_offers o where o.id=offer_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())));
create policy offer_event_participant on public.bhk_sales_offer_events for select to authenticated using(exists(select 1 from bhk_sales_offers o where o.id=offer_id and (o.buyer_id=auth.uid() or o.seller_id=auth.uid())));

create function public.bhk_submit_sales_offer(p_property text,p_price bigint,p_financing text,p_conditions text,p_close date,p_valid_until timestamptz) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_seller uuid;v_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select host_id into v_seller from bhk_properties where id=p_property and status='published' and is_for_sale=true for share;
 if not found or v_seller is null or v_seller=auth.uid() then raise exception 'Property unavailable for offer'; end if;
 if p_valid_until<=now() or p_close<current_date then raise exception 'Offer dates must be current'; end if;
 insert into bhk_sales_offers(property_id,buyer_id,seller_id) values(p_property,auth.uid(),v_seller) returning id into v_id;
 insert into bhk_sales_offer_revisions(offer_id,revision,price_paise,financing,conditions,proposed_close_date,valid_until) values(v_id,1,p_price,p_financing,p_conditions,p_close,p_valid_until);
 insert into bhk_sales_offer_events(offer_id,actor_id,revision,action,reason) values(v_id,auth.uid(),1,'submitted','Buyer submitted offer');
 return v_id;
end $$;
create function public.bhk_revise_sales_offer(p_id uuid,p_version integer,p_price bigint,p_financing text,p_conditions text,p_close date,p_valid_until timestamptz) returns integer
language plpgsql security definer set search_path=public as $$
declare v_offer bhk_sales_offers;
begin
 select * into v_offer from bhk_sales_offers where id=p_id and buyer_id=auth.uid() for update;
 if not found then raise exception 'Offer unavailable'; end if;
 if v_offer.status<>'submitted' then raise exception 'Offer is already closed'; end if;
 if p_version is distinct from v_offer.version then raise exception 'Offer changed; reload before saving'; end if;
 perform 1 from bhk_properties where id=v_offer.property_id and host_id=v_offer.seller_id and status='published' and is_for_sale=true for share;
 if not found then raise exception 'Property unavailable for offer'; end if;
 if p_valid_until<=now() or p_close<current_date then raise exception 'Offer dates must be current'; end if;
 insert into bhk_sales_offer_revisions(offer_id,revision,price_paise,financing,conditions,proposed_close_date,valid_until) values(p_id,v_offer.version+1,p_price,p_financing,p_conditions,p_close,p_valid_until);
 update bhk_sales_offers set version=version+1,updated_at=now() where id=p_id;
 insert into bhk_sales_offer_events(offer_id,actor_id,revision,action,reason) values(p_id,auth.uid(),v_offer.version+1,'revised','Buyer revised offer');
 return v_offer.version+1;
end $$;
create function public.bhk_decide_sales_offer(p_id uuid,p_version integer,p_action text,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare v_offer bhk_sales_offers;v_expiry timestamptz;
begin
 select * into v_offer from bhk_sales_offers where id=p_id and (buyer_id=auth.uid() or seller_id=auth.uid()) for update;
 if not found then raise exception 'Offer unavailable'; end if;
 if p_version is distinct from v_offer.version then raise exception 'Offer changed; reload before deciding'; end if;
 if v_offer.status<>'submitted' then raise exception 'Offer is already closed'; end if;
 if p_action is null or not ((p_action='withdrawn' and v_offer.buyer_id=auth.uid()) or (p_action in ('accepted','rejected') and v_offer.seller_id=auth.uid())) then raise exception 'Decision not authorized'; end if;
 if p_action in ('accepted','rejected') then
  perform 1 from bhk_properties where id=v_offer.property_id and host_id=auth.uid() for share;
  if not found then raise exception 'Current owner required'; end if;
 end if;
 if p_action='accepted' then
  if not exists(select 1 from bhk_properties where id=v_offer.property_id and status='published' and is_for_sale=true) then raise exception 'Property unavailable for offer'; end if;
  select valid_until into v_expiry from bhk_sales_offer_revisions where offer_id=p_id and revision=v_offer.version;
  if v_expiry<=now() then raise exception 'Offer has expired'; end if;
 end if;
 if length(trim(p_reason))=0 then raise exception 'Decision reason required'; end if;
 update bhk_sales_offers set status=p_action,updated_at=now() where id=p_id;
 insert into bhk_sales_offer_events(offer_id,actor_id,revision,action,reason) values(p_id,auth.uid(),v_offer.version,p_action,trim(p_reason));
end $$;
revoke all on function public.bhk_submit_sales_offer(text,bigint,text,text,date,timestamptz),public.bhk_revise_sales_offer(uuid,integer,bigint,text,text,date,timestamptz),public.bhk_decide_sales_offer(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.bhk_submit_sales_offer(text,bigint,text,text,date,timestamptz),public.bhk_revise_sales_offer(uuid,integer,bigint,text,text,date,timestamptz),public.bhk_decide_sales_offer(uuid,integer,text,text) to authenticated;
commit;
