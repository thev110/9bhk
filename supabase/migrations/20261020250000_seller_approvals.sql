begin;
-- Seller questions are deliberately limited to transaction needs, not personal/protected traits.
create table public.bhk_seller_question_sets (
 property_id text not null references public.bhk_properties(id),version integer not null,
 questions text[] not null,required_questions text[] not null,created_at timestamptz not null default now(),primary key(property_id,version),
 check(cardinality(questions)<=4 and questions <@ array['budget','timeline','financing','intended_use']::text[] and array_position(questions,null) is null),
 check(required_questions <@ questions and array_position(required_questions,null) is null)
);
create table public.bhk_seller_question_answers (
 request_id uuid not null references public.bhk_viewing_requests(id),version integer not null,
 property_id text not null,question_version integer not null,buyer_id uuid not null references auth.users(id),
 answers jsonb not null check(jsonb_typeof(answers)='object'),created_at timestamptz not null default now(),primary key(request_id,version),
 foreign key(property_id,question_version) references public.bhk_seller_question_sets(property_id,version)
);
create table public.bhk_property_edit_proposals (
 id uuid primary key default gen_random_uuid(),property_id text not null references public.bhk_properties(id),broker_id uuid not null references auth.users(id),
 baseline_hash text not null,baseline_fields jsonb not null,changes jsonb not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 decided_by uuid references auth.users(id),decision_reason text check(length(trim(decision_reason)) between 1 and 2000),
 created_at timestamptz not null default now(),decided_at timestamptz
);
alter table public.bhk_seller_question_sets enable row level security;
alter table public.bhk_seller_question_answers enable row level security;
alter table public.bhk_property_edit_proposals enable row level security;
revoke all on public.bhk_seller_question_sets,public.bhk_seller_question_answers,public.bhk_property_edit_proposals from anon,authenticated;
grant select on public.bhk_seller_question_sets to anon,authenticated;
grant select on public.bhk_seller_question_answers,public.bhk_property_edit_proposals to authenticated;
grant all on public.bhk_seller_question_sets,public.bhk_seller_question_answers,public.bhk_property_edit_proposals to service_role;
create policy seller_questions_public on public.bhk_seller_question_sets for select to anon,authenticated using(exists(select 1 from bhk_public_properties p where p.id=property_id));
create policy seller_questions_owner on public.bhk_seller_question_sets for select to authenticated using(exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create policy seller_answers_scoped on public.bhk_seller_question_answers for select to authenticated using(buyer_id=auth.uid() or bhk_my_property_capability(property_id,'viewings') or exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create policy seller_question_answered on public.bhk_seller_question_sets for select to authenticated using(exists(select 1 from bhk_seller_question_answers a where a.property_id=bhk_seller_question_sets.property_id and a.question_version=bhk_seller_question_sets.version));
create policy property_proposals_scoped on public.bhk_property_edit_proposals for select to authenticated using((broker_id=auth.uid() and bhk_my_property_capability(property_id,'edit-proposal')) or exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid()));

create function public.bhk_configure_seller_questions(p_property text,p_version integer,p_questions text[],p_required text[]) returns integer language plpgsql security definer set search_path=public as $$
declare v_version integer;
begin
 perform 1 from bhk_properties where id=p_property and host_id=auth.uid() and is_for_sale=true for update;
 if not found then raise exception 'Owned sale property required';end if;
 select coalesce(max(version),0) into v_version from bhk_seller_question_sets where property_id=p_property;
 if p_version is distinct from v_version then raise exception 'Questions changed; reload';end if;
 if cardinality(p_questions)<>(select count(distinct q) from unnest(p_questions) q) or cardinality(p_required)<>(select count(distinct q) from unnest(p_required) q) then raise exception 'Duplicate questions are not allowed';end if;
 insert into bhk_seller_question_sets(property_id,version,questions,required_questions) values(p_property,v_version+1,p_questions,p_required);
 return v_version+1;
end $$;
create function public.bhk_answer_seller_questions(p_request uuid,p_question_version integer,p_answer_version integer,p_answers jsonb) returns integer language plpgsql security definer set search_path=public as $$
declare r bhk_viewing_requests;q bhk_seller_question_sets;v_version integer;v_key text;v_min numeric;v_max numeric;
begin
 select * into r from bhk_viewing_requests where id=p_request and user_id=auth.uid() for update;
 if not found then raise exception 'Own viewing request required';end if;
 perform 1 from bhk_properties where id=r.property_id and status='published' and is_for_sale=true for share;
 if not found then raise exception 'Sale property unavailable';end if;
 select * into q from bhk_seller_question_sets where property_id=r.property_id order by version desc limit 1;
 if not found or p_question_version is distinct from q.version then raise exception 'Questions changed; reload';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object' then raise exception 'Answers must be an object';end if;
 for v_key in select jsonb_object_keys(p_answers) loop
  if not(v_key=any(q.questions)) or p_answers->v_key='null'::jsonb then raise exception 'Unsupported or null answer';end if;
 end loop;
 if exists(select 1 from unnest(q.required_questions) k where not(p_answers?k)) then raise exception 'Required answers are missing';end if;
 if p_answers?'budget' then
  if jsonb_typeof(p_answers->'budget')<>'object' or not(p_answers->'budget'?'minPaise') or not(p_answers->'budget'?'maxPaise') or exists(select 1 from jsonb_object_keys(p_answers->'budget') k where k not in ('minPaise','maxPaise')) then raise exception 'Budget requires minPaise and maxPaise only';end if;
  if jsonb_typeof(p_answers->'budget'->'minPaise')<>'number' or jsonb_typeof(p_answers->'budget'->'maxPaise')<>'number' then raise exception 'Budget must use integer paise';end if;
  v_min:=(p_answers->'budget'->>'minPaise')::numeric;v_max:=(p_answers->'budget'->>'maxPaise')::numeric;
  if v_min<0 or v_max<v_min or v_max>9007199254740991 or v_min<>trunc(v_min) or v_max<>trunc(v_max) then raise exception 'Invalid integer-paise budget range';end if;
 end if;
 if p_answers?'timeline' and (jsonb_typeof(p_answers->'timeline')<>'string' or p_answers->>'timeline' not in ('within_3_months','3_to_6_months','6_to_12_months','exploring')) then raise exception 'Invalid purchase timeline';end if;
 if p_answers?'financing' and (jsonb_typeof(p_answers->'financing')<>'string' or p_answers->>'financing' not in ('unknown','cash_self_reported','loan_needed','preapproved_self_reported')) then raise exception 'Invalid financing declaration';end if;
 if p_answers?'intended_use' and (jsonb_typeof(p_answers->'intended_use')<>'string' or p_answers->>'intended_use' not in ('primary_home','second_home','investment','undecided')) then raise exception 'Invalid intended use';end if;
 select coalesce(max(version),0) into v_version from bhk_seller_question_answers where request_id=r.id;
 if p_answer_version is distinct from v_version then raise exception 'Answers changed; reload';end if;
 insert into bhk_seller_question_answers(request_id,version,property_id,question_version,buyer_id,answers) values(r.id,v_version+1,r.property_id,q.version,auth.uid(),p_answers);
 return v_version+1;
end $$;

create function public.bhk_edit_proposal_context(p_property text) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare p bhk_properties;
begin
 select * into p from bhk_properties where id=p_property;
 if not found or auth.uid() is null or not(p.host_id=auth.uid() or bhk_property_capability(auth.uid(),p_property,'edit-proposal')) then raise exception 'Property editing context unavailable';end if;
 return jsonb_build_object('baselineHash',md5(to_jsonb(p)::text),'fields',jsonb_build_object('name',p.name,'description',p.description,'sale_price',p.sale_price));
end $$;
create function public.bhk_submit_property_edit_proposal(p_property text,p_baseline text,p_changes jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare p bhk_properties;v_id uuid;v_key text;v_price numeric;
begin
 select * into p from bhk_properties where id=p_property for share;
 if not found or not bhk_property_capability(auth.uid(),p_property,'edit-proposal') then raise exception 'Active edit-proposal mandate required';end if;
 if p_baseline is distinct from md5(to_jsonb(p)::text) then raise exception 'Property changed; reload before proposing';end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb then raise exception 'Provide proposed fields';end if;
 for v_key in select jsonb_object_keys(p_changes) loop if v_key not in ('name','description','sale_price') then raise exception 'Only name, description and sale price may be proposed';end if;end loop;
 if p_changes?'name' and (jsonb_typeof(p_changes->'name')<>'string' or length(trim(p_changes->>'name')) not between 1 and 200) then raise exception 'Invalid proposed name';end if;
 if p_changes?'description' and (jsonb_typeof(p_changes->'description')<>'string' or length(trim(p_changes->>'description')) not between 20 and 12000) then raise exception 'Invalid proposed description';end if;
 if p_changes?'sale_price' then
  if jsonb_typeof(p_changes->'sale_price')<>'number' then raise exception 'Sale price must be integer INR';end if;
  v_price:=(p_changes->>'sale_price')::numeric;if v_price<1 or v_price>9007199254740991 or v_price<>trunc(v_price) then raise exception 'Sale price must be positive integer INR';end if;
 end if;
 insert into bhk_property_edit_proposals(property_id,broker_id,baseline_hash,baseline_fields,changes) values(p_property,auth.uid(),p_baseline,jsonb_build_object('name',p.name,'description',p.description,'sale_price',p.sale_price),p_changes) returning id into v_id;return v_id;
end $$;
create function public.bhk_decide_property_edit_proposal(p_id uuid,p_baseline text,p_approve boolean,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare e bhk_property_edit_proposals;p bhk_properties;
begin
 select * into e from bhk_property_edit_proposals where id=p_id;
 if not found then raise exception 'Proposal unavailable';end if;
 select * into p from bhk_properties where id=e.property_id and host_id=auth.uid() for update;
 if not found then raise exception 'Current property owner approval required';end if;
 select * into e from bhk_property_edit_proposals where id=p_id for update;
 if e.status<>'pending' or p_approve is null then raise exception 'Proposal already decided or invalid decision';end if;
 if p_baseline is distinct from e.baseline_hash then raise exception 'Proposal baseline changed';end if;
 if p_approve then
  if md5(to_jsonb(p)::text) is distinct from e.baseline_hash then raise exception 'Property changed; request a fresh proposal';end if;
  perform 1 from bhk_property_mandates m where m.property_id=p.id and m.owner_id=p.host_id and m.broker_id=e.broker_id and m.status='approved' and m.starts_at<=clock_timestamp() and m.expires_at>clock_timestamp() and 'edit-proposal'=any(m.capabilities) limit 1 for share;
  if not found then raise exception 'Broker edit permission expired or was revoked';end if;
  -- Explicitly return to draft and remove previous verification. Existing property triggers still run.
  update bhk_properties set name=case when e.changes?'name' then trim(e.changes->>'name') else name end,
   description=case when e.changes?'description' then trim(e.changes->>'description') else description end,
   blurb=case when e.changes?'description' then trim(e.changes->>'description') else blurb end,
   sale_price=case when e.changes?'sale_price' then (e.changes->>'sale_price')::bigint else sale_price end,
   status='draft',verification_status='unverified',verification_type=null,verification_date=null,verified_by=null,reviewed_by=null,reviewed_at=null,review_note=null where id=p.id;
 end if;
 if p_reason is null or length(trim(p_reason))=0 then raise exception 'Decision reason required';end if;
 update bhk_property_edit_proposals set status=case when p_approve then 'approved' else 'rejected' end,decided_by=auth.uid(),decision_reason=trim(p_reason),decided_at=now() where id=e.id;
end $$;
revoke all on function public.bhk_configure_seller_questions(text,integer,text[],text[]),public.bhk_answer_seller_questions(uuid,integer,integer,jsonb),public.bhk_edit_proposal_context(text),public.bhk_submit_property_edit_proposal(text,text,jsonb),public.bhk_decide_property_edit_proposal(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.bhk_configure_seller_questions(text,integer,text[],text[]),public.bhk_answer_seller_questions(uuid,integer,integer,jsonb),public.bhk_edit_proposal_context(text),public.bhk_submit_property_edit_proposal(text,text,jsonb),public.bhk_decide_property_edit_proposal(uuid,text,boolean,text) to authenticated;
commit;
