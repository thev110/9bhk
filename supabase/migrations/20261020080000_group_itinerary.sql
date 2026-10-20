begin;
create table public.bhk_group_removed_members(
  plan_id uuid not null references bhk_group_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  removed_at timestamptz not null default now(),
  primary key(plan_id,user_id)
);
alter table bhk_group_removed_members enable row level security;
grant select on bhk_group_removed_members to authenticated;
create policy group_removed_owner on bhk_group_removed_members for select to authenticated
using(exists(select 1 from bhk_group_plans where id=plan_id and owner_id=auth.uid()));

create table public.bhk_group_itinerary(
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references bhk_group_plans(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id),
  title text not null check(length(trim(title)) between 1 and 160),
  notes text not null default '' check(length(notes)<=4000),
  starts_at timestamptz not null check(isfinite(starts_at)),
  ends_at timestamptz check(isfinite(ends_at) and ends_at>starts_at),
  created_at timestamptz not null default now()
);
alter table bhk_group_itinerary enable row level security;
grant select,insert,update,delete on bhk_group_itinerary to authenticated;
create policy group_itinerary_read on bhk_group_itinerary for select to authenticated using(bhk_group_member(plan_id));
create policy group_itinerary_add on bhk_group_itinerary for insert to authenticated with check(bhk_group_member(plan_id) and author_id=auth.uid());
create policy group_itinerary_edit on bhk_group_itinerary for update to authenticated
using(bhk_group_member(plan_id) and author_id=auth.uid()) with check(bhk_group_member(plan_id) and author_id=auth.uid());
create policy group_itinerary_remove on bhk_group_itinerary for delete to authenticated
using(bhk_group_member(plan_id) and (author_id=auth.uid() or exists(select 1 from bhk_group_plans where id=plan_id and owner_id=auth.uid())));
create index group_itinerary_dates on bhk_group_itinerary(plan_id,starts_at);

-- Room labels are organiser planning notes, not a guarantee of a booked room or guest/payment role.
create table public.bhk_group_room_preferences(
  plan_id uuid not null references bhk_group_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  preference text not null default '' check(length(preference)<=1000),
  assigned_room text check(length(assigned_room)<=160),
  primary key(plan_id,user_id)
);
alter table bhk_group_room_preferences enable row level security;
grant select on bhk_group_room_preferences to authenticated;
create policy group_rooms_read on bhk_group_room_preferences for select to authenticated using(bhk_group_member(plan_id));
grant all on bhk_group_removed_members,bhk_group_itinerary,bhk_group_room_preferences to service_role;

create or replace function public.bhk_accept_group_invitation(invite_token uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to join a group'; end if;
  select plan_id into target from bhk_group_invitations where token=invite_token and expires_at>now();
  if target is null then raise exception 'Invitation expired or invalid'; end if;
  perform 1 from bhk_group_plans where id=target for update;
  -- Revalidate after obtaining the group lock against concurrent revocation.
  if not exists(select 1 from bhk_group_invitations where token=invite_token and expires_at>now())
    or exists(select 1 from bhk_group_removed_members where plan_id=target and user_id=auth.uid()) then
    raise exception 'Invitation revoked or membership removed';
  end if;
  insert into bhk_group_members(plan_id,user_id) values(target,auth.uid()) on conflict do nothing;
  return target;
end $$;
create function public.bhk_remove_group_member(p_plan uuid,p_user uuid) returns void
language plpgsql security definer set search_path=public as $$
declare organiser uuid;
begin
  select owner_id into organiser from bhk_group_plans where id=p_plan for update;
  if organiser is null or auth.uid() is null or (auth.uid()<>organiser and auth.uid()<>p_user) then raise exception 'Group unavailable'; end if;
  if p_user=organiser then raise exception 'Transfer the group before leaving'; end if;
  if not exists(select 1 from bhk_group_members where plan_id=p_plan and user_id=p_user) then raise exception 'Member unavailable'; end if;
  delete from bhk_group_members where plan_id=p_plan and user_id=p_user;
  insert into bhk_group_removed_members(plan_id,user_id) values(p_plan,p_user) on conflict do nothing;
  delete from bhk_group_room_preferences where plan_id=p_plan and user_id=p_user;
end $$;
-- All removals go through the checked RPC, preventing re-entry via an old link.
revoke delete on bhk_group_members from authenticated;
create function public.bhk_restore_group_invitation_access(p_plan uuid,p_user uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  perform 1 from bhk_group_plans where id=p_plan and owner_id=auth.uid() for update;
  if not found then raise exception 'Only the organiser can restore invitation access'; end if;
  delete from bhk_group_removed_members where plan_id=p_plan and user_id=p_user;
end $$;
create function public.bhk_transfer_group(p_plan uuid,p_owner uuid) returns void
language plpgsql security definer set search_path=public as $$
declare previous uuid;
begin
  select owner_id into previous from bhk_group_plans where id=p_plan and owner_id=auth.uid() for update;
  if previous is null then raise exception 'Only the organiser can transfer a group'; end if;
  if p_owner is null or not exists(select 1 from bhk_group_members where plan_id=p_plan and user_id=p_owner) then raise exception 'Choose an existing member'; end if;
  if exists(select 1 from bhk_group_removed_members where plan_id=p_plan and user_id=p_owner) then raise exception 'Member removed'; end if;
  insert into bhk_group_members(plan_id,user_id) values(p_plan,previous) on conflict do nothing;
  update bhk_group_plans set owner_id=p_owner where id=p_plan;
  delete from bhk_group_invitations where plan_id=p_plan;
end $$;
create function public.bhk_set_room_preference(p_plan uuid,p_preference text) returns void
language plpgsql security definer set search_path=public as $$
begin
  perform 1 from bhk_group_plans where id=p_plan for update;
  if not bhk_group_member(p_plan) then raise exception 'Group unavailable'; end if;
  insert into bhk_group_room_preferences(plan_id,user_id,preference) values(p_plan,auth.uid(),p_preference)
  on conflict(plan_id,user_id) do update set preference=excluded.preference;
end $$;
create function public.bhk_assign_group_room(p_plan uuid,p_user uuid,p_room text) returns void
language plpgsql security definer set search_path=public as $$
begin
  perform 1 from bhk_group_plans where id=p_plan and owner_id=auth.uid() for update;
  if not found then raise exception 'Only the organiser can allocate rooms'; end if;
  if p_user<>auth.uid() and not exists(select 1 from bhk_group_members where plan_id=p_plan and user_id=p_user) then raise exception 'Member unavailable'; end if;
  insert into bhk_group_room_preferences(plan_id,user_id,assigned_room) values(p_plan,p_user,p_room)
  on conflict(plan_id,user_id) do update set assigned_room=excluded.assigned_room;
end $$;
revoke all on function bhk_remove_group_member(uuid,uuid),bhk_restore_group_invitation_access(uuid,uuid),bhk_transfer_group(uuid,uuid),bhk_set_room_preference(uuid,text),bhk_assign_group_room(uuid,uuid,text) from public,anon;
grant execute on function bhk_remove_group_member(uuid,uuid),bhk_restore_group_invitation_access(uuid,uuid),bhk_transfer_group(uuid,uuid),bhk_set_room_preference(uuid,text),bhk_assign_group_room(uuid,uuid,text) to authenticated;
commit;
