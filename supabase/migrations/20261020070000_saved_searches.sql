begin;
create table public.bhk_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 1 and 100),
  city text not null check(char_length(trim(city)) between 1 and 100),
  check_in date not null,
  check_out date not null,
  adults integer not null check(adults between 1 and 10000),
  children integer not null default 0 check(children between 0 and 10000),
  min_bedrooms integer not null default 3 check(min_bedrooms between 3 and 100),
  max_total_paise bigint not null check(max_total_paise between 1 and 200000000000),
  required_features text[] not null default '{}' check(required_features <@ array['pool_fenced','step_free_access','pet_facilities','workspace']::text[] and cardinality(required_features)<=4),
  enabled boolean not null default true,
  revision integer not null default 1,
  scan_after text,
  last_checked_at timestamptz,
  next_check_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check(check_out>check_in and check_out-check_in<=90)
);
create table public.bhk_saved_search_matches (
  search_id uuid not null references public.bhk_saved_searches(id) on delete cascade,
  property_id text not null references public.bhk_properties(id) on delete cascade,
  lowest_alerted_paise bigint not null,
  fingerprint text not null,
  checked_at timestamptz not null default now(),
  primary key(search_id,property_id)
);
alter table public.bhk_saved_searches enable row level security;
alter table public.bhk_saved_search_matches enable row level security;
-- Supabase grants ALL to anon/authenticated by default; start from zero so the
-- column-level grants below are the only write paths.
revoke all on public.bhk_saved_searches,public.bhk_saved_search_matches from anon,authenticated;
grant select,delete on public.bhk_saved_searches to authenticated;
grant insert(user_id,name,city,check_in,check_out,adults,children,min_bedrooms,max_total_paise,required_features,enabled),
  update(name,city,check_in,check_out,adults,children,min_bedrooms,max_total_paise,required_features,enabled) on public.bhk_saved_searches to authenticated;
grant select on public.bhk_saved_search_matches to authenticated;
grant all on public.bhk_saved_searches,public.bhk_saved_search_matches to service_role;
create policy saved_search_own on public.bhk_saved_searches to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy saved_matches_own on public.bhk_saved_search_matches for select to authenticated
  using(exists(select 1 from public.bhk_saved_searches s where s.id=search_id and s.user_id=auth.uid()));
create index saved_search_due on public.bhk_saved_searches(next_check_at) where enabled;

create function public.bhk_saved_search_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,7700));
    if (select count(*) from bhk_saved_searches where user_id=new.user_id)>=20 then raise exception 'You can save up to 20 searches'; end if;
    if new.check_in<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Choose future stay dates'; end if;
    return new;
  end if;
  if tg_op='DELETE' then
    update bhk_notification_outbox set status='suppressed' where user_id=old.user_id and status='pending' and event_key like 'saved-search:'||old.id::text||':%';
    return old;
  end if;
  if row(new.city,new.check_in,new.check_out,new.adults,new.children,new.min_bedrooms,new.max_total_paise,new.required_features)
    is distinct from row(old.city,old.check_in,old.check_out,old.adults,old.children,old.min_bedrooms,old.max_total_paise,old.required_features) then
    if new.check_in<(now() at time zone 'Asia/Kolkata')::date then raise exception 'Choose future stay dates'; end if;
    new.revision:=old.revision+1; new.scan_after:=null; new.next_check_at:=now();
    delete from bhk_saved_search_matches where search_id=new.id;
    update bhk_notification_outbox set status='suppressed' where user_id=old.user_id and status='pending' and event_key like 'saved-search:'||old.id::text||':%';
  end if;
  if not new.enabled then
    update bhk_notification_outbox set status='suppressed' where user_id=old.user_id and status='pending' and event_key like 'saved-search:'||old.id::text||':%';
  elsif not old.enabled then
    new.next_check_at:=now(); new.scan_after:=null;
  end if;
  return new;
end;
$$;
revoke all on function public.bhk_saved_search_change() from public, anon, authenticated;
create trigger saved_search_change before insert or update or delete on public.bhk_saved_searches
  for each row execute function public.bhk_saved_search_change();

