-- Item-specific, expiring evidence. Completeness never confers verification.
create function public.bhk_owns_evidence_listing(target text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from bhk_properties where id=target and host_id=auth.uid());
$$;
revoke all on function public.bhk_owns_evidence_listing(text) from public;
grant execute on function public.bhk_owns_evidence_listing(text) to authenticated;

create table public.bhk_listing_media (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties(id) on delete cascade,
  kind text not null check(kind in ('photo','floor_plan','accessible_route','bed_layout')),
  url text not null check(url ~ '^https://[^[:space:]]+$' and char_length(url)<=2000),
  room_label text not null check(char_length(trim(room_label)) between 1 and 100),
  caption text not null default '' check(char_length(caption)<=500),
  width_cm numeric check(width_cm>0 and width_cm<=100000),
  length_cm numeric check(length_cm>0 and length_cm<=100000),
  unique(id,property_id)
);
create function public.bhk_valid_listing_fact(k text,v jsonb)
returns boolean language sql immutable as $$
  select case
    when k in ('pool_fenced','step_free_access','pet_facilities','workspace') then jsonb_typeof(v)='boolean'
    when k in ('overnight_capacity','visitor_capacity','event_capacity','ground_floor_bedrooms','parking_spaces','beds')
      then case when jsonb_typeof(v)='number' then (v::text)::numeric between 0 and 10000 and trunc((v::text)::numeric)=(v::text)::numeric else false end
    else false end;
$$;
create table public.bhk_listing_facts (
  property_id text not null references public.bhk_properties(id) on delete cascade,
  fact_key text not null,
  value jsonb not null,
  source_label text not null check(char_length(trim(source_label)) between 1 and 200),
  observed_on date not null,
  media_id uuid,
  review_status text not null default 'supplied' check(review_status in ('supplied','reviewed','rejected')),
  review_scope text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  expires_at timestamptz,
  primary key(property_id,fact_key),
  foreign key(media_id,property_id) references public.bhk_listing_media(id,property_id),
  check(public.bhk_valid_listing_fact(fact_key,value)),
  check(review_status<>'reviewed' or (media_id is not null and reviewed_at is not null and reviewed_by is not null
    and char_length(trim(review_scope)) between 1 and 1000 and expires_at>reviewed_at))
);
create table public.bhk_listing_occasions (
  property_id text not null references public.bhk_properties(id) on delete cascade,
  occasion text not null check(occasion in ('family_stay','celebration','wedding','shoot','corporate_retreat','external_services')),
  permission text not null check(permission in ('not_allowed','approval_required')),
  conditions text not null default '' check(char_length(conditions)<=2000),
  primary key(property_id,occasion)
);
create table public.bhk_listing_fact_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties(id) on delete cascade,
  fact_key text not null,
  value jsonb not null,
  media_id uuid,
  media_snapshot jsonb,
  source_label text not null,
  observed_on date not null,
  decision text not null,
  scope text not null,
  reviewer_id uuid not null references auth.users(id),
  reviewed_at timestamptz not null default now(),
  expires_at timestamptz
);
alter table public.bhk_listing_media enable row level security;
alter table public.bhk_listing_facts enable row level security;
alter table public.bhk_listing_occasions enable row level security;
alter table public.bhk_listing_fact_reviews enable row level security;
grant select,delete on public.bhk_listing_media,public.bhk_listing_facts,public.bhk_listing_occasions to authenticated;
grant insert,update on public.bhk_listing_media,public.bhk_listing_occasions to authenticated;
grant insert(property_id,fact_key,value,source_label,observed_on,media_id),
  update(property_id,fact_key,value,source_label,observed_on,media_id) on public.bhk_listing_facts to authenticated;
grant select on public.bhk_listing_fact_reviews to authenticated;
create policy media_read on public.bhk_listing_media for select to authenticated using(bhk_owns_evidence_listing(property_id) or bhk_is_staff());
create policy media_write on public.bhk_listing_media for all to authenticated using(bhk_owns_evidence_listing(property_id)) with check(bhk_owns_evidence_listing(property_id));
create policy facts_read on public.bhk_listing_facts for select to authenticated using(bhk_owns_evidence_listing(property_id) or bhk_is_staff());
create policy facts_write on public.bhk_listing_facts for all to authenticated using(bhk_owns_evidence_listing(property_id)) with check(bhk_owns_evidence_listing(property_id));
create policy occasions_read on public.bhk_listing_occasions for select to authenticated using(bhk_owns_evidence_listing(property_id) or bhk_is_staff());
create policy occasions_write on public.bhk_listing_occasions for all to authenticated using(bhk_owns_evidence_listing(property_id)) with check(bhk_owns_evidence_listing(property_id));
create policy fact_history_read on public.bhk_listing_fact_reviews for select to authenticated using(bhk_owns_evidence_listing(property_id) or bhk_is_staff());

