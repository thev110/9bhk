-- 9bhk — Evidence-backed listings and listing-quality specifications
-- Requirements G02, S05, D02

begin;
-- 1. Extend bhk_properties with structured architectural & evidence columns
alter table public.bhk_properties
  add column if not exists rooms jsonb default '[]'::jsonb,
  add column if not exists floor_plan_url text,
  add column if not exists overnight_guests integer,
  add column if not exists visitor_capacity integer,
  add column if not exists pool_fenced boolean,
  add column if not exists step_free_access boolean,
  add column if not exists pet_policy jsonb,
  add column if not exists workspace jsonb,
  add column if not exists parking jsonb,
  add column if not exists evidence_claims jsonb default '[]'::jsonb;
-- 2. Evidence review provenance tracking table
create table if not exists public.bhk_property_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties(id) on delete cascade,
  claim_key text not null,
  label text not null,
  category text not null check (category in ('accessibility', 'safety', 'utilities', 'capacity', 'automotive', 'workspace', 'general')),
  status text not null check (status in ('supplied', 'reviewed', 'missing', 'withdrawn')),
  fact_value text not null,
  review_scope text,
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz default now(),
  created_at timestamptz not null default now()
);
create index if not exists bhk_evidence_reviews_property_idx
  on public.bhk_property_evidence_reviews (property_id, claim_key);
alter table public.bhk_property_evidence_reviews enable row level security;
grant select on public.bhk_property_evidence_reviews to anon, authenticated;
grant insert, update, delete on public.bhk_property_evidence_reviews to authenticated;
drop policy if exists bhk_evidence_reviews_read on public.bhk_property_evidence_reviews;
create policy bhk_evidence_reviews_read on public.bhk_property_evidence_reviews
  for select using (true);
drop policy if exists bhk_evidence_reviews_staff on public.bhk_property_evidence_reviews;
create policy bhk_evidence_reviews_staff on public.bhk_property_evidence_reviews
  for all using (public.bhk_is_staff()) with check (public.bhk_is_staff());
-- 3. Trigger to flag evidence claims for re-review if underlying specs change
create or replace function public.bhk_trigger_evidence_rereview()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If accessibility, pool fencing, workspace, or bedroom layout changes, mark claims that were reviewed as needing re-review
  if (old.step_free_access is distinct from new.step_free_access) or
     (old.pool_fenced is distinct from new.pool_fenced) or
     (old.bedrooms is distinct from new.bedrooms) or
     (old.rooms is distinct from new.rooms) or
     (old.workspace is distinct from new.workspace) then

    insert into public.bhk_admin_audit (entity_type, entity_id, action)
    values ('property_evidence', new.id, 'spec_changed_rereview_required');
  end if;
  return new;
end;
$$;
drop trigger if exists bhk_evidence_rereview_trigger on public.bhk_properties;
create trigger bhk_evidence_rereview_trigger
  after update on public.bhk_properties
  for each row execute function public.bhk_trigger_evidence_rereview();
commit;
