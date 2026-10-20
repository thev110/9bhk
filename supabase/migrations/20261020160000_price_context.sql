begin;
create table public.bhk_price_comparables(
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  price_kind text not null check(price_kind in ('asking','completed_sale')),
  amount_paise bigint not null check(amount_paise between 1 and 9000000000000000),
  currency text not null default 'INR' check(currency='INR'),
  source_label text not null check(length(trim(source_label)) between 1 and 200),
  source_url text not null check(source_url ~ '^https://[^[:space:]]+$' and length(source_url)<=2000),
  observed_on date not null,
  location_label text not null check(length(trim(location_label)) between 1 and 200),
  area numeric not null check(area>0 and area<1000000000),
  area_unit text not null check(area_unit in ('sq_ft','sq_m','acre','cent')),
  evidence_reference text not null check(length(trim(evidence_reference)) between 5 and 1000),
  notes text not null default '' check(length(notes)<=4000),
  review_status text not null default 'self_reported' check(review_status in ('self_reported','reviewed','rejected')),
  review_scope text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.bhk_price_context_reviews(
  id uuid primary key default gen_random_uuid(),
  comparable_id uuid not null references public.bhk_price_comparables(id) on delete cascade,
  snapshot jsonb not null,
  decision text not null,
  scope text not null,
  reviewer_id uuid not null references auth.users(id),
  reviewed_at timestamptz not null default now()
);
alter table public.bhk_price_comparables enable row level security;
alter table public.bhk_price_context_reviews enable row level security;
grant select on public.bhk_price_comparables,public.bhk_price_context_reviews to authenticated;
grant all on public.bhk_price_comparables,public.bhk_price_context_reviews to service_role;
create policy price_comparables_owner on public.bhk_price_comparables for select to authenticated using(
  (owner_id=auth.uid() and exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid())) or bhk_is_staff());
create policy price_reviews_staff on public.bhk_price_context_reviews for select to authenticated using(bhk_is_staff());
create function public.bhk_save_price_comparable(p_id uuid,p_property text,p_kind text,p_amount bigint,p_source text,p_url text,p_observed date,p_location text,p_area numeric,p_unit text,p_evidence text,p_notes text)
returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
  if auth.uid() is null or not exists(select 1 from bhk_properties where id=p_property and host_id=auth.uid()) then raise exception 'Current property ownership required'; end if;
  if p_observed is null or not isfinite(p_observed) or p_observed>current_date then raise exception 'A valid source observation date is required'; end if;
  if p_id is null then
    perform pg_advisory_xact_lock(hashtextextended(p_property,16000));
    if (select count(*) from bhk_price_comparables where property_id=p_property)>=100 then raise exception 'Comparable limit reached'; end if;
    insert into bhk_price_comparables(property_id,owner_id,price_kind,amount_paise,source_label,source_url,observed_on,location_label,area,area_unit,evidence_reference,notes)
      values(p_property,auth.uid(),p_kind,p_amount,p_source,p_url,p_observed,p_location,p_area,p_unit,p_evidence,coalesce(p_notes,'')) returning id into result;
  else
    update bhk_price_comparables set price_kind=p_kind,amount_paise=p_amount,source_label=p_source,source_url=p_url,observed_on=p_observed,
      location_label=p_location,area=p_area,area_unit=p_unit,evidence_reference=p_evidence,notes=coalesce(p_notes,''),
      review_status='self_reported',review_scope=null,reviewed_at=null,reviewed_by=null,expires_at=null
      where id=p_id and property_id=p_property and owner_id=auth.uid() returning id into result;
    if not found then raise exception 'Comparable unavailable'; end if;
  end if;
  return result;
end $$;
create function public.bhk_review_price_comparable(p_id uuid,p_decision text,p_scope text,p_expiry timestamptz)
returns void language plpgsql security definer set search_path=public as $$
declare comparable bhk_price_comparables;
begin
  if not coalesce(bhk_is_staff(),false) then raise exception 'Staff review required'; end if;
  select * into comparable from bhk_price_comparables where id=p_id for update;
  if not found or comparable.owner_id=auth.uid() then raise exception 'Independent review required'; end if;
  if p_decision is null or p_decision not in ('reviewed','rejected') or p_scope is null or length(trim(p_scope)) not between 5 and 1000 then raise exception 'Review decision and exact scope required'; end if;
  if p_decision='reviewed' and (p_expiry is null or p_expiry<=now() or p_expiry>now()+interval '1 year') then raise exception 'Review expiry within one year required'; end if;
  insert into bhk_price_context_reviews(comparable_id,snapshot,decision,scope,reviewer_id) values(comparable.id,to_jsonb(comparable),p_decision,p_scope,auth.uid());
  update bhk_price_comparables set review_status=p_decision,review_scope=p_scope,reviewed_at=now(),reviewed_by=auth.uid(),
    expires_at=case when p_decision='reviewed' then p_expiry else null end where id=p_id;
end $$;
create function public.bhk_read_price_context(p_property text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare owner uuid; city_name text; private_comps jsonb; asking_comps jsonb;
begin
  select host_id,city into owner,city_name from bhk_properties where id=p_property;
  if auth.uid() is null or owner is null or (owner<>auth.uid() and not bhk_property_capability(auth.uid(),p_property,'marketing')) then raise exception 'Current owner or marketing mandate required'; end if;
  select coalesce(jsonb_agg((to_jsonb(c)-'owner_id'-'reviewed_by')||jsonb_build_object('review_status',
    case when c.review_status='reviewed' and c.expires_at<=now() then 'expired' else c.review_status end) order by c.observed_on desc),'[]'::jsonb)
    into private_comps from bhk_price_comparables c where c.property_id=p_property and c.owner_id=owner;
  select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into asking_comps from (
    select p.id as source_property_id,p.name,p.city,p.area as locality,p.land_area as declared_land_area,
      p.sale_price::numeric*100 as amount_paise,'INR' as currency,'asking' as price_kind,
      'current_public_listing' as source,now() as observed_at,'owner_declared' as evidence_status
    from bhk_public_properties p where p.is_for_sale and p.sale_price>0 and lower(trim(p.city))=lower(trim(city_name))
      and p.id<>p_property order by p.id limit 20
  ) q;
  return jsonb_build_object('comparables',private_comps,'currentAskingListings',asking_comps,'isAppraisal',false,
    'interpretation','Asking listings and attributed completed-sale claims are separate. No market valuation is calculated.');
end $$;
revoke all on function public.bhk_save_price_comparable(uuid,text,text,bigint,text,text,date,text,numeric,text,text,text),
  public.bhk_review_price_comparable(uuid,text,text,timestamptz),public.bhk_read_price_context(text) from public;
grant execute on function public.bhk_save_price_comparable(uuid,text,text,bigint,text,text,date,text,numeric,text,text,text),
  public.bhk_review_price_comparable(uuid,text,text,timestamptz),public.bhk_read_price_context(text) to authenticated;
commit;
