begin;
alter table bhk_payout_requests drop constraint bhk_payout_requests_status_check;
alter table bhk_payout_requests add constraint bhk_payout_requests_status_check
check(status in ('requested','approved','processing','paid','rejected','failed','reversed'));
create table public.bhk_payout_transfers(
  request_id uuid primary key references bhk_payout_requests(id),
  approved_by uuid not null references auth.users(id),
  fund_account_id text not null check(fund_account_id ~ '^fa_[A-Za-z0-9]+$'),
  verification_reference text not null check(length(trim(verification_reference)) between 10 and 500),
  source_account text,
  mode text not null check(mode in ('NEFT','IMPS','RTGS')),
  gateway_id text unique,
  provider_status text,
  dispatch_after timestamptz,
  attempts integer not null default 0,
  approved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table bhk_payout_transfers enable row level security;
grant select on bhk_payout_transfers to authenticated;
grant all on bhk_payout_transfers to service_role;
create policy payout_transfers_staff on bhk_payout_transfers for select to authenticated using(bhk_is_staff());
create function public.bhk_approve_payout(p_id uuid,p_amount integer,p_fund text,p_verification text,p_mode text) returns void
language plpgsql security definer set search_path=public as $$
declare payout bhk_payout_requests;
begin
  if not bhk_is_staff() then raise exception 'Staff approval required'; end if;
  select * into payout from bhk_payout_requests where id=p_id for update;
  if not found or payout.status<>'requested' or payout.amount is distinct from p_amount then raise exception 'Payout unavailable or changed'; end if;
  if exists(select 1 from bhk_bookings where id=any(payout.booking_ids) and
    (host_id is distinct from payout.host_id or status<>'completed' or checkout_at>now() or payment_status<>'paid' or refund_status<>'none')) then raise exception 'Bookings require reconciliation'; end if;
  insert into bhk_payout_transfers(request_id,approved_by,fund_account_id,verification_reference,mode)
    values(p_id,auth.uid(),p_fund,p_verification,p_mode);
  update bhk_payout_requests set status='approved' where id=p_id;
end $$;
create function public.bhk_claim_payout(p_id uuid,p_source text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare payout bhk_payout_requests; transfer bhk_payout_transfers; reconciled bigint;
begin
  select * into payout from bhk_payout_requests where id=p_id for update;
  if not found or payout.status not in ('approved','processing','paid') then raise exception 'Payout is not approved for dispatch'; end if;
  select * into transfer from bhk_payout_transfers where request_id=p_id for update;
  if not found then raise exception 'Payout destination has not been approved'; end if;
  if payout.status='paid' then return jsonb_build_object('done',true,'gatewayId',transfer.gateway_id); end if;
  if transfer.dispatch_after>now() then raise exception 'Payout in progress; retry later'; end if;
  if p_source is null or length(p_source) not between 4 and 100 or (transfer.source_account is not null and transfer.source_account<>p_source) then raise exception 'Payout source changed; reconcile existing transfer'; end if;
  perform 1 from bhk_bookings where id=any(payout.booking_ids) order by id for update;
  if exists(select 1 from bhk_bookings where id=any(payout.booking_ids) and
    (host_id is distinct from payout.host_id or status<>'completed' or checkout_at>now() or payment_status<>'paid' or refund_status<>'none')) then raise exception 'Bookings require reconciliation'; end if;
  select sum(total-coalesce((quote->>'tax')::integer,0)-coalesce((quote->>'platformFee')::integer,0)-coalesce((quote->>'deposit')::integer,0))
    into reconciled from bhk_bookings where id=any(payout.booking_ids);
  if reconciled is distinct from payout.amount::bigint then raise exception 'Payout amount requires reconciliation'; end if;
  update bhk_payout_transfers set source_account=p_source,attempts=attempts+1,dispatch_after=now()+interval '2 minutes',updated_at=now() where request_id=p_id;
  update bhk_payout_requests set status='processing' where id=p_id;
  return jsonb_build_object('done',false,'amountPaise',payout.amount::bigint*100,'fundAccountId',transfer.fund_account_id,'mode',transfer.mode,'gatewayId',transfer.gateway_id);
end $$;
create function public.bhk_record_payout(p_id uuid,p_gateway text,p_fund text,p_amount bigint,p_status text) returns void
language plpgsql security definer set search_path=public as $$
declare payout bhk_payout_requests; transfer bhk_payout_transfers;
begin
  select * into payout from bhk_payout_requests where id=p_id for update;
  select * into transfer from bhk_payout_transfers where request_id=p_id for update;
  if payout.id is null or transfer.request_id is null or p_gateway is null or p_gateway !~ '^pout_[A-Za-z0-9]+$'
    or (transfer.gateway_id is not null and transfer.gateway_id<>p_gateway) or p_fund is distinct from transfer.fund_account_id
    or p_amount is distinct from payout.amount::bigint*100 or p_status is null
    or p_status not in ('queued','pending','processing','processed','rejected','cancelled','reversed','failed') then raise exception 'Payout provider mismatch'; end if;
  -- Do not regress terminal state on older callbacks. Reversal is allowed after processed.
  if payout.status in ('failed','reversed') then return; end if;
  if payout.status='paid' and p_status not in ('reversed','failed') then return; end if;
  update bhk_payout_transfers set gateway_id=p_gateway,provider_status=p_status,updated_at=now(),dispatch_after=now()+interval '5 minutes' where request_id=p_id;
  update bhk_payout_requests set status=case p_status when 'processed' then 'paid' when 'reversed' then 'reversed'
    when 'failed' then 'failed' when 'rejected' then 'failed' when 'cancelled' then 'failed' else 'processing' end where id=p_id;
end $$;
revoke all on function bhk_approve_payout(uuid,integer,text,text,text),bhk_claim_payout(uuid,text),bhk_record_payout(uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function bhk_approve_payout(uuid,integer,text,text,text) to authenticated;
grant execute on function bhk_claim_payout(uuid,text),bhk_record_payout(uuid,text,text,bigint,text) to service_role;
commit;
