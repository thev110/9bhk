begin;
create table public.bhk_notification_preferences(
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  marketing_in_app boolean not null default false,
  timezone text not null default 'Asia/Kolkata',
  quiet_start time,
  quiet_end time,
  check ((quiet_start is null)=(quiet_end is null))
);
alter table public.bhk_notification_preferences enable row level security;
grant select,insert,update on public.bhk_notification_preferences to authenticated;
create policy notification_preferences_own on public.bhk_notification_preferences to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create function public.bhk_validate_notification_timezone() returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Unknown timezone'; end if;
  return new;
end $$;
revoke all on function public.bhk_validate_notification_timezone() from public,anon,authenticated;
create trigger validate_notification_timezone before insert or update on public.bhk_notification_preferences
for each row execute function public.bhk_validate_notification_timezone();

-- In-app delivery only. External channels need their own provider and consent contracts.
create table public.bhk_notification_outbox(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null check(length(event_key) between 1 and 200),
  category text not null check(category in ('transactional','marketing')),
  title text not null check(length(title) between 1 and 200),
  body text not null check(length(body) between 1 and 4000),
  href text check(href is null or (href ~ '^/[A-Za-z0-9]' and href !~ '[\\[:cntrl:]]')),
  status text not null default 'pending' check(status in ('pending','delivered','suppressed','expired','failed')),
  available_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '7 days',
  attempts integer not null default 0 check(attempts between 0 and 5),
  last_error_code text,
  notification_id uuid references public.bhk_notifications(id) on delete set null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique(user_id,event_key)
);
alter table public.bhk_notification_outbox enable row level security;
-- Supabase grants ALL to anon/authenticated by default; outbox writes are service-only.
revoke all on public.bhk_notification_outbox from anon,authenticated;
grant select on public.bhk_notification_outbox to authenticated;
create policy notification_outbox_staff on public.bhk_notification_outbox for select to authenticated using(public.bhk_is_staff());
grant all on public.bhk_notification_outbox, public.bhk_notification_preferences to service_role;
create index notification_outbox_pending on public.bhk_notification_outbox(available_at) where status='pending';
-- Later source-specific migrations replace this hook without changing delivery mechanics.
create function public.bhk_outbox_relevant(p_id uuid) returns boolean language sql stable set search_path=public as $$ select true $$;
revoke all on function public.bhk_outbox_relevant(uuid) from public,anon,authenticated;

create function public.bhk_deliver_notifications(p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path=public as $$
declare job bhk_notification_outbox; preference bhk_notification_preferences; local_clock time;
  delivered integer:=0; suppressed integer:=0; failed integer:=0; inserted_id uuid; quiet boolean;
begin
  if p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Batch must contain 1 to 100 items'; end if;
  for job in select * from bhk_notification_outbox where status='pending' and available_at<=now()
    order by available_at,id limit p_limit for update skip locked loop
    if job.expires_at<=now() then
      update bhk_notification_outbox set status='expired' where id=job.id;
      continue;
    end if;
    if not bhk_outbox_relevant(job.id) then
      update bhk_notification_outbox set status='suppressed' where id=job.id;
      suppressed:=suppressed+1; continue;
    end if;
    select * into preference from bhk_notification_preferences where user_id=job.user_id;
    if job.category='marketing' and not coalesce(preference.marketing_in_app,false) then
      update bhk_notification_outbox set status='suppressed' where id=job.id;
      suppressed:=suppressed+1; continue;
    end if;
    local_clock:=(now() at time zone coalesce(preference.timezone,'Asia/Kolkata'))::time;
    quiet:=preference.quiet_start is not null and preference.quiet_start<>preference.quiet_end and
      case when preference.quiet_start<preference.quiet_end then
        local_clock>=preference.quiet_start and local_clock<preference.quiet_end
      else local_clock>=preference.quiet_start or local_clock<preference.quiet_end end;
    -- Transactional account records are immediately available; quiet hours apply to marketing.
    if job.category='marketing' and quiet then
      update bhk_notification_outbox set available_at=now()+interval '15 minutes' where id=job.id;
      continue;
    end if;
    begin
      insert into bhk_notifications(user_id,title,body,href) values(job.user_id,job.title,job.body,job.href)
      returning id into inserted_id;
      update bhk_notification_outbox set status='delivered',notification_id=inserted_id,
        delivered_at=now(),attempts=attempts+1,last_error_code=null where id=job.id;
      delivered:=delivered+1;
    exception when others then
      update bhk_notification_outbox set attempts=attempts+1,last_error_code=sqlstate,
        status=case when attempts+1>=5 then 'failed' else 'pending' end,
        available_at=now()+interval '5 minutes' where id=job.id;
      failed:=failed+1;
    end;
  end loop;
  return jsonb_build_object('delivered',delivered,'suppressed',suppressed,'failed',failed);
end $$;
revoke all on function public.bhk_deliver_notifications(integer) from public,anon,authenticated;
grant execute on function public.bhk_deliver_notifications(integer) to service_role;
commit;