create function public.bhk_reset_changed_fact_review()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.observed_on>current_date then raise exception 'Observation date cannot be in the future'; end if;
  if tg_op='UPDATE' and row(new.property_id,new.fact_key) is distinct from row(old.property_id,old.fact_key) then
    raise exception 'Fact identity cannot change';
  end if;
  if tg_op='UPDATE' and row(new.value,new.source_label,new.observed_on,new.media_id)
    is distinct from row(old.value,old.source_label,old.observed_on,old.media_id) then
    new.review_status:='supplied'; new.review_scope:=null; new.reviewed_at:=null; new.reviewed_by:=null; new.expires_at:=null;
  end if;
  return new;
end;
$$;
create trigger reset_fact_review before insert or update on public.bhk_listing_facts
  for each row execute function public.bhk_reset_changed_fact_review();
create function public.bhk_invalidate_media_reviews()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new is distinct from old then
    update bhk_listing_facts set review_status='supplied',review_scope=null,reviewed_at=null,reviewed_by=null,expires_at=null where media_id=old.id;
  end if;
  return new;
end;
$$;
create trigger invalidate_media_reviews after update on public.bhk_listing_media
  for each row execute function public.bhk_invalidate_media_reviews();

create function public.bhk_invalidate_property_fact_reviews()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if row(new.host_id,new.bedrooms,new.beds,new.guests,new.amenities,new.status)
    is distinct from row(old.host_id,old.bedrooms,old.beds,old.guests,old.amenities,old.status) then
    update bhk_listing_facts set review_status='supplied',review_scope=null,reviewed_at=null,reviewed_by=null,expires_at=null where property_id=new.id;
  end if;
  return new;
end;
$$;
create trigger invalidate_property_fact_reviews after update on public.bhk_properties
  for each row execute function public.bhk_invalidate_property_fact_reviews();

create function public.bhk_review_listing_fact(target_property text,target_key text,decision text,scope text,valid_until timestamptz)
returns void language plpgsql security definer set search_path=public as $$
declare fact bhk_listing_facts;
begin
  if not coalesce(bhk_is_staff(),false) then raise exception 'Staff review required'; end if;
  if bhk_owns_evidence_listing(target_property) then raise exception 'Cannot review your own listing'; end if;
  if decision not in ('reviewed','rejected') or decision is null or char_length(trim(scope)) not between 1 and 1000 or scope is null then raise exception 'Review decision and scope required'; end if;
  select * into fact from bhk_listing_facts where property_id=target_property and fact_key=target_key for update;
  if not found then raise exception 'Fact not found'; end if;
  if decision='reviewed' and (fact.media_id is null or valid_until is null or valid_until<=now() or valid_until>now()+interval '1 year') then raise exception 'Evidence and expiry within one year required'; end if;
  -- Lock media as well: concurrent replacement must invalidate this review.
  perform 1 from bhk_listing_media where id=fact.media_id for update;
  update bhk_listing_facts set review_status=decision,review_scope=scope,reviewed_at=now(),reviewed_by=auth.uid(),expires_at=case when decision='reviewed' then valid_until else null end
    where property_id=target_property and fact_key=target_key;
  insert into bhk_listing_fact_reviews(property_id,fact_key,value,media_id,media_snapshot,source_label,observed_on,decision,scope,reviewer_id,expires_at)
    values(target_property,target_key,fact.value,fact.media_id,(select to_jsonb(m) from bhk_listing_media m where m.id=fact.media_id),fact.source_label,fact.observed_on,decision,scope,auth.uid(),case when decision='reviewed' then valid_until else null end);
end;
$$;
revoke all on function public.bhk_review_listing_fact(text,text,text,text,timestamptz) from public;
grant execute on function public.bhk_review_listing_fact(text,text,text,text,timestamptz) to authenticated;

-- Public projection excludes reviewer identity and unpublished listings.
create view public.bhk_public_listing_facts with(security_barrier=true) as
  select f.property_id,f.fact_key,f.value,f.source_label,f.observed_on,f.media_id,f.review_scope,f.reviewed_at,f.expires_at,
    case when f.review_status='reviewed' and f.expires_at<=now() then 'expired' else f.review_status end as review_status
  from public.bhk_listing_facts f join public.bhk_properties p on p.id=f.property_id
  where p.status='published' and p.bedrooms>=3;
create view public.bhk_public_listing_media with(security_barrier=true) as
  select m.* from public.bhk_listing_media m join public.bhk_properties p on p.id=m.property_id
  where p.status='published' and p.bedrooms>=3;
create view public.bhk_public_listing_occasions with(security_barrier=true) as
  select o.* from public.bhk_listing_occasions o join public.bhk_properties p on p.id=o.property_id
  where p.status='published' and p.bedrooms>=3;
grant select on public.bhk_public_listing_facts,public.bhk_public_listing_media,public.bhk_public_listing_occasions to anon,authenticated;
