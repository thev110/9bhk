begin;
create table public.bhk_broker_teams(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),name text not null check(length(trim(name)) between 1 and 160),created_at timestamptz not null default now());
create table public.bhk_broker_team_members(team_id uuid not null references public.bhk_broker_teams(id),user_id uuid not null references auth.users(id),role text not null check(role in ('member','manager')),status text not null check(status in ('invited','active','revoked')),accepted_at timestamptz,updated_at timestamptz not null default now(),primary key(team_id,user_id));
create table public.bhk_crm_assignments(opportunity_id uuid primary key references public.bhk_crm_opportunities(id),team_id uuid not null references public.bhk_broker_teams(id),assignee_id uuid not null references auth.users(id),share_contact boolean not null,active boolean not null default true,version integer not null default 1,approved_by uuid not null references auth.users(id),updated_at timestamptz not null default now());
create table public.bhk_crm_handovers(id uuid primary key default gen_random_uuid(),opportunity_id uuid not null references public.bhk_crm_opportunities(id),team_id uuid not null references public.bhk_broker_teams(id),requested_by uuid not null references auth.users(id),target_id uuid not null references auth.users(id),assignment_version integer not null,status text not null default 'pending' check(status in ('pending','approved','rejected')),reason text not null check(length(trim(reason)) between 1 and 2000),decided_by uuid references auth.users(id),decided_at timestamptz,created_at timestamptz not null default now());
create table public.bhk_crm_assignment_events(id uuid primary key default gen_random_uuid(),opportunity_id uuid not null references public.bhk_crm_opportunities(id),actor_id uuid not null references auth.users(id),assignee_id uuid references auth.users(id),share_contact boolean not null,active boolean not null default true,version integer not null,created_at timestamptz not null default now());
create index bhk_crm_assignment_assignee on public.bhk_crm_assignments(assignee_id,team_id);
create index bhk_crm_handover_opportunity on public.bhk_crm_handovers(opportunity_id);
alter table public.bhk_broker_teams enable row level security;
alter table public.bhk_broker_team_members enable row level security;
alter table public.bhk_crm_assignments enable row level security;
alter table public.bhk_crm_handovers enable row level security;
alter table public.bhk_crm_assignment_events enable row level security;
revoke all on public.bhk_broker_teams,public.bhk_broker_team_members,public.bhk_crm_assignments,public.bhk_crm_handovers,public.bhk_crm_assignment_events from anon,authenticated;
grant select on public.bhk_broker_teams,public.bhk_broker_team_members,public.bhk_crm_assignments,public.bhk_crm_handovers,public.bhk_crm_assignment_events to authenticated;
grant all on public.bhk_broker_teams,public.bhk_broker_team_members,public.bhk_crm_assignments,public.bhk_crm_handovers,public.bhk_crm_assignment_events to service_role;
create function public.bhk_team_participant(p_team uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from bhk_broker_teams where id=p_team and owner_id=auth.uid()) or exists(select 1 from bhk_broker_team_members where team_id=p_team and user_id=auth.uid() and status in ('invited','active')) $$;
create function public.bhk_crm_can_access(p_actor uuid,p_opportunity uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from bhk_crm_opportunities o where o.id=p_opportunity and (o.owner_id=p_actor or exists(select 1 from bhk_crm_assignments a join bhk_broker_teams t on t.id=a.team_id join bhk_broker_team_members m on m.team_id=t.id and m.user_id=a.assignee_id where a.opportunity_id=o.id and a.assignee_id=p_actor and a.active and m.status='active' and t.owner_id=o.owner_id))) $$;
create function public.bhk_crm_my_access(p_opportunity uuid) returns boolean language sql stable security definer set search_path=public as $$ select bhk_crm_can_access(auth.uid(),p_opportunity) $$;
create policy team_participant on public.bhk_broker_teams for select to authenticated using(bhk_team_participant(id));
create policy member_self_owner on public.bhk_broker_team_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from bhk_broker_teams t where t.id=team_id and t.owner_id=auth.uid()));
create policy assignment_access on public.bhk_crm_assignments for select to authenticated using(bhk_crm_my_access(opportunity_id));
create policy handover_access on public.bhk_crm_handovers for select to authenticated using(bhk_crm_my_access(opportunity_id));
create policy assignment_event_access on public.bhk_crm_assignment_events for select to authenticated using(bhk_crm_my_access(opportunity_id));
create policy crm_assignee on public.bhk_crm_opportunities for select to authenticated using(bhk_crm_my_access(id));
create policy crm_history_assignee on public.bhk_crm_stage_history for select to authenticated using(bhk_crm_my_access(opportunity_id));
create policy crm_task_assignee on public.bhk_crm_tasks for select to authenticated using(bhk_crm_my_access(opportunity_id));