create function public.bhk_match_saved_searches(p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path=public as $$
declare search bhk_saved_searches; listing record; previous bhk_saved_search_matches; quote jsonb;
  total_paise bigint; fingerprint_value text; scanned integer; searches integer:=0; queued integer:=0; last_id text;
begin
  if p_limit is null or p_limit not between 1 and 20 then raise exception 'Choose 1-20 searches'; end if;
  for search in select * from bhk_saved_searches where enabled and next_check_at<=now()
    order by next_check_at,id limit p_limit for update skip locked loop
    searches:=searches+1;
    if search.check_in<(now() at time zone 'Asia/Kolkata')::date then
      update bhk_saved_searches set enabled=false,last_checked_at=now() where id=search.id;
      continue;
    end if;
    scanned:=0; last_id:=null;
    -- Cursor advances through bounded batches, so a large city's later listings
    -- are eventually considered instead of repeatedly checking its first page.
    for listing in select p.id,p.name from bhk_properties p where p.status='published' and p.bedrooms>=search.min_bedrooms
      and lower(trim(p.city))=lower(trim(search.city)) and p.guests>=search.adults+search.children
      and (search.scan_after is null or p.id>search.scan_after)
      and not exists(select 1 from unnest(search.required_features) requested where not exists(
        select 1 from bhk_listing_facts f where f.property_id=p.id and f.fact_key=requested and f.value='true'::jsonb
          and f.review_status='reviewed' and f.expires_at>now() and f.media_id is not null))
      order by p.id limit 50 loop
      scanned:=scanned+1; last_id:=listing.id;
      begin
        quote:=bhk_stay_quote(listing.id,search.check_in,search.check_out,search.adults,search.children);
      exception when raise_exception then continue;
      end;
      total_paise:=(quote->>'total')::bigint*100;
      if total_paise>search.max_total_paise then continue; end if;
      select * into previous from bhk_saved_search_matches where search_id=search.id and property_id=listing.id;
      fingerprint_value:=md5(listing.id||':'||search.revision::text||':'||search.check_in::text||':'||search.check_out::text||':'||total_paise::text);
      -- Only a first match or a new low price alerts; oscillations do not spam.
      if previous.search_id is null or total_paise<previous.lowest_alerted_paise then
        insert into bhk_notification_outbox(user_id,event_key,category,title,body,href,expires_at)
          values(search.user_id,'saved-search:'||search.id::text||':'||search.revision::text||':'||fingerprint_value,'marketing',
            case when previous.search_id is null then 'New saved-search match' else 'Lower price for a saved match' end,
            left(listing.name,200)||' matches '||search.name||' for '||search.check_in::text||' to '||search.check_out::text||
            '. Trip total INR '||(total_paise/100)::text||', including deposit. Availability and price may change; optional extras are excluded.',
            '/search',least(now()+interval '1 day',(search.check_in+1)::timestamp at time zone 'Asia/Kolkata'))
          on conflict(user_id,event_key) do nothing;
        if found then queued:=queued+1; end if;
        insert into bhk_saved_search_matches(search_id,property_id,lowest_alerted_paise,fingerprint)
          values(search.id,listing.id,total_paise,fingerprint_value)
          on conflict(search_id,property_id) do update set lowest_alerted_paise=excluded.lowest_alerted_paise,fingerprint=excluded.fingerprint,checked_at=now();
      else
        update bhk_saved_search_matches set checked_at=now() where search_id=search.id and property_id=listing.id;
      end if;
    end loop;
    update bhk_saved_searches set scan_after=case when scanned=50 then last_id else null end,
      last_checked_at=now(),next_check_at=now()+interval '15 minutes' where id=search.id;
  end loop;
  return jsonb_build_object('searches',searches,'queued',queued);
end;
$$;
revoke all on function public.bhk_match_saved_searches(integer) from public,anon,authenticated;
grant execute on function public.bhk_match_saved_searches(integer) to service_role;
commit;
