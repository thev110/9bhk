begin;
create table public.bhk_portfolios(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  current_version integer not null default 1 check(current_version>0),
  created_at timestamptz not null default now()
);
create table public.bhk_portfolio_versions(
  portfolio_id uuid not null references public.bhk_portfolios(id) on delete cascade,
  version integer not null,
  title text not null check(length(trim(title)) between 1 and 150),
  broker_display_name text not null check(length(trim(broker_display_name)) between 1 and 150),
  agency_name text check(agency_name is null or length(trim(agency_name)) between 1 and 150),
  branding_status text not null default 'self_reported' check(branding_status='self_reported'),
  introduction text not null default '' check(length(introduction)<=2000),
  property_ids text[] not null check(cardinality(property_ids) between 1 and 20 and array_position(property_ids,null) is null),
  created_at timestamptz not null default now(),
  primary key(portfolio_id,version)
);
create table public.bhk_portfolio_grants(
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null,
  version integer not null,
  recipient_id uuid not null references auth.users(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(portfolio_id,version) references public.bhk_portfolio_versions(portfolio_id,version) on delete cascade,
  check(isfinite(expires_at)),
  unique(portfolio_id,version,recipient_id)
);
alter table public.bhk_portfolios enable row level security;
alter table public.bhk_portfolio_versions enable row level security;
alter table public.bhk_portfolio_grants enable row level security;
grant select on public.bhk_portfolios,public.bhk_portfolio_versions,public.bhk_portfolio_grants to authenticated;
grant all on public.bhk_portfolios,public.bhk_portfolio_versions,public.bhk_portfolio_grants to service_role;
create policy portfolios_owner on public.bhk_portfolios for select to authenticated using(owner_id=auth.uid());
create policy portfolio_versions_owner on public.bhk_portfolio_versions for select to authenticated
  using(exists(select 1 from bhk_portfolios p where p.id=portfolio_id and p.owner_id=auth.uid()));
create policy portfolio_grants_owner on public.bhk_portfolio_grants for select to authenticated
  using(exists(select 1 from bhk_portfolios p where p.id=portfolio_id and p.owner_id=auth.uid()));
create index portfolio_grants_recipient on public.bhk_portfolio_grants(recipient_id,expires_at) where revoked_at is null;

-- Internal assertion: even historical selections are never permission grants.
create function public.bhk_assert_portfolio_properties(p_owner uuid,p_properties text[])
returns void language plpgsql security definer set search_path=public as $$
declare property text;
begin
  if p_owner is null or cardinality(p_properties) is null or cardinality(p_properties) not between 1 and 20
    or array_position(p_properties,null) is not null or (select count(distinct id) from unnest(p_properties) id)<>cardinality(p_properties) then
    raise exception 'Choose 1-20 different public listings';
  end if;
  foreach property in array p_properties loop
    if not exists(select 1 from bhk_properties p where p.id=property and p.status='published' and p.bedrooms>=3
      and (p.host_id=p_owner or bhk_property_capability(p_owner,p.id,'marketing'))) then
      raise exception 'A selected listing is unavailable or its marketing authority has ended. Private broker inventory is not supported';
    end if;
  end loop;
end $$;
revoke all on function public.bhk_assert_portfolio_properties(uuid,text[]) from public;

create function public.bhk_save_portfolio(p_id uuid,p_title text,p_display_name text,p_agency text,p_intro text,p_properties text[])
returns uuid language plpgsql security definer set search_path=public as $$
declare portfolio bhk_portfolios; result uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform bhk_assert_portfolio_properties(auth.uid(),p_properties);
  if p_id is null then
    perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,14000));
    if (select count(*) from bhk_portfolios where owner_id=auth.uid())>=50 then raise exception 'Portfolio limit reached'; end if;
    insert into bhk_portfolios(owner_id) values(auth.uid()) returning * into portfolio;
  else
    select * into portfolio from bhk_portfolios where id=p_id and owner_id=auth.uid() for update;
    if not found then raise exception 'Portfolio not found'; end if;
    update bhk_portfolios set current_version=current_version+1 where id=p_id returning * into portfolio;
    update bhk_portfolio_grants set revoked_at=coalesce(revoked_at,now()) where portfolio_id=p_id and revoked_at is null;
  end if;
  insert into bhk_portfolio_versions(portfolio_id,version,title,broker_display_name,agency_name,introduction,property_ids)
    values(portfolio.id,portfolio.current_version,p_title,p_display_name,nullif(trim(p_agency),''),coalesce(p_intro,''),p_properties);
  return portfolio.id;