create function public.bhk_create_broker_team(p_name text) returns uuid language plpgsql security definer set search_path=public as $$ declare v_id uuid;begin
 if auth.uid() is null or not exists(select 1 from bhk_broker_subscriptions where user_id=auth.uid() and status='active' and expires_at>now()) then raise exception 'Active broker subscription required';end if;
 insert into bhk_broker_teams(owner_id,name) values(auth.uid(),trim(p_name)) returning id into v_id;return v_id;end $$;
create function public.bhk_manage_team_member(p_team uuid,p_user uuid,p_role text,p_status text) returns void language plpgsql security definer set search_path=public as $$ begin
 perform 1 from bhk_broker_teams where id=p_team and owner_id=auth.uid() for update;if not found or p_user=auth.uid() then raise exception 'Team unavailable';end if;
 if p_status is null or p_status not in ('invited','revoked') then raise exception 'Only recipient may accept an invitation';end if;
 if p_status='invited' and exists(select 1 from bhk_broker_team_members where team_id=p_team and user_id=p_user and status='active') then
  update bhk_broker_team_members set role=p_role,updated_at=now() where team_id=p_team and user_id=p_user;
 else
  insert into bhk_broker_team_members(team_id,user_id,role,status) values(p_team,p_user,p_role,p_status) on conflict(team_id,user_id) do update set role=p_role,status=p_status,accepted_at=null,updated_at=now();
 end if;
 if p_status='revoked' then update bhk_crm_assignments set active=false,share_contact=false,version=version+1,updated_at=now() where team_id=p_team and assignee_id=p_user;end if;
 end $$;
create function public.bhk_accept_team_invitation(p_team uuid) returns void language plpgsql security definer set search_path=public as $$ begin
 perform 1 from bhk_broker_teams where id=p_team for update;
 update bhk_broker_team_members set status='active',accepted_at=now(),updated_at=now() where team_id=p_team and user_id=auth.uid() and status='invited';if not found then raise exception 'Invitation unavailable';end if;end $$;
create function public.bhk_assign_crm_opportunity(p_opportunity uuid,p_team uuid,p_assignee uuid,p_share_contact boolean,p_version integer) returns integer language plpgsql security definer set search_path=public as $$ declare v_version integer;begin
 perform 1 from bhk_broker_teams where id=p_team and owner_id=auth.uid() for update;if not found then raise exception 'Owned team required';end if;
 perform 1 from bhk_crm_opportunities where id=p_opportunity and owner_id=auth.uid() for update;if not found then raise exception 'Owned opportunity required';end if;
 if not exists(select 1 from bhk_broker_team_members where team_id=p_team and user_id=p_assignee and status='active') then raise exception 'Active accepted team member required';end if;
 select version into v_version from bhk_crm_assignments where opportunity_id=p_opportunity;
 if p_version is distinct from coalesce(v_version,0) then raise exception 'Assignment changed; reload';end if;
 insert into bhk_crm_assignments(opportunity_id,team_id,assignee_id,share_contact,approved_by) values(p_opportunity,p_team,p_assignee,p_share_contact,auth.uid()) on conflict(opportunity_id) do update set team_id=p_team,assignee_id=p_assignee,share_contact=p_share_contact,active=true,approved_by=auth.uid(),version=bhk_crm_assignments.version+1,updated_at=now();
 insert into bhk_crm_assignment_events(opportunity_id,actor_id,assignee_id,share_contact,version) values(p_opportunity,auth.uid(),p_assignee,p_share_contact,coalesce(v_version,0)+1);return coalesce(v_version,0)+1;end $$;
