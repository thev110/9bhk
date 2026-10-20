begin;
create table public.bhk_group_messages(
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references bhk_group_plans(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check(length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index group_messages_recent on bhk_group_messages(plan_id,created_at desc);
alter table bhk_group_messages enable row level security;
grant select,insert on bhk_group_messages to authenticated;
grant all on bhk_group_messages to service_role;
create policy group_messages_read on bhk_group_messages for select to authenticated using(bhk_group_member(plan_id));
create policy group_messages_create on bhk_group_messages for insert to authenticated
with check(bhk_group_member(plan_id) and sender_id=auth.uid());

create table public.bhk_group_payer_assignments(
  plan_id uuid not null references bhk_group_booking_links(plan_id) on delete cascade,
  share_id uuid not null unique references bhk_split_shares(id),
  user_id uuid not null references auth.users(id),
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),primary key(plan_id,user_id)
);
alter table bhk_group_payer_assignments enable row level security;
grant select on bhk_group_payer_assignments to authenticated;
grant all on bhk_group_payer_assignments to service_role;
create policy group_payer_assignments_scoped on bhk_group_payer_assignments for select to authenticated
using(user_id=auth.uid() or exists(select 1 from bhk_group_booking_links l where l.plan_id=bhk_group_payer_assignments.plan_id and l.booker_id=auth.uid()));
create function public.bhk_assign_group_payer(p_plan uuid,p_share uuid,p_user uuid) returns void
language plpgsql security definer set search_path=public as $$
declare linked bhk_group_booking_links; share bhk_split_shares;
begin
  perform 1 from bhk_group_plans where id=p_plan for update;
  select * into linked from bhk_group_booking_links where plan_id=p_plan and booker_id=auth.uid();
  if not found then raise exception 'Only the booking organiser can propose payer roles'; end if;
  select * into share from bhk_split_shares where id=p_share and booking_id=linked.booking_id and not paid for update;
  if not found then raise exception 'Choose an unpaid share in this booking'; end if;
  if p_user<>auth.uid() and not exists(select 1 from bhk_group_members where plan_id=p_plan and user_id=p_user) then raise exception 'Choose a current member'; end if;
  delete from bhk_group_payer_assignments where plan_id=p_plan and (share_id=p_share or user_id=p_user);
  insert into bhk_group_payer_assignments(plan_id,share_id,user_id,assigned_by) values(p_plan,p_share,p_user,auth.uid());
end $$;
create function public.bhk_group_funding_progress(p_plan uuid) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare booking bhk_bookings; paid_amount bigint;
begin
  if not bhk_group_member(p_plan) then raise exception 'Group unavailable'; end if;
  select b.* into booking from bhk_bookings b join bhk_group_booking_links l on l.booking_id=b.id where l.plan_id=p_plan;
  if not found then return null; end if;
  select coalesce(sum(amount_paise),0) into paid_amount from bhk_payment_orders where booking_id=booking.id and status='captured';
  return jsonb_build_object('totalPaise',booking.total::bigint*100,'capturedPaise',paid_amount,
    'remainingPaise',greatest(0,booking.total::bigint*100-paid_amount),'fundingMode',booking.funding_mode,
    'paymentStatus',booking.payment_status,'holdExpiresAt',booking.hold_expires_at,
    'assignedShare', (select jsonb_build_object('shareId',s.id,'amountPaise',s.amount::bigint*100,'paid',s.paid)
      from bhk_group_payer_assignments a join bhk_split_shares s on s.id=a.share_id
      where a.plan_id=p_plan and a.user_id=auth.uid()));
end $$;
create function public.bhk_remove_group_payer_assignment() returns trigger language plpgsql security definer set search_path=public as $$
begin delete from bhk_group_payer_assignments where plan_id=old.plan_id and user_id=old.user_id;return old;end $$;
create trigger remove_group_payer_assignment after delete on bhk_group_members for each row execute function bhk_remove_group_payer_assignment();
revoke all on function bhk_assign_group_payer(uuid,uuid,uuid),bhk_group_funding_progress(uuid),bhk_remove_group_payer_assignment() from public,anon,authenticated;
grant execute on function bhk_assign_group_payer(uuid,uuid,uuid),bhk_group_funding_progress(uuid) to authenticated;
commit;
