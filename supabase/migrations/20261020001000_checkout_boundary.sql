begin;
-- Unknown historical checkout times wait until the next local midnight.
-- Valid HH:MM or 12-hour times are snapshotted so listing edits cannot accelerate payouts.
create function public.bhk_checkout_timestamp(day date, clock_text text) returns timestamptz
language plpgsql immutable set search_path=public as $$
declare clean text:=lower(trim(clock_text)); clock_time time;
begin
  if clean ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
     or clean ~ '^(0?[1-9]|1[0-2]):[0-5][0-9][ ]?(am|pm)$' then
    clock_time:=clean::time;
    return (day+clock_time) at time zone 'Asia/Kolkata';
  end if;
  return (day+1)::timestamp at time zone 'Asia/Kolkata';
end; $$;
alter table public.bhk_bookings add column checkout_at timestamptz;
update public.bhk_bookings b set checkout_at=public.bhk_checkout_timestamp(b.check_out,p.check_out_time)
from public.bhk_properties p where p.id=b.property_id;
update public.bhk_bookings set checkout_at=public.bhk_checkout_timestamp(check_out,null) where checkout_at is null;
alter table public.bhk_bookings alter column checkout_at set not null;
create function public.bhk_snapshot_checkout() returns trigger language plpgsql security definer set search_path=public as $$
declare clock_text text;
begin
  if tg_op='INSERT' then
    select check_out_time into clock_text from bhk_properties where id=new.property_id;
    new.checkout_at:=bhk_checkout_timestamp(new.check_out,clock_text);
  elsif new.check_out is distinct from old.check_out or new.property_id is distinct from old.property_id then
    select check_out_time into clock_text from bhk_properties where id=new.property_id;
    new.checkout_at:=bhk_checkout_timestamp(new.check_out,clock_text);
  else new.checkout_at:=old.checkout_at;
  end if;
  return new;
end; $$;
revoke all on function public.bhk_snapshot_checkout() from public,anon,authenticated;
create trigger booking_checkout_snapshot before insert or update on public.bhk_bookings
for each row execute function public.bhk_snapshot_checkout();
create or replace function public.bhk_expire_holds() returns jsonb language plpgsql security definer set search_path=public as $$
declare target public.bhk_bookings; expired integer:=0; finished integer;
begin
  for target in select b.* from public.bhk_bookings b where b.status='awaiting' and b.hold_expires_at<=now() order by b.property_id,b.id for update loop
    update public.bhk_bookings set status='cancelled' where id=target.id;
    perform public.bhk_queue_booking_refunds(target.id,'Expired reservation funding hold',target.guest_id);
    expired:=expired+1;
  end loop;
  update public.bhk_bookings set status='completed' where status='confirmed' and payment_status='paid' and checkout_at<=now();
  get diagnostics finished=row_count;
  return jsonb_build_object('expired',expired,'completed',finished);
end $$;
create or replace function public.bhk_request_payout(p_host uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare ids uuid[]; value integer; request_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_host::text,1));
  select array_agg(b.id),sum(b.total-coalesce((b.quote->>'tax')::integer,0)-coalesce((b.quote->>'platformFee')::integer,0)-coalesce((b.quote->>'deposit')::integer,0)) into ids,value
  from public.bhk_bookings b where b.host_id=p_host and b.status='completed' and b.payment_status='paid' and b.refund_status='none' and b.checkout_at<=now()
    and not exists(select 1 from public.bhk_payout_requests p where b.id=any(p.booking_ids) and p.status<>'rejected');
  if value is null or value<=0 then raise exception 'No completed, reconciled stays are eligible for settlement'; end if;
  insert into public.bhk_payout_requests(host_id,amount,booking_ids) values(p_host,value,ids) returning id into request_id;
  return jsonb_build_object('success',true,'requestId',request_id,'status','requested','amount',value);
end $$;
commit;