-- Lock team membership before authorizing a write, so revocation serializes with CRM mutations.
create function public.bhk_crm_require_access(p_opportunity uuid) returns void language plpgsql security definer set search_path=public as $$ declare v_team uuid;begin
 select team_id into v_team from bhk_crm_assignments where opportunity_id=p_opportunity;
 if v_team is not null then perform 1 from bhk_broker_teams where id=v_team for update;end if;
 perform 1 from bhk_crm_opportunities where id=p_opportunity for update;
 if not bhk_crm_can_access(auth.uid(),p_opportunity) then raise exception 'Opportunity unavailable';end if;end $$;
create function public.bhk_request_crm_handover(p_opportunity uuid,p_target uuid,p_reason text) returns uuid language plpgsql security definer set search_path=public as $$ declare a bhk_crm_assignments;v_id uuid;begin
 perform bhk_crm_require_access(p_opportunity);select * into a from bhk_crm_assignments where opportunity_id=p_opportunity;
 if not found or not exists(select 1 from bhk_broker_team_members where team_id=a.team_id and user_id=p_target and status='active') then raise exception 'Active target member required';end if;
 insert into bhk_crm_handovers(opportunity_id,team_id,requested_by,target_id,assignment_version,reason) values(p_opportunity,a.team_id,auth.uid(),p_target,a.version,trim(p_reason)) returning id into v_id;return v_id;end $$;
create function public.bhk_decide_crm_handover(p_id uuid,p_approve boolean,p_share_contact boolean) returns void language plpgsql security definer set search_path=public as $$ declare h bhk_crm_handovers;begin
 select * into h from bhk_crm_handovers where id=p_id;if not found then raise exception 'Handover unavailable';end if;
 perform 1 from bhk_broker_teams where id=h.team_id and owner_id=auth.uid() for update;if not found then raise exception 'Team owner approval required';end if;
 select * into h from bhk_crm_handovers where id=p_id for update;if h.status<>'pending' or p_approve is null then raise exception 'Handover already decided or invalid decision';end if;
 if p_approve then perform bhk_assign_crm_opportunity(h.opportunity_id,h.team_id,h.target_id,p_share_contact,h.assignment_version);end if;
 update bhk_crm_handovers set status=case when p_approve then 'approved' else 'rejected' end,decided_by=auth.uid(),decided_at=now() where id=p_id;end $$;
create function public.bhk_crm_shared_contact(p_opportunity uuid) returns table(name text,phone text,email text) language plpgsql stable security definer set search_path=public as $$ begin
 if not bhk_crm_can_access(auth.uid(),p_opportunity) then raise exception 'Opportunity unavailable';end if;
 return query select c.name,c.phone,c.email from bhk_crm_opportunities o join bhk_realtor_clients c on c.id=o.client_id where o.id=p_opportunity and c.realtor_id=o.owner_id and (o.owner_id=auth.uid() or exists(select 1 from bhk_crm_assignments a where a.opportunity_id=o.id and a.assignee_id=auth.uid() and a.share_contact));end $$;
