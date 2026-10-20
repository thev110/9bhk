begin;
alter table public.bhk_service_requests drop constraint if exists bhk_service_requests_payment_status_check;
alter table public.bhk_service_requests add constraint bhk_service_requests_payment_status_check
  check(payment_status in ('pending','captured','refund_pending','refunded'));
create table public.bhk_service_payment_orders(
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null unique references public.bhk_service_requests(id),
  user_id uuid not null references auth.users(id),
  amount_paise bigint not null check(amount_paise between 1 and 200000000000),
  currency text not null default 'INR' check(currency='INR'),
  status text not null default 'creating' check(status in ('creating','ready','captured','review')),
  gateway_order_id text unique,
  primary_payment_id text unique,
  expires_at timestamptz not null default now()+interval '30 minutes',
  created_at timestamptz not null default now(),
  last_error text
);
create table public.bhk_service_captures(
  payment_id text primary key,
  payment_order_id uuid not null references public.bhk_service_payment_orders(id),
  amount_paise bigint not null check(amount_paise>0),
  currency text not null check(currency='INR'),
  captured_at timestamptz not null,
  disposition text not null check(disposition in ('applied','refund_due')),
  created_at timestamptz not null default now()
);
create table public.bhk_service_payment_events(
  event_key text primary key,
  payment_id text not null references public.bhk_service_captures(payment_id),
  created_at timestamptz not null default now()
);
create table public.bhk_service_refund_requests(
  id uuid primary key default gen_random_uuid(),
  payment_id text not null unique references public.bhk_service_captures(payment_id),
  service_request_id uuid not null references public.bhk_service_requests(id),
  amount_paise bigint not null check(amount_paise>0),
  reason text not null,
  status text not null default 'requested' check(status in ('requested','processing','processed','failed')),
  gateway_refund_id text unique,
  last_attempt_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
alter table public.bhk_service_payment_orders enable row level security;
alter table public.bhk_service_captures enable row level security;
alter table public.bhk_service_payment_events enable row level security;
alter table public.bhk_service_refund_requests enable row level security;
grant select on public.bhk_service_payment_orders,public.bhk_service_captures,public.bhk_service_refund_requests to authenticated;
grant all on public.bhk_service_payment_orders,public.bhk_service_captures,public.bhk_service_payment_events,public.bhk_service_refund_requests to service_role;
create policy service_order_read on public.bhk_service_payment_orders for select to authenticated using(user_id=auth.uid() or bhk_is_staff());
create policy service_capture_read on public.bhk_service_captures for select to authenticated using(
  exists(select 1 from bhk_service_payment_orders o where o.id=payment_order_id and o.user_id=auth.uid()) or bhk_is_staff());
create policy service_refund_read on public.bhk_service_refund_requests for select to authenticated using(
  exists(select 1 from bhk_service_requests r where r.id=service_request_id and r.guest_id=auth.uid()) or bhk_is_staff());

create function public.bhk_claim_service_order(p_user uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare request bhk_service_requests; saved bhk_service_payment_orders;
begin
  select * into request from bhk_service_requests where id=p_request and guest_id=p_user for update;
  if not found or request.status not in ('accepted','confirmed') or request.payment_status<>'pending'
    or not request.host_approved or request.quote_paise is null or request.ends_on<=(now() at time zone 'Asia/Kolkata')::date then
    raise exception 'An unpaid accepted service request is required';
  end if;
  if not exists(select 1 from bhk_bookings where id=request.booking_id and status='confirmed')
    or not exists(select 1 from bhk_service_providers where user_id=request.provider_id and review_status='approved') then
    raise exception 'Service or stay booking is unavailable';
  end if;
  select * into saved from bhk_service_payment_orders where service_request_id=p_request for update;
  if found then
    if saved.expires_at<=now() then raise exception 'Checkout expired; cancel and request a new service quote'; end if;
    if saved.status='creating' then raise exception 'Checkout initialization needs reconciliation; do not start another payment'; end if;
    if saved.status<>'ready' then raise exception 'Payment already received or awaiting review'; end if;
    return to_jsonb(saved);
  end if;
  insert into bhk_service_payment_orders(service_request_id,user_id,amount_paise)
    values(request.id,p_user,request.quote_paise) returning * into saved;
  return to_jsonb(saved);
end $$;
create function public.bhk_bind_service_order(p_intent uuid,p_gateway text)
returns void language plpgsql security definer set search_path=public as $$
declare saved bhk_service_payment_orders;
begin
  if p_gateway is null or p_gateway !~ '^order_[A-Za-z0-9]+$' then raise exception 'Invalid provider order'; end if;
  select * into saved from bhk_service_payment_orders where id=p_intent for update;
  if not found then raise exception 'Service order not found'; end if;
  if saved.gateway_order_id=p_gateway then return; end if;
  if saved.status<>'creating' or saved.gateway_order_id is not null then raise exception 'Service order already bound'; end if;
  update bhk_service_payment_orders set gateway_order_id=p_gateway,status='ready',last_error=null where id=saved.id;
end $$;
create function public.bhk_queue_service_refunds(p_request uuid,p_reason text)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into bhk_service_refund_requests(payment_id,service_request_id,amount_paise,reason)
    select c.payment_id,p_request,c.amount_paise,p_reason from bhk_service_captures c join bhk_service_payment_orders o on o.id=c.payment_order_id
      where o.service_request_id=p_request on conflict(payment_id) do nothing;
  if exists(select 1 from bhk_service_refund_requests where service_request_id=p_request) then
    update bhk_service_requests set payment_status=case when exists(select 1 from bhk_service_refund_requests where service_request_id=p_request and status<>'processed')
      then 'refund_pending' else 'refunded' end where id=p_request;
  end if;
end $$;
create function public.bhk_capture_service_payment(p_order text,p_payment text,p_amount bigint,p_currency text,p_event text,p_captured_at timestamptz)
returns jsonb language plpgsql security definer set search_path=public as $$
declare saved bhk_service_payment_orders; request bhk_service_requests; capture bhk_service_captures; refund_due boolean; prior_event text;
begin
  if p_payment is null or p_payment !~ '^pay_[A-Za-z0-9]+$' or p_event is null or length(p_event) not between 1 and 200
    or p_captured_at is null or not isfinite(p_captured_at) then raise exception 'Invalid captured payment'; end if;
  select * into saved from bhk_service_payment_orders where gateway_order_id=p_order;
  if not found then raise exception 'Service order reconciliation required'; end if;
  select * into request from bhk_service_requests where id=saved.service_request_id for update;
  select * into saved from bhk_service_payment_orders where id=saved.id for update;
  if p_amount is distinct from saved.amount_paise or p_currency is distinct from saved.currency then raise exception 'Captured amount does not match service order'; end if;
  select payment_id into prior_event from bhk_service_payment_events where event_key=p_event;
  if found and prior_event<>p_payment then raise exception 'Event was already used by a different payment'; end if;
  select * into capture from bhk_service_captures where payment_id=p_payment;
  if found then
    if capture.payment_order_id<>saved.id or capture.amount_paise<>p_amount or capture.currency<>p_currency then raise exception 'Payment was already reconciled to another order'; end if;
    insert into bhk_service_payment_events(event_key,payment_id) values(p_event,p_payment) on conflict(event_key) do nothing;
    return jsonb_build_object('status',request.status,'paymentStatus',request.payment_status,'disposition',capture.disposition,'serviceRequestId',request.id);
  end if;
  refund_due:=saved.primary_payment_id is not null or request.status not in ('accepted','confirmed')
    or request.payment_status<>'pending' or saved.expires_at<=now()
    or request.ends_on<=(now() at time zone 'Asia/Kolkata')::date
    or not exists(select 1 from bhk_bookings where id=request.booking_id and status='confirmed')
    or not exists(select 1 from bhk_service_providers where user_id=request.provider_id and review_status='approved');
  insert into bhk_service_captures(payment_id,payment_order_id,amount_paise,currency,captured_at,disposition)
    values(p_payment,saved.id,p_amount,p_currency,p_captured_at,case when refund_due then 'refund_due' else 'applied' end);
  insert into bhk_service_payment_events(event_key,payment_id) values(p_event,p_payment);
  if refund_due then
    insert into bhk_service_refund_requests(payment_id,service_request_id,amount_paise,reason)
      values(p_payment,request.id,p_amount,case when saved.primary_payment_id is not null then 'Additional captured payment' else 'Late or unavailable service capture' end);
    if saved.primary_payment_id is null then
      update bhk_service_payment_orders set status='review',primary_payment_id=p_payment where id=saved.id;
      update bhk_service_requests set status='cancelled',cancellation_reason='Payment captured after service checkout expired or became unavailable',payment_status='refund_pending' where id=request.id;
    elsif request.status='cancelled' then
      update bhk_service_requests set payment_status='refund_pending' where id=request.id;
    end if;
  else
    update bhk_service_payment_orders set status='captured',primary_payment_id=p_payment where id=saved.id;
    update bhk_service_requests set payment_status='captured' where id=request.id;
  end if;
  select * into request from bhk_service_requests where id=request.id;
  return jsonb_build_object('status',request.status,'paymentStatus',request.payment_status,
    'disposition',case when refund_due then 'refund_due' else 'applied' end,'serviceRequestId',request.id);
end $$;
create function public.bhk_service_payment_transition_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='completed' and old.status<>'completed' and new.payment_status<>'captured' then raise exception 'Captured service payment required before completion'; end if;
  return new;
end $$;
create trigger service_completion_payment before update of status on public.bhk_service_requests for each row execute function public.bhk_service_payment_transition_guard();
create function public.bhk_cancelled_service_refund()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='cancelled' and old.status<>'cancelled' then perform bhk_queue_service_refunds(new.id,'Service cancelled'); end if;
  return new;
end $$;
create trigger cancelled_service_refund after update of status on public.bhk_service_requests for each row execute function public.bhk_cancelled_service_refund();

create function public.bhk_claim_service_refund(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare refund bhk_service_refund_requests;
begin
  select * into refund from bhk_service_refund_requests where id=p_id for update;
  if not found then raise exception 'Service refund not found'; end if;
  if refund.status='processed' then return jsonb_build_object('done',true,'refundId',refund.gateway_refund_id); end if;
  if refund.status='processing' and refund.last_attempt_at>now()-interval '2 minutes' then raise exception 'Refund is already processing'; end if;
  update bhk_service_refund_requests set status='processing',last_attempt_at=now(),last_error=null where id=p_id;
  return jsonb_build_object('done',false,'paymentId',refund.payment_id,'amountPaise',refund.amount_paise,'gatewayRefundId',refund.gateway_refund_id);
end $$;
create function public.bhk_record_service_refund(p_id uuid,p_gateway text,p_payment text,p_amount bigint,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare refund bhk_service_refund_requests; request bhk_service_requests;
begin
  select r.* into request from bhk_service_requests r join bhk_service_refund_requests f on f.service_request_id=r.id where f.id=p_id for update of r;
  select * into refund from bhk_service_refund_requests where id=p_id for update;
  if not found or p_gateway is null or p_gateway !~ '^rfnd_[A-Za-z0-9]+$'
    or p_payment is distinct from refund.payment_id or p_amount is distinct from refund.amount_paise
    or p_status is null or p_status not in ('created','pending','processed','failed')
    or (refund.gateway_refund_id is not null and refund.gateway_refund_id<>p_gateway) then raise exception 'Refund response does not match the service obligation'; end if;
  if refund.status='processed' then return; end if;
  update bhk_service_refund_requests set gateway_refund_id=p_gateway,status=case when p_status in ('created','pending') then 'processing' else p_status end,last_error=null where id=p_id;
  if request.status='cancelled' then
    update bhk_service_requests set payment_status=case when exists(select 1 from bhk_service_refund_requests where service_request_id=request.id and status<>'processed')
      then 'refund_pending' else 'refunded' end where id=request.id;
  end if;
end $$;
revoke all on function public.bhk_service_payment_transition_guard(),public.bhk_cancelled_service_refund(),
  public.bhk_claim_service_order(uuid,uuid),public.bhk_bind_service_order(uuid,text),public.bhk_queue_service_refunds(uuid,text),
  public.bhk_capture_service_payment(text,text,bigint,text,text,timestamptz),public.bhk_claim_service_refund(uuid),
  public.bhk_record_service_refund(uuid,text,text,bigint,text) from public, anon, authenticated;
grant execute on function public.bhk_claim_service_order(uuid,uuid),public.bhk_bind_service_order(uuid,text),
  public.bhk_capture_service_payment(text,text,bigint,text,text,timestamptz),public.bhk_claim_service_refund(uuid),
  public.bhk_record_service_refund(uuid,text,text,bigint,text) to service_role;
create function public.bhk_expire_service_checkouts(p_limit integer default 100)
returns integer language plpgsql security definer set search_path=public as $$
declare request bhk_service_requests; expired integer:=0;
begin
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'Choose 1-100 service checkouts'; end if;
  for request in select r.* from bhk_service_requests r left join bhk_service_payment_orders o on o.service_request_id=r.id
    where r.status in ('accepted','confirmed') and r.payment_status='pending'
      and coalesce(o.expires_at,r.accepted_at+interval '30 minutes')<=now()
    order by r.accepted_at limit p_limit for update of r skip locked loop
    update bhk_service_requests set status='cancelled',cancellation_reason='Service payment window expired' where id=request.id;
    expired:=expired+1;
  end loop;
  return expired;
end $$;
revoke all on function public.bhk_expire_service_checkouts(integer) from public, anon, authenticated;
grant execute on function public.bhk_expire_service_checkouts(integer) to service_role;
create table public.bhk_service_payouts(
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null unique references public.bhk_service_requests(id),
  provider_id uuid not null references public.bhk_service_providers(user_id),
  amount_paise bigint not null check(amount_paise>0),
  status text not null default 'requested' check(status in ('requested','approved','processing','paid','failed','reversed')),
  approved_by uuid references auth.users(id),
  verification_reference text,
  fund_account_id text check(fund_account_id ~ '^fa_[A-Za-z0-9]+$'),
  source_account text,
  mode text check(mode in ('NEFT','IMPS','RTGS')),
  gateway_id text unique,
  provider_status text,
  dispatch_after timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.bhk_service_payouts enable row level security;
grant select on public.bhk_service_payouts to authenticated;
grant all on public.bhk_service_payouts to service_role;
create policy service_payout_read on public.bhk_service_payouts for select to authenticated using(provider_id=auth.uid() or bhk_is_staff());
create function public.bhk_assert_service_payout(p_request uuid,p_provider uuid,p_amount bigint)
returns void language plpgsql security definer set search_path=public as $$
declare request bhk_service_requests; payment bhk_service_payment_orders;
begin
  select * into request from bhk_service_requests where id=p_request for update;
  if not found or request.provider_id is distinct from p_provider or request.status<>'completed' or request.payment_status<>'captured'
    or request.quote_paise is distinct from p_amount then raise exception 'Completed paid service and agreed amount required'; end if;
  select * into payment from bhk_service_payment_orders where service_request_id=p_request;
  if not found or payment.status<>'captured' or payment.amount_paise<>p_amount or not exists(
    select 1 from bhk_service_captures c where c.payment_id=payment.primary_payment_id and c.disposition='applied' and c.amount_paise=p_amount)
    or exists(select 1 from bhk_service_refund_requests where service_request_id=p_request and (payment_id=payment.primary_payment_id or status<>'processed')) then
    raise exception 'Service captures or refunds require reconciliation';
  end if;
end $$;
create function public.bhk_request_service_payout(p_request uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare request bhk_service_requests; result uuid;
begin
  select * into request from bhk_service_requests where id=p_request and provider_id=auth.uid() for update;
  if not found then raise exception 'Provider service not found'; end if;
  perform bhk_assert_service_payout(request.id,auth.uid(),request.quote_paise);
  insert into bhk_service_payouts(service_request_id,provider_id,amount_paise) values(request.id,auth.uid(),request.quote_paise)
    on conflict(service_request_id) do nothing;
  select id into result from bhk_service_payouts where service_request_id=request.id;
  return result;
end $$;
create function public.bhk_approve_service_payout(p_id uuid,p_amount bigint,p_fund text,p_verification text,p_mode text)
returns void language plpgsql security definer set search_path=public as $$
declare payout bhk_service_payouts;
begin
  if not coalesce(bhk_is_staff(),false) then raise exception 'Staff approval required'; end if;
  select * into payout from bhk_service_payouts where id=p_id for update;
  if not found or payout.provider_id=auth.uid() or payout.status<>'requested' or payout.amount_paise is distinct from p_amount then raise exception 'Independent approval of unchanged payout required'; end if;
  if p_fund is null or p_fund !~ '^fa_[A-Za-z0-9]+$' or p_mode is null or p_mode not in ('NEFT','IMPS','RTGS')
    or p_verification is null or length(trim(p_verification)) not between 10 and 1000 then raise exception 'Verified destination and full quoted-amount settlement reference required'; end if;
  perform bhk_assert_service_payout(payout.service_request_id,payout.provider_id,payout.amount_paise);
  update bhk_service_payouts set status='approved',approved_by=auth.uid(),fund_account_id=p_fund,verification_reference=p_verification,mode=p_mode where id=p_id;
end $$;
create function public.bhk_claim_service_payout(p_id uuid,p_source text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare payout bhk_service_payouts;
begin
  select * into payout from bhk_service_payouts where id=p_id for update;
  if not found or payout.status not in ('approved','processing','paid') then raise exception 'Approved service payout required'; end if;
  if payout.status='paid' then return jsonb_build_object('done',true,'gatewayId',payout.gateway_id); end if;
  if payout.dispatch_after>now() then raise exception 'Service payout in progress'; end if;
  if p_source is null or length(p_source) not between 4 and 100 or (payout.source_account is not null and payout.source_account<>p_source) then raise exception 'Payout source changed'; end if;
  perform bhk_assert_service_payout(payout.service_request_id,payout.provider_id,payout.amount_paise);
  update bhk_service_payouts set source_account=p_source,status='processing',dispatch_after=now()+interval '2 minutes',attempts=attempts+1 where id=p_id;
  return jsonb_build_object('done',false,'amountPaise',payout.amount_paise,'fundAccountId',payout.fund_account_id,'mode',payout.mode,'gatewayId',payout.gateway_id);
end $$;
create function public.bhk_record_service_payout(p_id uuid,p_gateway text,p_fund text,p_amount bigint,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare payout bhk_service_payouts;
begin
  select * into payout from bhk_service_payouts where id=p_id for update;
  if not found or payout.approved_by is null or p_gateway is null or p_gateway !~ '^pout_[A-Za-z0-9]+$'
    or (payout.gateway_id is not null and payout.gateway_id<>p_gateway) or p_fund is distinct from payout.fund_account_id or p_amount is distinct from payout.amount_paise
    or p_status is null or p_status not in ('queued','pending','processing','processed','rejected','cancelled','reversed','failed') then raise exception 'Service payout provider mismatch'; end if;
  if payout.status in ('failed','reversed') then return; end if;
  if payout.status='paid' and p_status not in ('reversed','failed') then return; end if;
  update bhk_service_payouts set gateway_id=p_gateway,provider_status=p_status,
    status=case p_status when 'processed' then 'paid' when 'reversed' then 'reversed' when 'failed' then 'failed' when 'rejected' then 'failed' when 'cancelled' then 'failed' else 'processing' end,
    dispatch_after=now()+interval '5 minutes' where id=p_id;
end $$;
revoke all on function public.bhk_assert_service_payout(uuid,uuid,bigint),public.bhk_request_service_payout(uuid),
  public.bhk_approve_service_payout(uuid,bigint,text,text,text),public.bhk_claim_service_payout(uuid,text),
  public.bhk_record_service_payout(uuid,text,text,bigint,text) from public, anon, authenticated;
grant execute on function public.bhk_request_service_payout(uuid),public.bhk_approve_service_payout(uuid,bigint,text,text,text) to authenticated;
grant execute on function public.bhk_claim_service_payout(uuid,text),public.bhk_record_service_payout(uuid,text,text,bigint,text) to service_role;
commit;
