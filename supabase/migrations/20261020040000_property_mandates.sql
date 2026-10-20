begin;
-- Mandates grant named capabilities only. They do not grant SELECT on properties/documents.
create table public.bhk_property_mandates (
 id uuid primary key default gen_random_uuid(), property_id text not null references public.bhk_properties(id) on delete cascade,
 owner_id uuid not null references auth.users(id), broker_id uuid not null references auth.users(id),
 capabilities text[] not null check(cardinality(capabilities)>0 and cardinality(capabilities)<=5 and capabilities <@ array['marketing','viewings','documents','offers','edit-proposal']::text[] and array_position(capabilities,null) is null),
 starts_at timestamptz not null, expires_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','revoked')),
 approved_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now(),
 check(owner_id<>broker_id), check(isfinite(starts_at) and isfinite(expires_at) and expires_at>starts_at)
);
create index bhk_mandates_broker on public.bhk_property_mandates(broker_id,property_id,status);
create index bhk_mandates_owner on public.bhk_property_mandates(owner_id,created_at);
alter table public.bhk_property_mandates enable row level security;
revoke all on public.bhk_property_mandates from anon,authenticated;
grant select on public.bhk_property_mandates to authenticated;
grant all on public.bhk_property_mandates to service_role;
create policy mandate_participant_read on public.bhk_property_mandates for select to authenticated using(owner_id=auth.uid() or broker_id=auth.uid());
create function public.bhk_request_mandate(p_property text,p_capabilities text[],p_start timestamptz,p_expiry timestamptz) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_owner uuid; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select host_id into v_owner from bhk_properties where id=p_property and status='published';
 if not found or v_owner is null or v_owner=auth.uid() then raise exception 'Property unavailable for mandate request'; end if;
 if not exists(select 1 from bhk_broker_subscriptions where user_id=auth.uid() and status='active' and expires_at>now()) then raise exception 'Active broker subscription required'; end if;
 if p_expiry<=now() then raise exception 'Mandate must expire in the future'; end if;
 insert into bhk_property_mandates(property_id,owner_id,broker_id,capabilities,starts_at,expires_at) values(p_property,v_owner,auth.uid(),p_capabilities,p_start,p_expiry) returning id into v_id;
 return v_id;
end $$;
create function public.bhk_decide_mandate(p_id uuid,p_approve boolean) returns void
language plpgsql security definer set search_path=public as $$
declare v_row bhk_property_mandates;
begin
 select m.* into v_row from bhk_property_mandates m join bhk_properties p on p.id=m.property_id where m.id=p_id and m.owner_id=auth.uid() and p.host_id=auth.uid() for update of m;
 if not found then raise exception 'Mandate unavailable'; end if;
 if v_row.status<>'pending' then raise exception 'Mandate already decided'; end if;
 if p_approve is null then raise exception 'Choose approve or reject'; end if;
 if p_approve and v_row.expires_at<=now() then raise exception 'Mandate has expired'; end if;
 update bhk_property_mandates set status=case when p_approve then 'approved' else 'rejected' end,approved_at=case when p_approve then now() else null end where id=p_id;
end $$;
create function public.bhk_revoke_mandate(p_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 update bhk_property_mandates m set status='revoked',revoked_at=coalesce(revoked_at,now()) where m.id=p_id and (m.owner_id=auth.uid() or m.broker_id=auth.uid()) and m.status in ('pending','approved','revoked');
 if not found then raise exception 'Mandate unavailable'; end if;
end $$;
-- Trusted server check: the caller must separately authenticate the supplied actor.
create function public.bhk_property_capability(p_actor uuid,p_property text,p_capability text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from bhk_property_mandates m join bhk_properties p on p.id=m.property_id where m.broker_id=p_actor and m.property_id=p_property and m.owner_id=p.host_id and m.status='approved' and m.starts_at<=now() and m.expires_at>now() and p_capability=any(m.capabilities))
$$;
create function public.bhk_my_property_capability(p_property text,p_capability text) returns boolean
language sql stable security definer set search_path=public as $$ select public.bhk_property_capability(auth.uid(),p_property,p_capability) $$;
revoke all on function public.bhk_request_mandate(text,text[],timestamptz,timestamptz),public.bhk_decide_mandate(uuid,boolean),public.bhk_revoke_mandate(uuid),public.bhk_property_capability(uuid,text,text),public.bhk_my_property_capability(text,text) from public,anon,authenticated;
grant execute on function public.bhk_request_mandate(text,text[],timestamptz,timestamptz),public.bhk_decide_mandate(uuid,boolean),public.bhk_revoke_mandate(uuid),public.bhk_my_property_capability(text,text) to authenticated;
grant execute on function public.bhk_property_capability(uuid,text,text) to service_role;
commit;