end $$;
create function public.bhk_share_portfolio(p_portfolio uuid,p_recipient uuid,p_expires timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$
declare portfolio bhk_portfolios; selected text[]; result uuid;
begin
  select * into portfolio from bhk_portfolios where id=p_portfolio and owner_id=auth.uid() for update;
  if not found then raise exception 'Portfolio not found'; end if;
  if p_recipient is null or p_recipient=auth.uid() or p_expires is null or not isfinite(p_expires) or p_expires<=now() or p_expires>now()+interval '30 days' then
    raise exception 'Choose an authenticated recipient and expiry within 30 days';
  end if;
  select property_ids into selected from bhk_portfolio_versions where portfolio_id=portfolio.id and version=portfolio.current_version;
  perform bhk_assert_portfolio_properties(portfolio.owner_id,selected);
  insert into bhk_portfolio_grants(portfolio_id,version,recipient_id,expires_at)
    values(portfolio.id,portfolio.current_version,p_recipient,p_expires)
    on conflict(portfolio_id,version,recipient_id) do update set expires_at=excluded.expires_at,revoked_at=null,created_at=now()
    returning id into result;
  return result;
end $$;
create function public.bhk_revoke_portfolio_share(p_grant uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update bhk_portfolio_grants g set revoked_at=coalesce(g.revoked_at,now()) where g.id=p_grant
    and exists(select 1 from bhk_portfolios p where p.id=g.portfolio_id and p.owner_id=auth.uid());
  if not found then raise exception 'Share not found'; end if;
end $$;
create function public.bhk_read_portfolio(p_portfolio uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare portfolio bhk_portfolios; version_row bhk_portfolio_versions; properties jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to view this portfolio'; end if;
  select * into portfolio from bhk_portfolios where id=p_portfolio;
  if not found then raise exception 'Portfolio unavailable'; end if;
  if portfolio.owner_id<>auth.uid() and not exists(select 1 from bhk_portfolio_grants g where g.portfolio_id=portfolio.id
    and g.version=portfolio.current_version and g.recipient_id=auth.uid() and g.revoked_at is null and g.expires_at>now()) then
    raise exception 'Portfolio invitation expired or revoked';
  end if;
  select * into version_row from bhk_portfolio_versions where portfolio_id=portfolio.id and version=portfolio.current_version;
  perform bhk_assert_portfolio_properties(portfolio.owner_id,version_row.property_ids);
  -- Use only the established public projection, never the underlying property row.
  select jsonb_agg(to_jsonb(p) order by ids.position) into properties
    from unnest(version_row.property_ids) with ordinality ids(id,position)
    join bhk_public_properties p on p.id=ids.id;
  return jsonb_build_object('id',portfolio.id,'version',portfolio.current_version,'title',version_row.title,
    'brokerDisplayName',version_row.broker_display_name,'agencyName',version_row.agency_name,'brandingStatus','self_reported',
    'introduction',version_row.introduction,'properties',properties);
end $$;
revoke all on function public.bhk_save_portfolio(uuid,text,text,text,text,text[]),public.bhk_share_portfolio(uuid,uuid,timestamptz),
  public.bhk_revoke_portfolio_share(uuid),public.bhk_read_portfolio(uuid) from public;
grant execute on function public.bhk_save_portfolio(uuid,text,text,text,text,text[]),public.bhk_share_portfolio(uuid,uuid,timestamptz),
  public.bhk_revoke_portfolio_share(uuid),public.bhk_read_portfolio(uuid) to authenticated;
commit;
