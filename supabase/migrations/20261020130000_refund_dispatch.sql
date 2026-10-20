begin;
alter table bhk_refund_requests add column approved_by uuid references auth.users(id),
  add column approved_at timestamptz, add column dispatch_after timestamptz,
  add column dispatch_attempts integer not null default 0,
  add column last_provider_status text, add column last_error text;
create table bhk_refund_audit(
  id uuid primary key default gen_random_uuid(),refund_id uuid not null references bhk_refund_requests(id),
  actor_id uuid references auth.users(id),event text not null,provider_id text,created_at timestamptz not null default now()
);
alter table bhk_refund_audit enable row level security;
grant select on bhk_refund_audit to authenticated;
grant all on bhk_refund_audit to service_role;
create policy refund_audit_staff on bhk_refund_audit for select to authenticated using(bhk_is_staff());
create function public.bhk_approve_refund(p_id uuid,p_expected_amount integer) returns void
language plpgsql security definer set search_path=public as $$
declare refund bhk_refund_requests; payment bhk_payment_orders;
begin
  if not bhk_is_staff() then raise exception 'Staff approval required'; end if;
  select * into refund from bhk_refund_requests where id=p_id for update;
  if not found or refund.amount is distinct from p_expected_amount then raise exception 'Refund unavailable or amount changed'; end if;
  if refund.approved_at is not null then return; end if;
  if refund.status<>'requested' then raise exception 'Refund is not awaiting approval'; end if;
  select * into payment from bhk_payment_orders where id=refund.payment_order_id for update;
  if payment.payment_id is null or payment.captured_at is null or refund.amount::bigint*100>payment.amount_paise then raise exception 'Captured payment does not support this refund'; end if;
  update bhk_refund_requests set approved_by=auth.uid(),approved_at=now(),dispatch_after=now() where id=p_id;
  insert into bhk_refund_audit(refund_id,actor_id,event) values(p_id,auth.uid(),'approved');
end $$;
create function public.bhk_claim_refund(p_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare refund bhk_refund_requests; payment bhk_payment_orders;
begin
  perform 1 from bhk_bookings where id=(select booking_id from bhk_refund_requests where id=p_id) for update;
  select * into refund from bhk_refund_requests where id=p_id for update;
  if not found or refund.approved_at is null then raise exception 'Refund is not approved'; end if;
  if refund.status='processed' then return jsonb_build_object('done',true,'refundId',refund.gateway_refund_id); end if;
  if refund.status='failed' then raise exception 'Provider failure requires reconciliation'; end if;
  if refund.dispatch_after>now() then raise exception 'Refund is already being processed; retry later'; end if;
  select * into payment from bhk_payment_orders where id=refund.payment_order_id for update;
  if payment.payment_id is null or payment.captured_at is null or refund.amount::bigint*100>payment.amount_paise then raise exception 'Captured payment reconciliation required'; end if;
  update bhk_refund_requests set status='processing',dispatch_after=now()+interval '2 minutes',dispatch_attempts=dispatch_attempts+1 where id=p_id;
  update bhk_bookings set refund_status='processing' where id=refund.booking_id and refund_status<>'processed';
  return jsonb_build_object('done',false,'id',refund.id,'paymentId',payment.payment_id,
    'amountPaise',refund.amount::bigint*100,'gatewayRefundId',refund.gateway_refund_id);
end $$;
create function public.bhk_record_refund(p_id uuid,p_gateway text,p_payment text,p_amount bigint,p_status text) returns void
language plpgsql security definer set search_path=public as $$
declare refund bhk_refund_requests; payment bhk_payment_orders; final_status text;
begin
  perform 1 from bhk_bookings where id=(select booking_id from bhk_refund_requests where id=p_id) for update;
  select * into refund from bhk_refund_requests where id=p_id for update;
  if not found or refund.approved_at is null then raise exception 'Unknown approved refund'; end if;
  select * into payment from bhk_payment_orders where id=refund.payment_order_id;
  if p_payment is distinct from payment.payment_id or p_amount is distinct from refund.amount::bigint*100
    or p_gateway is null or p_gateway !~ '^rfnd_[A-Za-z0-9]+$'
    or (refund.gateway_refund_id is not null and refund.gateway_refund_id<>p_gateway)
    or p_status is null or p_status not in ('created','pending','processed','failed') then raise exception 'Refund provider mismatch'; end if;
  if refund.status='processed' then return; end if;
  final_status:=case when p_status in ('created','pending') then 'processing' else p_status end;
  update bhk_refund_requests set gateway_refund_id=p_gateway,status=final_status,last_provider_status=p_status,
    last_error=null,dispatch_after=now()+interval '5 minutes' where id=p_id;
  insert into bhk_refund_audit(refund_id,event,provider_id) values(p_id,p_status,p_gateway);
  update bhk_bookings b set refund_status=case
    when not exists(select 1 from bhk_refund_requests r where r.booking_id=b.id and r.status<>'processed') then 'processed'
    when exists(select 1 from bhk_refund_requests r where r.booking_id=b.id and r.status='failed') then 'failed'
    else 'processing' end where b.id=refund.booking_id;
end $$;
revoke all on function bhk_approve_refund(uuid,integer),bhk_claim_refund(uuid),bhk_record_refund(uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function bhk_approve_refund(uuid,integer) to authenticated;
grant execute on function bhk_claim_refund(uuid),bhk_record_refund(uuid,text,text,bigint,text) to service_role;
commit;
