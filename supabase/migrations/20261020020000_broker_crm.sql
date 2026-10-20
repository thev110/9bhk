begin;
-- Private CRM records reuse existing client identities. No client contact data is copied.
create table public.bhk_crm_opportunities (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null references public.bhk_realtor_clients(id) on delete restrict,
 title text not null check(length(trim(title)) between 1 and 200),
 purpose text not null check(purpose in ('buy','rent','sell')),
 timeline text not null default '' check(length(timeline)<=500),
 financing text not null default 'unknown' check(financing in ('unknown','cash','loan_needed','preapproved_self_reported')),
 stage text not null default 'new' check(stage in ('new','contacted','qualified','viewing','negotiating','won','lost')),
 version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index bhk_crm_opportunities_owner on public.bhk_crm_opportunities(owner_id,stage,updated_at);
create table public.bhk_crm_stage_history (
 id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.bhk_crm_opportunities(id) on delete cascade,
 actor_id uuid not null references auth.users(id), from_stage text, to_stage text not null,
 reason text not null check(length(trim(reason)) between 1 and 2000), created_at timestamptz not null default now()
);
create index bhk_crm_history_opportunity on public.bhk_crm_stage_history(opportunity_id,created_at);
create table public.bhk_crm_tasks (
 id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.bhk_crm_opportunities(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 500), due_at timestamptz not null,
 completed_at timestamptz, created_at timestamptz not null default now()
);
create index bhk_crm_tasks_due on public.bhk_crm_tasks(due_at) where completed_at is null;
create index bhk_crm_tasks_opportunity on public.bhk_crm_tasks(opportunity_id);
alter table public.bhk_crm_opportunities enable row level security;
alter table public.bhk_crm_stage_history enable row level security;
alter table public.bhk_crm_tasks enable row level security;
revoke all on public.bhk_crm_opportunities,public.bhk_crm_stage_history,public.bhk_crm_tasks from anon,authenticated;
grant select on public.bhk_crm_opportunities,public.bhk_crm_stage_history,public.bhk_crm_tasks to authenticated;
grant all on public.bhk_crm_opportunities,public.bhk_crm_stage_history,public.bhk_crm_tasks to service_role;
create policy crm_owner on public.bhk_crm_opportunities for select to authenticated using(owner_id=auth.uid());
create policy crm_history_owner on public.bhk_crm_stage_history for select to authenticated using(exists(select 1 from public.bhk_crm_opportunities o where o.id=opportunity_id and o.owner_id=auth.uid()));
create policy crm_task_owner on public.bhk_crm_tasks for select to authenticated using(exists(select 1 from public.bhk_crm_opportunities o where o.id=opportunity_id and o.owner_id=auth.uid()));

create function public.bhk_crm_create(p_client uuid,p_title text,p_purpose text,p_timeline text default '',p_financing text default 'unknown') returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from bhk_realtor_clients where id=p_client and realtor_id=auth.uid()) then raise exception 'Client unavailable'; end if;
 if not exists(select 1 from bhk_broker_subscriptions where user_id=auth.uid() and status='active' and expires_at>now()) then raise exception 'Active broker subscription required'; end if;
 insert into bhk_crm_opportunities(owner_id,client_id,title,purpose,timeline,financing) values(auth.uid(),p_client,trim(p_title),p_purpose,p_timeline,p_financing) returning id into v_id;
 insert into bhk_crm_stage_history(opportunity_id,actor_id,to_stage,reason) values(v_id,auth.uid(),'new','Opportunity created');
 return v_id;
end $$;

create function public.bhk_crm_transition(p_id uuid,p_version integer,p_stage text,p_reason text) returns integer
language plpgsql security definer set search_path=public as $$
declare v_row bhk_crm_opportunities;
begin
 select * into v_row from bhk_crm_opportunities where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Opportunity unavailable'; end if;
 if p_version is distinct from v_row.version then raise exception 'Opportunity changed; reload before saving'; end if;
 if p_stage is null or not (
 (v_row.stage='new' and p_stage in ('contacted','lost')) or
 (v_row.stage='contacted' and p_stage in ('qualified','lost')) or
 (v_row.stage='qualified' and p_stage in ('viewing','negotiating','lost')) or
 (v_row.stage='viewing' and p_stage in ('qualified','negotiating','lost')) or
 (v_row.stage='negotiating' and p_stage in ('viewing','won','lost')) or
 (v_row.stage='lost' and p_stage='contacted')
 ) then raise exception 'Invalid stage transition'; end if;
 insert into bhk_crm_stage_history(opportunity_id,actor_id,from_stage,to_stage,reason) values(p_id,auth.uid(),v_row.stage,p_stage,trim(p_reason));
 update bhk_crm_opportunities set stage=p_stage,version=version+1,updated_at=now() where id=p_id;
 return v_row.version+1;
end $$;

create function public.bhk_crm_add_task(p_opportunity uuid,p_title text,p_due timestamptz) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if not exists(select 1 from bhk_crm_opportunities where id=p_opportunity and owner_id=auth.uid()) then raise exception 'Opportunity unavailable'; end if;
 if not isfinite(p_due) then raise exception 'A finite due date is required'; end if;
 insert into bhk_crm_tasks(opportunity_id,title,due_at) values(p_opportunity,trim(p_title),p_due) returning id into v_id;
 return v_id;
end $$;
create function public.bhk_crm_update_details(p_id uuid,p_version integer,p_title text,p_timeline text,p_financing text) returns integer
language plpgsql security definer set search_path=public as $$
declare v_row bhk_crm_opportunities;
begin
 select * into v_row from bhk_crm_opportunities where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Opportunity unavailable'; end if;
 if p_version is distinct from v_row.version then raise exception 'Opportunity changed; reload before saving'; end if;
 update bhk_crm_opportunities set title=trim(p_title),timeline=p_timeline,financing=p_financing,version=version+1,updated_at=now() where id=p_id;
 return v_row.version+1;
end $$;
create function public.bhk_crm_complete_task(p_task uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 update bhk_crm_tasks t set completed_at=coalesce(completed_at,now()) where t.id=p_task and exists(select 1 from bhk_crm_opportunities o where o.id=t.opportunity_id and o.owner_id=auth.uid());
 if not found then raise exception 'Task unavailable'; end if;
end $$;
revoke all on function public.bhk_crm_create(uuid,text,text,text,text),public.bhk_crm_transition(uuid,integer,text,text),public.bhk_crm_add_task(uuid,text,timestamptz),public.bhk_crm_complete_task(uuid) from public,anon;
grant execute on function public.bhk_crm_create(uuid,text,text,text,text),public.bhk_crm_transition(uuid,integer,text,text),public.bhk_crm_add_task(uuid,text,timestamptz),public.bhk_crm_complete_task(uuid) to authenticated;
revoke all on function public.bhk_crm_update_details(uuid,integer,text,text,text) from public,anon;
grant execute on function public.bhk_crm_update_details(uuid,integer,text,text,text) to authenticated;
commit;
