begin;
create table public.bhk_usage_events (
  id uuid primary key default gen_random_uuid(),
  event text not null check(event in ('property_view','search','filter','wishlist','inquiry','booking_start','booking_complete','guide_view','location_page_view')),
  property_id text,
  created_at timestamptz not null default now()
);
alter table public.bhk_usage_events enable row level security;
grant insert on public.bhk_usage_events to service_role;
grant select on public.bhk_usage_events to authenticated,service_role;
create policy usage_events_staff_read on public.bhk_usage_events for select to authenticated using(public.bhk_is_staff());
create index usage_events_recent on public.bhk_usage_events(created_at,event);

-- Deliverable account notifications come from persisted booking transitions.
create function public.bhk_notify_booking_transition() returns trigger
language plpgsql security definer set search_path=public as $$
declare note_title text;
begin
  if tg_op='INSERT' then note_title:='Reservation hold created';
  elsif new.status is distinct from old.status then
    note_title:=case new.status when 'confirmed' then 'Payment captured: stay confirmed'
      when 'completed' then 'Stay completed' when 'cancelled' then 'Reservation cancelled'
      else 'Reservation updated' end;
  elsif new.refund_status is distinct from old.refund_status then
    note_title:='Refund status: '||new.refund_status;
  else return new; end if;
  if new.guest_id is not null then
    insert into public.bhk_notifications(user_id,title,body,href)
      values(new.guest_id,note_title,new.property_name||' · '||new.code,'/trips');
  end if;
  if new.host_id is not null and new.status in ('confirmed','completed','cancelled') then
    insert into public.bhk_notifications(user_id,title,body,href)
      values(new.host_id,note_title,new.property_name||' · '||new.code,'/host/bookings');
  end if;
  return new;
end;
$$;
revoke all on function public.bhk_notify_booking_transition() from public,anon,authenticated;
create trigger booking_transition_notification after insert or update on public.bhk_bookings
for each row execute function public.bhk_notify_booking_transition();
commit;
