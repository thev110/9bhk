begin;
-- Co-broker agreements document assent and disputes; they never create automatic financial entitlement.
create table public.bhk_cobroker_agreements (
 id uuid primary key default gen_random_uuid(),property_id text not null references public.bhk_properties(id),owner_id uuid not null references auth.users(id),
 broker_a uuid not null references auth.users(id),broker_b uuid not null references auth.users(id),created_by uuid not null references auth.users(id),
 current_version integer not null default 1,status text not null default 'draft' check(status in ('draft','agreed','disputed')),resolving_dispute boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(broker_a<>broker_b and owner_id not in (broker_a,broker_b))
);
create table public.bhk_cobroker_agreement_revisions (
 agreement_id uuid not null references public.bhk_cobroker_agreements(id),version integer not null,
 payer_id uuid not null references auth.users(id),commission_paise bigint not null check(commission_paise between 1 and 9007199254740991),
 broker_a_paise bigint not null check(broker_a_paise>=0),broker_b_paise bigint not null check(broker_b_paise>=0),currency text not null default 'INR' check(currency='INR'),
 milestones text not null check(length(trim(milestones)) between 1 and 4000),attribution text not null check(length(trim(attribution)) between 1 and 4000),
 terms text not null check(length(trim(terms)) between 1 and 6000),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 primary key(agreement_id,version),check(broker_a_paise::numeric+broker_b_paise::numeric=commission_paise)
);
create table public.bhk_cobroker_acceptances (
 agreement_id uuid not null,version integer not null,actor_id uuid not null references auth.users(id),role text not null check(role in ('owner','broker_a','broker_b')),
 created_at timestamptz not null default now(),primary key(agreement_id,version,role),unique(agreement_id,version,actor_id),
 foreign key(agreement_id,version) references public.bhk_cobroker_agreement_revisions(agreement_id,version)
);
create table public.bhk_cobroker_events (
 id uuid primary key default gen_random_uuid(),agreement_id uuid not null references public.bhk_cobroker_agreements(id),version integer not null,
 actor_id uuid not null references auth.users(id),action text not null check(action in ('proposed','revised','accepted','disputed','resolved')),
 reason text not null check(length(trim(reason)) between 1 and 2000),created_at timestamptz not null default now(),
 foreign key(agreement_id,version) references public.bhk_cobroker_agreement_revisions(agreement_id,version)
);
alter table public.bhk_cobroker_agreements enable row level security;
alter table public.bhk_cobroker_agreement_revisions enable row level security;
alter table public.bhk_cobroker_acceptances enable row level security;
alter table public.bhk_cobroker_events enable row level security;
revoke all on public.bhk_cobroker_agreements,public.bhk_cobroker_agreement_revisions,public.bhk_cobroker_acceptances,public.bhk_cobroker_events from anon,authenticated;
grant select on public.bhk_cobroker_agreements,public.bhk_cobroker_agreement_revisions,public.bhk_cobroker_acceptances,public.bhk_cobroker_events to authenticated;
grant all on public.bhk_cobroker_agreements,public.bhk_cobroker_agreement_revisions,public.bhk_cobroker_acceptances,public.bhk_cobroker_events to service_role;
create policy cobroker_participant on public.bhk_cobroker_agreements for select to authenticated using(auth.uid() in (owner_id,broker_a,broker_b));
create policy cobroker_revision_participant on public.bhk_cobroker_agreement_revisions for select to authenticated using(exists(select 1 from bhk_cobroker_agreements a where a.id=agreement_id));
create policy cobroker_acceptance_participant on public.bhk_cobroker_acceptances for select to authenticated using(exists(select 1 from bhk_cobroker_agreements a where a.id=agreement_id));
create policy cobroker_event_participant on public.bhk_cobroker_events for select to authenticated using(exists(select 1 from bhk_cobroker_agreements a where a.id=agreement_id));

