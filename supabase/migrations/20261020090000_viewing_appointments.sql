begin;
create table public.bhk_viewing_appointments (
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique references public.bhk_viewing_requests(id),
 property_id text not null references public.bhk_properties(id),buyer_id uuid not null references auth.users(id),owner_id uuid not null references auth.users(id),
 organizer_id uuid not null references auth.users(id),starts_at timestamptz not null,ends_at timestamptz not null,
 status text not null default 'proposed' check(status in ('proposed','confirmed','cancelled','completed')),
 attendance text check(attendance in ('attended','no_show')),attendance_recorded_by uuid references auth.users(id),
 version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(isfinite(starts_at) and isfinite(ends_at) and ends_at>starts_at and ends_at-starts_at<=interval '4 hours'),
 exclude using gist(property_id with =,tstzrange(starts_at,ends_at,'[)') with &&) where(status in ('proposed','confirmed'))
);
create index bhk_viewing_appointments_buyer on public.bhk_viewing_appointments(buyer_id,starts_at);
create index bhk_viewing_appointments_owner on public.bhk_viewing_appointments(owner_id,starts_at);
create table public.bhk_viewing_appointment_events (
 appointment_id uuid not null references public.bhk_viewing_appointments(id),version integer not null,
 actor_id uuid not null references auth.users(id),action text not null check(action in ('proposed','rescheduled','confirmed','cancelled','attended','no_show')),
 starts_at timestamptz not null,ends_at timestamptz not null,reason text not null check(length(trim(reason)) between 1 and 2000),
 created_at timestamptz not null default now(),primary key(appointment_id,version)
);
alter table public.bhk_viewing_appointments enable row level security;
alter table public.bhk_viewing_appointment_events enable row level security;
revoke all on public.bhk_viewing_appointments,public.bhk_viewing_appointment_events from anon,authenticated;
grant select on public.bhk_viewing_appointments,public.bhk_viewing_appointment_events to authenticated;
grant all on public.bhk_viewing_appointments,public.bhk_viewing_appointment_events to service_role;
create policy viewing_appointment_participants on public.bhk_viewing_appointments for select to authenticated using(buyer_id=auth.uid() or owner_id=auth.uid() or public.bhk_my_property_capability(property_id,'viewings'));
create policy viewing_appointment_event_participants on public.bhk_viewing_appointment_events for select to authenticated using(exists(select 1 from public.bhk_viewing_appointments a where a.id=appointment_id));
-- Mandate holders may read viewing enquiries, never private property records.
create policy viewing_request_mandated_broker on public.bhk_viewing_requests for select to authenticated using(public.bhk_my_property_capability(property_id,'viewings'));

-- All booking and appointment mutations serialize on the property row.
create function public.bhk_guard_viewing_slot() returns trigger language plpgsql security definer set search_path=public as $$
declare p bhk_properties;first_day date;last_day date;
begin
 if new.status in ('cancelled','completed') then return new; end if;
 select * into p from bhk_properties where id=new.property_id for update;
 if not found or p.host_id<>new.owner_id or p.status<>'published' or not p.is_for_sale then raise exception 'Property unavailable for viewing'; end if;
 if new.starts_at<=now() then raise exception 'Viewing must start in the future'; end if;
 first_day:=(new.starts_at at time zone 'Asia/Kolkata')::date;
 last_day:=((new.ends_at-interval '1 microsecond') at time zone 'Asia/Kolkata')::date;
 if exists(select 1 from unnest(p.blocked_dates) d where d between first_day and last_day) then raise exception 'Viewing conflicts with host closure'; end if;
 -- Conservatively block every arrival, occupied and checkout date in India local time.
 if exists(select 1 from bhk_bookings b where b.property_id=new.property_id and b.status<>'cancelled' and b.check_in<=last_day and b.check_out>=first_day and (b.hold_expires_at is null or b.hold_expires_at>now() or b.payment_status in ('paid','partial','review'))) then raise exception 'Viewing conflicts with a stay'; end if;
 return new;
