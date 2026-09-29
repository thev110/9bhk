-- ===========================================================================
-- 9bhk — SEO content model (additive only)
-- ---------------------------------------------------------------------------
-- This migration is deliberately additive. It creates two new tables and adds
-- new columns; it does not drop, rename, rewrite or backfill anything. Running
-- it against a live database cannot change what the existing application does.
--
-- Every column here exists because a page on the site needs a value it cannot
-- currently produce. None of them is populated by this migration: the site
-- starts emitting the corresponding metadata only once a row actually carries
-- the data, and the structured-data builders refuse to emit a node when a
-- required field is missing.
--
-- Apply with:  supabase db push
-- ===========================================================================

-- ── Destinations ─────────────────────────────────────────────────────────
-- A location becomes its own page only when it clears the `min_inventory`
-- threshold AND has editorial copy. The `overview` and `reach` columns are the
-- editorial part; both are rendered on /locations/<slug> and are currently
-- supplied from the curated registry in lib/seo/locations.ts.
create table if not exists public.bhk_locations (
  id text primary key,
  name text not null,
  slug text not null unique,
  -- 'coast' | 'city' | 'hills' | 'countryside'
  kind text not null default 'coast'
    check (kind in ('coast', 'city', 'hills', 'countryside')),
  region text,
  country text not null default 'India',
  latitude numeric,
  longitude numeric,
  -- Factual, map-verifiable description. Rendered verbatim on the page.
  overview text,
  -- How the destination is reached, described structurally.
  reach text,
  -- Verified figures. NULL today; the page omits the travel-time block
  -- entirely while they are NULL rather than printing a guess.
  distance_from_chennai_km integer,
  drive_time_from_chennai text,
  -- Links to sibling destinations used by the internal-link graph.
  nearby_slugs text[] not null default '{}',
  hero_image text,
  -- Listings required before this destination gets a public page at all.
  min_inventory integer not null default 2,
  seo_title text,
  seo_description text,
  canonical_url text,
  noindex boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

alter table public.bhk_locations enable row level security;

grant select on public.bhk_locations to anon, authenticated;

drop policy if exists bhk_locations_public_read on public.bhk_locations;
create policy bhk_locations_public_read on public.bhk_locations
  for select using (status = 'published' and not noindex);

-- ── Guides ───────────────────────────────────────────────────────────────
-- Mirrors the typed model in lib/content/guides.ts field for field, so moving
-- a guide from code into the admin surface is a copy rather than a rewrite.
create table if not exists public.bhk_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  h1 text,
  excerpt text not null,
  -- Typed body blocks, matching the GuideBlock union in lib/content/guides.ts.
  body jsonb not null default '[]'::jsonb,
  author text not null default '9bhk editorial',
  published_at date not null default current_date,
  updated_at date not null default current_date,
  -- Destination slugs and stay-type slugs this guide covers.
  location_slugs text[] not null default '{}',
  category_slugs text[] not null default '{}',
  related_property_ids text[] not null default '{}',
  related_guide_slugs text[] not null default '{}',
  -- Extra Q&A that cannot be derived from inventory.
  faq jsonb not null default '[]'::jsonb,
  image text,
  image_alt text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  canonical_url text,
  noindex boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists bhk_guides_status_idx on public.bhk_guides (status);
create index if not exists bhk_guides_locations_idx on public.bhk_guides using gin (location_slugs);

alter table public.bhk_guides enable row level security;

grant select on public.bhk_guides to anon, authenticated;

drop policy if exists bhk_guides_public_read on public.bhk_guides;
create policy bhk_guides_public_read on public.bhk_guides
  for select using (status = 'published' and not noindex);

-- ── Verified reviews ─────────────────────────────────────────────────────
-- Reviews do not exist yet. This table exists so that, when they do, they can
-- be distinguished from the placeholder `rating` / `reviews` numbers already on
-- bhk_properties — which is why TRUST.reviewSchema in lib/seo/schema.ts is
-- false and no AggregateRating or Review node is emitted today.
create table if not exists public.bhk_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.bhk_properties (id) on delete cascade,
  booking_id text,
  author_user_id uuid references auth.users (id) on delete set null,
  -- Only reviews tied to a completed booking may carry verified_stay.
  verified_stay boolean not null default false,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null,
  published_at date not null default current_date,
  moderated_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected'))
);

create index if not exists bhk_reviews_property_idx on public.bhk_reviews (property_id, status);

alter table public.bhk_reviews enable row level security;

grant select on public.bhk_reviews to anon, authenticated;

drop policy if exists bhk_reviews_public_read on public.bhk_reviews;
create policy bhk_reviews_public_read on public.bhk_reviews
  for select using (status = 'published' and verified_stay);

-- ── Property SEO columns ─────────────────────────────────────────────────
-- All additive and all nullable. The read path in lib/catalog-rows.ts emits
-- each mapped value only when the column is populated, and
-- createVacationRentalSchema() refuses to emit Google's VacationRental node
-- until latitude, longitude and a street-level address all exist — because
-- those three are required properties in Google's specification, and emitting
-- the node without them is a guidelines violation rather than an optimisation.
alter table public.bhk_properties add column if not exists latitude numeric;
alter table public.bhk_properties add column if not exists longitude numeric;
alter table public.bhk_properties add column if not exists address text;
alter table public.bhk_properties add column if not exists check_in_time text;
alter table public.bhk_properties add column if not exists check_out_time text;
alter table public.bhk_properties add column if not exists min_stay integer;
alter table public.bhk_properties add column if not exists house_rules text[];
alter table public.bhk_properties add column if not exists pets_allowed boolean;

-- Editor overrides. Left NULL, metadata is generated from the listing's own
-- name, type, destination, capacity and price.
alter table public.bhk_properties add column if not exists seo_title text;
alter table public.bhk_properties add column if not exists seo_description text;
alter table public.bhk_properties add column if not exists canonical_url text;
alter table public.bhk_properties add column if not exists noindex boolean not null default false;

-- Verification. `verification_status` is what the UI is allowed to claim:
-- only 'verified' renders a "Verified by 9bhk" label or a schema property.
-- The existing "Clear Title" and "verified clearance" strings in the property
-- page are product copy and are NOT driven by these columns — see AUDIT.md.
alter table public.bhk_properties add column if not exists verification_status text
  check (verification_status in ('verified', 'unverified'));
alter table public.bhk_properties add column if not exists verification_type text;
alter table public.bhk_properties add column if not exists verification_date date;
alter table public.bhk_properties add column if not exists verified_by text;

create index if not exists bhk_properties_slug_status_idx
  on public.bhk_properties (id, status);
create index if not exists bhk_properties_city_idx
  on public.bhk_properties (city);
