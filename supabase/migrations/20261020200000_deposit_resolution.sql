begin;
alter table bhk_refund_requests add column purpose text not null default 'cancellation' check(purpose in ('cancellation','deposit'));
create table public.bhk_deposit_cases(
  booking_id uuid primary key references bhk_bookings(id),
  host_id uuid not null references auth.users(id),
  guest_id uuid not null references auth.users(id),
  deposit_rupees integer not null check(deposit_rupees>0),
  proposed_deduction_rupees integer not null check(proposed_deduction_rupees>=0 and proposed_deduction_rupees<=deposit_rupees),
  inspection_evidence text not null check(length(trim(inspection_evidence)) between 10 and 4000),
  guest_response text check(length(guest_response)<=4000),
  status text not null default 'awaiting_guest' check(status in ('awaiting_guest','accepted','disputed','resolved')),
  return_rupees integer check(return_rupees between 0 and deposit_rupees),
  resolved_by uuid references auth.users(id), resolution_reason text,
  created_at timestamptz not null default now(),resolved_at timestamptz
);
alter table bhk_deposit_cases enable row level security;
grant select on bhk_deposit_cases to authenticated;
grant all on bhk_deposit_cases to service_role;
create policy deposit_participant on bhk_deposit_cases for select to authenticated using(guest_id=auth.uid() or host_id=auth.uid() or bhk_is_staff());
create function public.bhk_propose_deposit(p_booking uuid,p_deduction integer,p_evidence text) returns void
language plpgsql security definer set search_path=public as $$
declare booking bhk_bookings; amount integer;
begin
  select * into booking from bhk_bookings where id=p_booking and host_id=auth.uid() for update;
  if not found or booking.status<>'completed' or booking.checkout_at>now() or booking.payment_status<>'paid' or booking.refund_status<>'none' then raise exception 'Completed paid stay required'; end if;
  amount:=coalesce((booking.quote->>'deposit')::integer,0);
  if amount<=0 then raise exception 'This booking has no collected deposit'; end if;
  insert into bhk_deposit_cases(booking_id,host_id,guest_id,deposit_rupees,proposed_deduction_rupees,inspection_evidence)
    values(p_booking,auth.uid(),booking.guest_id,amount,p_deduction,p_evidence);
end $$;
create function public.bhk_respond_deposit(p_booking uuid,p_accept boolean,p_response text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_accept is null then raise exception 'Choose accept or dispute'; end if;
  update bhk_deposit_cases set status=case when p_accept then 'accepted' else 'disputed' end,guest_response=p_response
  where booking_id=p_booking and guest_id=auth.uid() and status='awaiting_guest';
  if not found then raise exception 'Deposit case unavailable'; end if;
end $$;
create function public.bhk_resolve_deposit(p_booking uuid,p_return integer,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
declare booking bhk_bookings; deposit_case bhk_deposit_cases; payment bhk_payment_orders; remaining integer:=p_return; piece integer;
begin
  if not bhk_is_staff() then raise exception 'Staff resolution required'; end if;
  select * into booking from bhk_bookings where id=p_booking for update;
  select * into deposit_case from bhk_deposit_cases where booking_id=p_booking for update;
  if deposit_case.booking_id is null or deposit_case.status='resolved' or booking.status<>'completed'
    or booking.payment_status<>'paid' or booking.refund_status<>'none' then raise exception 'Deposit case requires reconciliation'; end if;
  if p_return is null or p_return<0 or p_return>deposit_case.deposit_rupees or p_reason is null or length(trim(p_reason)) not between 10 and 4000 then raise exception 'Record the approved return and resolution reason'; end if;
  if exists(select 1 from bhk_refund_requests where booking_id=p_booking) then raise exception 'Existing refunds require reconciliation'; end if;
  for payment in select * from bhk_payment_orders where booking_id=p_booking and payment_id is not null and captured_at is not null order by created_at,id for update loop
    exit when remaining=0;
    if payment.amount_paise%100<>0 then raise exception 'Fractional payment requires reconciliation'; end if;
    piece:=least(remaining,(payment.amount_paise/100)::integer);
    insert into bhk_refund_requests(booking_id,payment_order_id,requested_by,amount,reason,purpose)
      values(p_booking,payment.id,auth.uid(),piece,'Deposit return: '||p_reason,'deposit');
    remaining:=remaining-piece;
  end loop;
  if remaining<>0 then raise exception 'Captured payments cannot cover deposit return'; end if;
  update bhk_deposit_cases set status='resolved',return_rupees=p_return,resolved_by=auth.uid(),resolved_at=now(),resolution_reason=p_reason where booking_id=p_booking;
end $$;
-- A deposit return is not a stay cancellation and must not consume the host's earned settlement.
create or replace function public.bhk_claim_refund(p_id uuid) returns jsonb
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
  if refund.purpose='cancellation' then update bhk_bookings set refund_status='processing' where id=refund.booking_id and refund_status<>'processed'; end if;
  return jsonb_build_object('done',false,'id',refund.id,'paymentId',payment.payment_id,'amountPaise',refund.amount::bigint*100,'gatewayRefundId',refund.gateway_refund_id);
end $$;
create or replace function public.bhk_record_refund(p_id uuid,p_gateway text,p_payment text,p_amount bigint,p_status text) returns void
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
  update bhk_refund_requests set gateway_refund_id=p_gateway,status=final_status,last_provider_status=p_status,last_error=null,dispatch_after=now()+interval '5 minutes' where id=p_id;
  insert into bhk_refund_audit(refund_id,event,provider_id) values(p_id,p_status,p_gateway);
  if refund.purpose='cancellation' then
    update bhk_bookings b set refund_status=case
      when not exists(select 1 from bhk_refund_requests r where r.booking_id=b.id and r.purpose='cancellation' and r.status<>'processed') then 'processed'
      when exists(select 1 from bhk_refund_requests r where r.booking_id=b.id and r.purpose='cancellation' and r.status='failed') then 'failed'
      else 'processing' end where b.id=refund.booking_id;
  end if;
end $$;
revoke all on function bhk_propose_deposit(uuid,integer,text),bhk_respond_deposit(uuid,boolean,text),bhk_resolve_deposit(uuid,integer,text) from public,anon;
grant execute on function bhk_propose_deposit(uuid,integer,text),bhk_respond_deposit(uuid,boolean,text),bhk_resolve_deposit(uuid,integer,text) to authenticated;
commit;