end $$;
create trigger bhk_guard_viewing_slot before insert or update on public.bhk_viewing_appointments for each row execute function public.bhk_guard_viewing_slot();
create function public.bhk_guard_booking_viewings() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='cancelled' then return new; end if;
 perform 1 from bhk_properties where id=new.property_id for update;
 if exists(select 1 from bhk_viewing_appointments a where a.property_id=new.property_id and a.status in ('proposed','confirmed') and a.ends_at>now() and (a.starts_at at time zone 'Asia/Kolkata')::date<=new.check_out and ((a.ends_at-interval '1 microsecond') at time zone 'Asia/Kolkata')::date>=new.check_in) then raise exception 'Stay conflicts with a viewing; reschedule or cancel it first'; end if;
 return new;
end $$;
create trigger bhk_guard_booking_viewings before insert or update of property_id,check_in,check_out,status on public.bhk_bookings for each row execute function public.bhk_guard_booking_viewings();
create function public.bhk_guard_closure_viewings() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from bhk_viewing_appointments a where a.property_id=new.id and a.status in ('proposed','confirmed') and a.ends_at>now() and exists(select 1 from unnest(new.blocked_dates) d where d between (a.starts_at at time zone 'Asia/Kolkata')::date and ((a.ends_at-interval '1 microsecond') at time zone 'Asia/Kolkata')::date)) then raise exception 'Closure conflicts with a viewing; reschedule or cancel it first'; end if;
 return new;
end $$;
create trigger bhk_guard_closure_viewings before update of blocked_dates on public.bhk_properties for each row execute function public.bhk_guard_closure_viewings();

