begin;
create or replace function public.bhk_outbox_relevant(p_id uuid) returns boolean language plpgsql stable security definer set search_path=public as $$
declare job bhk_notification_outbox; search bhk_saved_searches; match bhk_saved_search_matches; quote jsonb; parts text[];
begin
  select * into job from bhk_notification_outbox where id=p_id;
  if not found then return false; end if;
  parts:=string_to_array(job.event_key,':');
  if parts[1]='saved-search' then
    select * into search from bhk_saved_searches where id=parts[2]::uuid and user_id=job.user_id and enabled and revision=parts[3]::integer;
    if not found then return false; end if;
    select * into match from bhk_saved_search_matches where search_id=search.id and fingerprint=parts[4];
    if not found then return false; end if;
    if not exists(select 1 from bhk_properties p where p.id=match.property_id and p.status='published'
      and p.bedrooms>=search.min_bedrooms and lower(trim(p.city))=lower(trim(search.city)) and p.guests>=search.adults+search.children
      and not exists(select 1 from unnest(search.required_features) requested where not exists(
        select 1 from bhk_listing_facts f where f.property_id=p.id and f.fact_key=requested and f.value='true'::jsonb
          and f.review_status='reviewed' and f.expires_at>now() and f.media_id is not null))) then return false; end if;
    quote:=bhk_stay_quote(match.property_id,search.check_in,search.check_out,search.adults,search.children);
    return (quote->>'total')::bigint*100=match.lowest_alerted_paise;
  elsif parts[1]='task-reminder' then
    return exists(select 1 from bhk_crm_tasks t join bhk_crm_opportunities o on o.id=t.opportunity_id
      where t.id=parts[2]::uuid and t.completed_at is null and o.owner_id=job.user_id);
  elsif parts[1]='viewing-reminder' then
    return exists(select 1 from bhk_viewing_appointments a where a.id=parts[2]::uuid and a.version=parts[3]::integer
      and a.status='confirmed' and a.starts_at>now() and job.user_id in(a.buyer_id,a.owner_id));
  end if;
  return true;
exception when others then return false;
end $$;
create function public.bhk_queue_lifecycle_reminders() returns jsonb language plpgsql security definer set search_path=public as $$
declare queued integer:=0; added integer;
begin
  insert into bhk_notification_outbox(user_id,event_key,category,title,body,href,expires_at)
    select o.owner_id,'task-reminder:'||t.id::text,'transactional','Follow-up due',left(t.title,500),'/realtor',now()+interval '1 day'
    from bhk_crm_tasks t join bhk_crm_opportunities o on o.id=t.opportunity_id
    where t.completed_at is null and t.due_at<=now()+interval '1 day' and t.due_at>now()-interval '7 days'
      and not exists(select 1 from bhk_notification_outbox q where q.user_id=o.owner_id and q.event_key='task-reminder:'||t.id::text)
    order by t.due_at limit 50 on conflict(user_id,event_key) do nothing;
  get diagnostics added=row_count; queued:=queued+added;
  insert into bhk_notification_outbox(user_id,event_key,category,title,body,href,expires_at)
    select recipient,'viewing-reminder:'||a.id::text||':'||a.version::text,'transactional','Upcoming viewing',
      'Your confirmed viewing starts at '||to_char(a.starts_at at time zone 'Asia/Kolkata','YYYY-MM-DD HH24:MI')||' IST.',
      case when recipient=a.buyer_id then '/profile' else '/host' end,a.starts_at
    from bhk_viewing_appointments a cross join lateral unnest(array[a.buyer_id,a.owner_id]) recipient
    where a.status='confirmed' and a.starts_at>now() and a.starts_at<=now()+interval '1 day'
      and not exists(select 1 from bhk_notification_outbox q where q.user_id=recipient and q.event_key='viewing-reminder:'||a.id::text||':'||a.version::text)
    order by a.starts_at limit 100 on conflict(user_id,event_key) do nothing;
  get diagnostics added=row_count; queued:=queued+added;
  return jsonb_build_object('queued',queued);
end $$;
revoke all on function bhk_queue_lifecycle_reminders() from public,anon,authenticated;
grant execute on function bhk_queue_lifecycle_reminders() to service_role;
commit;