create function public.bhk_propose_cobroker_agreement(p_property text,p_broker_a uuid,p_broker_b uuid,p_payer uuid,p_commission bigint,p_share_a bigint,p_share_b bigint,p_milestones text,p_attribution text,p_terms text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_owner uuid;v_id uuid;
begin
 select host_id into v_owner from bhk_properties where id=p_property and status='published' and is_for_sale=true for share;
 if not found or auth.uid() is null or not(auth.uid()=v_owner or (auth.uid() in (p_broker_a,p_broker_b) and (bhk_property_capability(auth.uid(),p_property,'marketing') or bhk_property_capability(auth.uid(),p_property,'offers')))) then raise exception 'Owner or mandated participating broker required';end if;
 if p_payer is null or p_payer not in (v_owner,p_broker_a,p_broker_b) then raise exception 'Payer must be a consenting agreement participant';end if;
 insert into bhk_cobroker_agreements(property_id,owner_id,broker_a,broker_b,created_by) values(p_property,v_owner,p_broker_a,p_broker_b,auth.uid()) returning id into v_id;
 insert into bhk_cobroker_agreement_revisions(agreement_id,version,payer_id,commission_paise,broker_a_paise,broker_b_paise,milestones,attribution,terms,created_by) values(v_id,1,p_payer,p_commission,p_share_a,p_share_b,trim(p_milestones),trim(p_attribution),trim(p_terms),auth.uid());
 insert into bhk_cobroker_events(agreement_id,version,actor_id,action,reason) values(v_id,1,auth.uid(),'proposed','Terms proposed for explicit owner and broker acceptance');return v_id;
end $$;
create function public.bhk_revise_cobroker_agreement(p_id uuid,p_version integer,p_payer uuid,p_commission bigint,p_share_a bigint,p_share_b bigint,p_milestones text,p_attribution text,p_terms text) returns integer language plpgsql security definer set search_path=public as $$
declare a bhk_cobroker_agreements;
begin
 select * into a from bhk_cobroker_agreements where id=p_id and auth.uid() in (owner_id,broker_a,broker_b) for update;
 if not found then raise exception 'Agreement unavailable';end if;
 if a.status not in ('draft','disputed') then raise exception 'Agreed terms are immutable; record a dispute before proposing resolution';end if;
 if p_version is distinct from a.current_version then raise exception 'Agreement changed; reload';end if;
 if p_payer is null or p_payer not in (a.owner_id,a.broker_a,a.broker_b) then raise exception 'Payer must be a consenting agreement participant';end if;
 insert into bhk_cobroker_agreement_revisions(agreement_id,version,payer_id,commission_paise,broker_a_paise,broker_b_paise,milestones,attribution,terms,created_by) values(a.id,a.current_version+1,p_payer,p_commission,p_share_a,p_share_b,trim(p_milestones),trim(p_attribution),trim(p_terms),auth.uid());
 update bhk_cobroker_agreements set current_version=current_version+1,status='draft',resolving_dispute=(resolving_dispute or a.status='disputed'),updated_at=now() where id=a.id;
 insert into bhk_cobroker_events(agreement_id,version,actor_id,action,reason) values(a.id,a.current_version+1,auth.uid(),'revised','New revision requires fresh acceptance by all three parties');return a.current_version+1;
end $$;
create function public.bhk_accept_cobroker_agreement(p_id uuid,p_version integer) returns void language plpgsql security definer set search_path=public as $$
declare a bhk_cobroker_agreements;v_role text;
begin
 select * into a from bhk_cobroker_agreements where id=p_id and auth.uid() in (owner_id,broker_a,broker_b) for update;
 if not found then raise exception 'Agreement unavailable';end if;
 if p_version is distinct from a.current_version or a.status<>'draft' then raise exception 'Only the current draft can be accepted';end if;
 perform 1 from bhk_properties where id=a.property_id and host_id=a.owner_id and status='published' and is_for_sale=true for share;
 if not found then raise exception 'Current property owner and sale listing required';end if;
 v_role:=case when auth.uid()=a.owner_id then 'owner' when auth.uid()=a.broker_a then 'broker_a' else 'broker_b' end;
 insert into bhk_cobroker_acceptances(agreement_id,version,actor_id,role) values(a.id,a.current_version,auth.uid(),v_role);
 insert into bhk_cobroker_events(agreement_id,version,actor_id,action,reason) values(a.id,a.current_version,auth.uid(),'accepted','Participant accepted this exact revision');
 if (select count(*) from bhk_cobroker_acceptances where agreement_id=a.id and version=a.current_version)=3 then
  update bhk_cobroker_agreements set status='agreed',resolving_dispute=false,updated_at=now() where id=a.id;
  if a.resolving_dispute then insert into bhk_cobroker_events(agreement_id,version,actor_id,action,reason) values(a.id,a.current_version,auth.uid(),'resolved','All three participants accepted this exact resolution revision; no payment was executed');end if;
 end if;
end $$;
create function public.bhk_dispute_cobroker_agreement(p_id uuid,p_version integer,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare a bhk_cobroker_agreements;
begin
 select * into a from bhk_cobroker_agreements where id=p_id and auth.uid() in (owner_id,broker_a,broker_b) for update;
 if not found then raise exception 'Agreement unavailable';end if;
 if p_version is distinct from a.current_version then raise exception 'Agreement changed; reload';end if;
 update bhk_cobroker_agreements set status='disputed',updated_at=now() where id=a.id;
 insert into bhk_cobroker_events(agreement_id,version,actor_id,action,reason) values(a.id,a.current_version,auth.uid(),'disputed',trim(p_reason));
end $$;
revoke all on function public.bhk_propose_cobroker_agreement(text,uuid,uuid,uuid,bigint,bigint,bigint,text,text,text),public.bhk_revise_cobroker_agreement(uuid,integer,uuid,bigint,bigint,bigint,text,text,text),public.bhk_accept_cobroker_agreement(uuid,integer),public.bhk_dispute_cobroker_agreement(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.bhk_propose_cobroker_agreement(text,uuid,uuid,uuid,bigint,bigint,bigint,text,text,text),public.bhk_revise_cobroker_agreement(uuid,integer,uuid,bigint,bigint,bigint,text,text,text),public.bhk_accept_cobroker_agreement(uuid,integer),public.bhk_dispute_cobroker_agreement(uuid,integer,text) to authenticated;
create table public.bhk_cobroker_milestones (
 id uuid primary key default gen_random_uuid(),agreement_id uuid not null,version integer not null,proposed_by uuid not null references auth.users(id),
 title text not null check(length(trim(title)) between 1 and 300),description text not null check(length(trim(description)) between 1 and 4000),
 amount_paise bigint not null check(amount_paise between 0 and 9007199254740991),due_at timestamptz check(isfinite(due_at)),
 completion_claimed_by uuid references auth.users(id),completion_claimed_at timestamptz,completion_note text,
 payment_claimed_by uuid references auth.users(id),payment_claimed_at timestamptz,payment_note text,receipt_reference text check(length(trim(receipt_reference)) between 1 and 200),
 created_at timestamptz not null default now(),foreign key(agreement_id,version) references public.bhk_cobroker_agreement_revisions(agreement_id,version)
);
create table public.bhk_cobroker_milestone_acknowledgements (
 milestone_id uuid not null references public.bhk_cobroker_milestones(id),kind text not null check(kind in ('proposal','completion','payment')),
 actor_id uuid not null references auth.users(id),note text not null check(length(trim(note)) between 1 and 2000),created_at timestamptz not null default now(),primary key(milestone_id,kind,actor_id)
);
alter table public.bhk_cobroker_milestones enable row level security;
alter table public.bhk_cobroker_milestone_acknowledgements enable row level security;
revoke all on public.bhk_cobroker_milestones,public.bhk_cobroker_milestone_acknowledgements from anon,authenticated;
grant select on public.bhk_cobroker_milestones,public.bhk_cobroker_milestone_acknowledgements to authenticated;
grant all on public.bhk_cobroker_milestones,public.bhk_cobroker_milestone_acknowledgements to service_role;
create policy cobroker_milestone_participant on public.bhk_cobroker_milestones for select to authenticated using(exists(select 1 from bhk_cobroker_agreements a where a.id=agreement_id));
create policy cobroker_milestone_ack_participant on public.bhk_cobroker_milestone_acknowledgements for select to authenticated using(exists(select 1 from bhk_cobroker_milestones m where m.id=milestone_id));
create function public.bhk_propose_cobroker_milestone(p_agreement uuid,p_version integer,p_title text,p_description text,p_amount bigint,p_due timestamptz) returns uuid language plpgsql security definer set search_path=public as $$
declare a bhk_cobroker_agreements;v_total bigint;v_id uuid;
begin
 select * into a from bhk_cobroker_agreements where id=p_agreement and auth.uid() in (owner_id,broker_a,broker_b) for update;
 if not found or a.status<>'agreed' or p_version is distinct from a.current_version then raise exception 'Current agreed revision required';end if;
 select commission_paise into v_total from bhk_cobroker_agreement_revisions where agreement_id=a.id and version=a.current_version;
 if p_amount+coalesce((select sum(amount_paise) from bhk_cobroker_milestones where agreement_id=a.id and version=a.current_version),0)>v_total then raise exception 'Milestone amounts exceed the agreed commission';end if;
 insert into bhk_cobroker_milestones(agreement_id,version,proposed_by,title,description,amount_paise,due_at) values(a.id,a.current_version,auth.uid(),trim(p_title),trim(p_description),p_amount,p_due) returning id into v_id;return v_id;
end $$;
create function public.bhk_claim_cobroker_milestone(p_id uuid,p_kind text,p_note text,p_receipt text default null) returns void language plpgsql security definer set search_path=public as $$
declare m bhk_cobroker_milestones;a bhk_cobroker_agreements;v_payer uuid;
begin
 select * into m from bhk_cobroker_milestones where id=p_id;
 if not found then raise exception 'Milestone unavailable';end if;
 select * into a from bhk_cobroker_agreements where id=m.agreement_id and auth.uid() in (owner_id,broker_a,broker_b) for update;
 if not found or a.status<>'agreed' or a.current_version<>m.version then raise exception 'Current agreed revision required';end if;
 select * into m from bhk_cobroker_milestones where id=p_id for update;
 if p_note is null or length(trim(p_note)) not between 1 and 2000 then raise exception 'Claim note required';end if;
 if (select count(*) from bhk_cobroker_milestone_acknowledgements where milestone_id=m.id and kind='proposal')<>2 then raise exception 'Both counterparties must acknowledge the proposed milestone';end if;
 if p_kind='completion' then
  if m.completion_claimed_by is not null then raise exception 'Completion already claimed';end if;
  update bhk_cobroker_milestones set completion_claimed_by=auth.uid(),completion_claimed_at=now(),completion_note=trim(p_note) where id=m.id;
 elsif p_kind='payment' then
  select payer_id into v_payer from bhk_cobroker_agreement_revisions where agreement_id=a.id and version=m.version;
  if v_payer<>auth.uid() then raise exception 'Only the agreed payer can report payment';end if;
  if m.amount_paise<=0 or m.payment_claimed_by is not null then raise exception 'No payable amount or payment already claimed';end if;
  if (select count(*) from bhk_cobroker_milestone_acknowledgements where milestone_id=m.id and kind='completion')<>2 then raise exception 'Both counterparties must acknowledge completion first';end if;
  if p_receipt is null or length(trim(p_receipt)) not between 1 and 200 then raise exception 'An external receipt reference is required';end if;
  update bhk_cobroker_milestones set payment_claimed_by=auth.uid(),payment_claimed_at=now(),payment_note=trim(p_note),receipt_reference=trim(p_receipt) where id=m.id;
 else raise exception 'Invalid milestone claim';end if;
end $$;
create function public.bhk_acknowledge_cobroker_milestone(p_id uuid,p_kind text,p_note text) returns void language plpgsql security definer set search_path=public as $$
declare m bhk_cobroker_milestones;a bhk_cobroker_agreements;v_claimant uuid;
begin
 select * into m from bhk_cobroker_milestones where id=p_id;
 if not found then raise exception 'Milestone unavailable';end if;
 select * into a from bhk_cobroker_agreements where id=m.agreement_id and auth.uid() in (owner_id,broker_a,broker_b) for update;
 if not found or a.status<>'agreed' or a.current_version<>m.version then raise exception 'Current agreed revision required';end if;
 select * into m from bhk_cobroker_milestones where id=p_id for update;
 v_claimant:=case p_kind when 'proposal' then m.proposed_by when 'completion' then m.completion_claimed_by when 'payment' then m.payment_claimed_by else null end;
 if v_claimant is null or v_claimant=auth.uid() then raise exception 'Only a counterparty may acknowledge an existing claim';end if;
 insert into bhk_cobroker_milestone_acknowledgements(milestone_id,kind,actor_id,note) values(m.id,p_kind,auth.uid(),trim(p_note));
end $$;
revoke all on function public.bhk_propose_cobroker_milestone(uuid,integer,text,text,bigint,timestamptz),public.bhk_claim_cobroker_milestone(uuid,text,text,text),public.bhk_acknowledge_cobroker_milestone(uuid,text,text) from public,anon,authenticated;
grant execute on function public.bhk_propose_cobroker_milestone(uuid,integer,text,text,bigint,timestamptz),public.bhk_claim_cobroker_milestone(uuid,text,text,text),public.bhk_acknowledge_cobroker_milestone(uuid,text,text) to authenticated;
commit;