-- Event primary key deduplicates each version. Notifications are committed atomically with it.
create function public.bhk_record_viewing_event(p_id uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare a bhk_viewing_appointments;
begin
 select * into a from bhk_viewing_appointments where id=p_id;
 insert into bhk_viewing_appointment_events(appointment_id,version,actor_id,action,starts_at,ends_at,reason) values(a.id,a.version,auth.uid(),p_action,a.starts_at,a.ends_at,trim(p_reason));
 insert into bhk_notifications(user_id,title,body) select distinct recipient,'Viewing '||p_action,'Viewing time: '||to_char(a.starts_at at time zone 'Asia/Kolkata','YYYY-MM-DD HH24:MI')||' IST. Status: '||a.status from unnest(array[a.buyer_id,a.owner_id,a.organizer_id]) recipient where recipient<>auth.uid() and (recipient in (a.buyer_id,a.owner_id) or bhk_property_capability(recipient,a.property_id,'viewings'));
end $$;
create function public.bhk_propose_viewing(p_request uuid,p_start timestamptz,p_end timestamptz,p_reason text) returns uuid language plpgsql security definer set search_path=public as $$
declare r bhk_viewing_requests;v_owner uuid;v_id uuid;
begin
 select * into r from bhk_viewing_requests where id=p_request;
 if not found or r.user_id is null then raise exception 'Viewing request unavailable'; end if;
 select host_id into v_owner from bhk_properties where id=r.property_id for update;
 if auth.uid() is null or not (v_owner=auth.uid() or bhk_property_capability(auth.uid(),r.property_id,'viewings')) then raise exception 'Viewing request unavailable'; end if;
 select * into r from bhk_viewing_requests where id=p_request for update;
 if r.status<>'pending' then raise exception 'Viewing request is no longer pending'; end if;
 insert into bhk_viewing_appointments(request_id,property_id,buyer_id,owner_id,organizer_id,starts_at,ends_at) values(r.id,r.property_id,r.user_id,v_owner,auth.uid(),p_start,p_end) returning id into v_id;
 perform bhk_record_viewing_event(v_id,'proposed',p_reason);
 return v_id;
end $$;
create function public.bhk_update_viewing(p_id uuid,p_version integer,p_action text,p_start timestamptz,p_end timestamptz,p_reason text) returns integer language plpgsql security definer set search_path=public as $$
declare a bhk_viewing_appointments;v_owner uuid;v_organizer boolean;
begin
 select * into a from bhk_viewing_appointments where id=p_id;
 if not found then raise exception 'Viewing unavailable'; end if;
 select host_id into v_owner from bhk_properties where id=a.property_id for update;
 v_organizer:=v_owner=auth.uid() or bhk_property_capability(auth.uid(),a.property_id,'viewings');
 if auth.uid() is null or not (a.buyer_id=auth.uid() or v_organizer) then raise exception 'Viewing unavailable'; end if;
 select * into a from bhk_viewing_appointments where id=p_id for update;
 if p_version is distinct from a.version then raise exception 'Viewing changed; reload before saving'; end if;
 if a.status in ('cancelled','completed') then raise exception 'Viewing is already closed'; end if;
 if p_action='confirmed' then
  if a.buyer_id<>auth.uid() or a.status<>'proposed' then raise exception 'Only the buyer can confirm a proposal'; end if;
  update bhk_viewing_appointments set status='confirmed',version=version+1,updated_at=now() where id=p_id;
  update bhk_viewing_requests set status='scheduled' where id=a.request_id;
 elsif p_action='rescheduled' then
  if not v_organizer then raise exception 'Only the owner or mandated broker can propose a new time'; end if;
  update bhk_viewing_appointments set status='proposed',starts_at=p_start,ends_at=p_end,organizer_id=auth.uid(),owner_id=v_owner,version=version+1,updated_at=now() where id=p_id;
  update bhk_viewing_requests set status='pending' where id=a.request_id;
 elsif p_action='cancelled' then
  update bhk_viewing_appointments set status='cancelled',version=version+1,updated_at=now() where id=p_id;
  update bhk_viewing_requests set status='cancelled' where id=a.request_id;
 else raise exception 'Invalid viewing action'; end if;
 perform bhk_record_viewing_event(p_id,p_action,p_reason);
 return a.version+1;
end $$;
revoke all on function public.bhk_guard_viewing_slot(),public.bhk_guard_booking_viewings(),public.bhk_guard_closure_viewings(),public.bhk_record_viewing_event(uuid,text,text),public.bhk_propose_viewing(uuid,timestamptz,timestamptz,text),public.bhk_update_viewing(uuid,integer,text,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.bhk_propose_viewing(uuid,timestamptz,timestamptz,text),public.bhk_update_viewing(uuid,integer,text,timestamptz,timestamptz,text) to authenticated;

create table public.bhk_viewing_qualifications (
 request_id uuid primary key references public.bhk_viewing_requests(id),version integer not null default 1,
 budget_min_paise bigint not null check(budget_min_paise>=0),budget_max_paise bigint not null check(budget_max_paise between 1 and 9007199254740991),
 financing text not null check(financing in ('unknown','cash_self_reported','loan_needed','preapproved_self_reported')),
 purchase_timeline text not null check(length(purchase_timeline)<=500),updated_at timestamptz not null default now(),
 check(budget_max_paise>=budget_min_paise)
);
create table public.bhk_viewing_feedback (
 appointment_id uuid primary key references public.bhk_viewing_appointments(id),buyer_id uuid not null references auth.users(id),
 usefulness integer not null check(usefulness between 1 and 5),body text not null check(length(trim(body)) between 1 and 4000),created_at timestamptz not null default now()
);
alter table public.bhk_viewing_qualifications enable row level security;
alter table public.bhk_viewing_feedback enable row level security;
revoke all on public.bhk_viewing_qualifications,public.bhk_viewing_feedback from anon,authenticated;
grant select on public.bhk_viewing_qualifications,public.bhk_viewing_feedback to authenticated;
grant all on public.bhk_viewing_qualifications,public.bhk_viewing_feedback to service_role;
create policy qualification_request_read on public.bhk_viewing_qualifications for select to authenticated using(exists(select 1 from bhk_viewing_requests r where r.id=request_id));
create policy feedback_appointment_read on public.bhk_viewing_feedback for select to authenticated using(exists(select 1 from bhk_viewing_appointments a where a.id=appointment_id));
create function public.bhk_qualify_viewing_request(p_request uuid,p_version integer,p_min bigint,p_max bigint,p_financing text,p_timeline text) returns integer language plpgsql security definer set search_path=public as $$
declare v_version integer;
begin
 perform 1 from bhk_viewing_requests where id=p_request and user_id=auth.uid() for update;
 if not found then raise exception 'Viewing request unavailable'; end if;
 select version into v_version from bhk_viewing_qualifications where request_id=p_request;
 if p_version is distinct from coalesce(v_version,0) then raise exception 'Qualification changed; reload before saving'; end if;
 insert into bhk_viewing_qualifications(request_id,budget_min_paise,budget_max_paise,financing,purchase_timeline) values(p_request,p_min,p_max,p_financing,p_timeline)
 on conflict(request_id) do update set budget_min_paise=p_min,budget_max_paise=p_max,financing=p_financing,purchase_timeline=p_timeline,version=bhk_viewing_qualifications.version+1,updated_at=now();
 return coalesce(v_version,0)+1;
end $$;
create function public.bhk_record_viewing_attendance(p_id uuid,p_version integer,p_attendance text,p_reason text) returns integer language plpgsql security definer set search_path=public as $$
declare a bhk_viewing_appointments;v_owner uuid;
begin
 select * into a from bhk_viewing_appointments where id=p_id;
 if not found then raise exception 'Viewing unavailable'; end if;
 select host_id into v_owner from bhk_properties where id=a.property_id for update;
 if auth.uid() is null or not(v_owner=auth.uid() or bhk_property_capability(auth.uid(),a.property_id,'viewings')) then raise exception 'Viewing unavailable'; end if;
 select * into a from bhk_viewing_appointments where id=p_id for update;
 if p_version is distinct from a.version then raise exception 'Viewing changed; reload before saving'; end if;
 if a.status<>'confirmed' or a.ends_at>now() then raise exception 'A finished confirmed appointment is required'; end if;
 if p_attendance is null or p_attendance not in ('attended','no_show') then raise exception 'Invalid attendance'; end if;
 update bhk_viewing_appointments set status='completed',attendance=p_attendance,attendance_recorded_by=auth.uid(),version=version+1,updated_at=now() where id=p_id;
 update bhk_viewing_requests set status='completed' where id=a.request_id;
 perform bhk_record_viewing_event(p_id,p_attendance,p_reason);
 return a.version+1;
end $$;
create function public.bhk_submit_viewing_feedback(p_id uuid,p_usefulness integer,p_body text) returns void language plpgsql security definer set search_path=public as $$
begin
 perform 1 from bhk_viewing_appointments where id=p_id and buyer_id=auth.uid() and status in ('confirmed','completed') and ends_at<=now() for update;
 if not found then raise exception 'Finished viewing unavailable'; end if;
 insert into bhk_viewing_feedback(appointment_id,buyer_id,usefulness,body) values(p_id,auth.uid(),p_usefulness,trim(p_body));
end $$;
revoke all on function public.bhk_qualify_viewing_request(uuid,integer,bigint,bigint,text,text),public.bhk_record_viewing_attendance(uuid,integer,text,text),public.bhk_submit_viewing_feedback(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.bhk_qualify_viewing_request(uuid,integer,bigint,bigint,text,text),public.bhk_record_viewing_attendance(uuid,integer,text,text),public.bhk_submit_viewing_feedback(uuid,integer,text) to authenticated;
commit;
