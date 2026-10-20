begin;
create table public.bhk_property_policy_versions(
  id uuid primary key default gen_random_uuid(),property_id text not null references bhk_properties(id),
  version integer not null,cancellation_terms text not null check(length(trim(cancellation_terms)) between 20 and 8000),
  deposit_terms text not null check(length(trim(deposit_terms)) between 20 and 8000),
  settlement_terms text not null check(length(trim(settlement_terms)) between 20 and 8000),
  approved_by uuid not null references auth.users(id),approved_at timestamptz not null default now(),
  unique(property_id,version)
);
alter table bhk_property_policy_versions enable row level security;
grant select on bhk_property_policy_versions to authenticated;
grant all on bhk_property_policy_versions to service_role;
create policy property_policies_owner_staff on bhk_property_policy_versions for select to authenticated
using(bhk_is_staff() or exists(select 1 from bhk_properties where id=property_id and host_id=auth.uid()));
create function public.bhk_approve_property_policy(p_property text,p_cancellation text,p_deposit text,p_settlement text) returns uuid
language plpgsql security definer set search_path=public as $$
declare revision integer; result uuid;
begin
  if not bhk_is_staff() then raise exception 'Staff policy approval required'; end if;
  perform 1 from bhk_properties where id=p_property for update;
  if not found then raise exception 'Property unavailable'; end if;
  select coalesce(max(version),0)+1 into revision from bhk_property_policy_versions where property_id=p_property;
  insert into bhk_property_policy_versions(property_id,version,cancellation_terms,deposit_terms,settlement_terms,approved_by)
  values(p_property,revision,p_cancellation,p_deposit,p_settlement,auth.uid()) returning id into result;
  return result;
end $$;
alter table bhk_bookings add column policy_snapshot jsonb not null default '{"status":"legacy_unreviewed"}'::jsonb;
create function public.bhk_snapshot_booking_terms() returns trigger language plpgsql security definer set search_path=public as $$
declare terms bhk_property_policy_versions; property bhk_properties;
begin
  if tg_op='UPDATE' then new.policy_snapshot:=old.policy_snapshot; return new; end if;
  select * into terms from bhk_property_policy_versions where property_id=new.property_id order by version desc limit 1;
  select * into property from bhk_properties where id=new.property_id;
  new.policy_snapshot:=jsonb_build_object('status',case when terms.id is null then 'unreviewed' else 'approved' end,
    'policyId',terms.id,'version',terms.version,'cancellationTerms',terms.cancellation_terms,
    'depositTerms',terms.deposit_terms,'settlementTerms',terms.settlement_terms,'approvedAt',terms.approved_at,
    'taxRate',property.tax_rate,'platformFeeRate',property.platform_fee_rate,'currency','INR','rounding','nearest whole rupee per calculated component');
  return new;
end $$;
create trigger booking_terms_snapshot before insert or update on bhk_bookings for each row execute function bhk_snapshot_booking_terms();
create function public.bhk_public_property_policy(p_property text) returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('version',v.version,'cancellationTerms',v.cancellation_terms,'depositTerms',v.deposit_terms,'approvedAt',v.approved_at)
  from bhk_property_policy_versions v join bhk_properties p on p.id=v.property_id
  where p.id=p_property and p.status='published' and p.bedrooms>=3 order by v.version desc limit 1
$$;
revoke all on function bhk_snapshot_booking_terms(),bhk_approve_property_policy(text,text,text,text),bhk_public_property_policy(text) from public,anon,authenticated;
grant execute on function bhk_approve_property_policy(text,text,text,text) to authenticated;
grant execute on function bhk_public_property_policy(text) to anon,authenticated;

-- Availability displayed in comparisons must account for the same conservative viewing windows as holds.
alter function bhk_stay_quote(text,date,date,integer,integer) rename to bhk_stay_quote_without_viewings;
create function public.bhk_stay_quote(p_property text,p_check_in date,p_check_out date,p_adults integer,p_children integer) returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  if exists(select 1 from bhk_viewing_appointments a where a.property_id=p_property and a.status in ('proposed','confirmed')
    and (a.starts_at at time zone 'Asia/Kolkata')::date<=p_check_out
    and ((a.ends_at-interval '1 microsecond') at time zone 'Asia/Kolkata')::date>=p_check_in) then
    raise exception 'Dates conflict with a property viewing';
  end if;
  return bhk_stay_quote_without_viewings(p_property,p_check_in,p_check_out,p_adults,p_children);
end $$;
revoke all on function bhk_stay_quote_without_viewings(text,date,date,integer,integer),bhk_stay_quote(text,date,date,integer,integer) from public,anon,authenticated,service_role;
grant execute on function bhk_stay_quote(text,date,date,integer,integer) to service_role;
commit;