revoke all on function public.bhk_team_participant(uuid),public.bhk_crm_can_access(uuid,uuid),public.bhk_crm_my_access(uuid),public.bhk_create_broker_team(text),public.bhk_manage_team_member(uuid,uuid,text,text),public.bhk_accept_team_invitation(uuid),public.bhk_assign_crm_opportunity(uuid,uuid,uuid,boolean,integer),public.bhk_crm_require_access(uuid),public.bhk_request_crm_handover(uuid,uuid,text),public.bhk_decide_crm_handover(uuid,boolean,boolean),public.bhk_crm_shared_contact(uuid) from public,anon,authenticated;
grant execute on function public.bhk_team_participant(uuid),public.bhk_crm_my_access(uuid),public.bhk_create_broker_team(text),public.bhk_manage_team_member(uuid,uuid,text,text),public.bhk_accept_team_invitation(uuid),public.bhk_assign_crm_opportunity(uuid,uuid,uuid,boolean,integer),public.bhk_request_crm_handover(uuid,uuid,text),public.bhk_decide_crm_handover(uuid,boolean,boolean),public.bhk_crm_shared_contact(uuid) to authenticated;
grant execute on function public.bhk_crm_can_access(uuid,uuid) to service_role;
create or replace function public.bhk_crm_transition(p_id uuid,p_version integer,p_stage text,p_reason text) returns integer
language plpgsql security definer set search_path=public as $$
declare v_row bhk_crm_opportunities;
begin
 perform bhk_crm_require_access(p_id);
 select * into v_row from bhk_crm_opportunities where id=p_id for update;
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

create or replace function public.bhk_crm_add_task(p_opportunity uuid,p_title text,p_due timestamptz) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 perform bhk_crm_require_access(p_opportunity);
 if not isfinite(p_due) then raise exception 'A finite due date is required'; end if;
 insert into bhk_crm_tasks(opportunity_id,title,due_at) values(p_opportunity,trim(p_title),p_due) returning id into v_id;
 return v_id;
end $$;
create or replace function public.bhk_crm_update_details(p_id uuid,p_version integer,p_title text,p_timeline text,p_financing text) returns integer
language plpgsql security definer set search_path=public as $$
declare v_row bhk_crm_opportunities;
begin
 perform bhk_crm_require_access(p_id);
 select * into v_row from bhk_crm_opportunities where id=p_id for update;
 if not found then raise exception 'Opportunity unavailable'; end if;
 if p_version is distinct from v_row.version then raise exception 'Opportunity changed; reload before saving'; end if;
 update bhk_crm_opportunities set title=trim(p_title),timeline=p_timeline,financing=p_financing,version=version+1,updated_at=now() where id=p_id;
 return v_row.version+1;
end $$;
create or replace function public.bhk_crm_complete_task(p_task uuid) returns void
language plpgsql security definer set search_path=public as $$
declare v_opportunity uuid;
begin
 select opportunity_id into v_opportunity from bhk_crm_tasks where id=p_task;
 perform bhk_crm_require_access(v_opportunity);
 update bhk_crm_tasks t set completed_at=coalesce(completed_at,now()) where t.id=p_task and exists(select 1 from bhk_crm_opportunities o where o.id=t.opportunity_id and bhk_crm_can_access(auth.uid(),o.id));
 if not found then raise exception 'Task unavailable'; end if;
end $$;

create function public.bhk_revoke_crm_assignment(p_opportunity uuid,p_version integer) returns void language plpgsql security definer set search_path=public as $$
declare a bhk_crm_assignments;
begin
 select * into a from bhk_crm_assignments where opportunity_id=p_opportunity;
 if not found then raise exception 'Assignment unavailable';end if;
 perform 1 from bhk_broker_teams where id=a.team_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Team owner required';end if;
 perform 1 from bhk_crm_opportunities where id=p_opportunity and owner_id=auth.uid() for update;
 if not found then raise exception 'Opportunity owner required';end if;
 select * into a from bhk_crm_assignments where opportunity_id=p_opportunity for update;
 if p_version is distinct from a.version then raise exception 'Assignment changed; reload';end if;
 update bhk_crm_assignments set active=false,share_contact=false,version=version+1,updated_at=now() where opportunity_id=p_opportunity;
 insert into bhk_crm_assignment_events(opportunity_id,actor_id,assignee_id,share_contact,version) values(p_opportunity,auth.uid(),null,false,a.version+1);
end $$;
revoke all on function public.bhk_revoke_crm_assignment(uuid,integer) from public,anon,authenticated;
grant execute on function public.bhk_revoke_crm_assignment(uuid,integer) to authenticated;
commit;
