-- Migration: Generalise the catalog beyond beachfront-only properties.
--
-- Until now every listing was forced to be coastal: beach_frontage,
-- coastal_zone, private_beach_access and tide_distance_meters all carried
-- defaults that assumed sand, and garage columns defaulted to a Collector
-- Vault whether the host had one or not.
--
-- 9bhk is a group-stay marketplace for whole villas, bungalows and pool
-- houses anywhere — seaside, hill station, city or countryside. This migration:
--   1. adds `setting` / `setting_name` / `setting_detail`,
--   2. drops the coastal defaults so those columns are NULL for non-seaside,
--   3. drops the garage defaults so a missing garage reads as a missing garage,
--   4. backfills the existing (all-beachfront) rows as `setting = 'seaside'`,
--   5. adds `notes` to viewing requests, backfilled from the old
--      `automotive_mandate` column, and keeps the app working either way.

alter table if exists public.bhk_properties
  add column if not exists setting text,
  add column if not exists setting_name text,
  add column if not exists setting_detail text;

comment on column public.bhk_properties.setting is
  'seaside | hill_station | city | countryside — where the property is. Seaside is one option, not a mandate.';
comment on column public.bhk_properties.setting_name is
  'Human location line for the setting, e.g. ''Ooty · Nilgiri Hills''';
comment on column public.bhk_properties.setting_detail is
  'One-line spec that replaces beach frontage, e.g. ''7,400 ft elevation · Valley-facing''';

-- Coastal fields are now seaside-only and must default to NULL, not to a
-- fabricated shoreline. `fromRow` in lib/catalog.tsx only reads them when
-- `setting = 'seaside'`, so a hill or city listing never renders them.
alter table if exists public.bhk_properties
  alter column beach_frontage drop default,
  alter column coastal_zone drop default,
  alter column private_beach_access drop default,
  alter column tide_distance_meters drop default,
  alter column garage_type drop default,
  alter column garage_capacity drop default,
  alter column supercar_friendly drop default,
  alter column ev_charging_kw drop default,
  alter column washdown_station drop default;

-- Every row that exists today was created under the beachfront-only mandate.
update public.bhk_properties
   set setting = 'seaside',
       setting_name = coalesce(setting_name, location, city)
 where setting is null;

update public.bhk_properties
   set setting_detail = coalesce(setting_detail, beach_frontage)
 where setting = 'seaside' and setting_detail is null;

comment on column public.bhk_properties.beach_frontage is
  'Linear feet of direct ocean/beach frontage. Seaside listings only, otherwise NULL.';
comment on column public.bhk_properties.coastal_zone is
  'Direct Oceanfront | Dune Edge Sanctuary | Cove Front. Seaside listings only.';
comment on column public.bhk_properties.garage_type is
  'collector_vault | marine_port | ev_pavilion | teak_portico. NULL means the property has no garage.';
comment on column public.bhk_properties.supercar_friendly is
  'Whether the approach ramp is under 7 degrees for zero scrape';
comment on column public.bhk_properties.is_for_sale is
  'Whether the property is listed for sale in addition to or instead of stays';

-- Backfill the garage description column sanity check: any row still carrying
-- the old default type but a NULL capacity is treated as garage-less.
update public.bhk_properties
   set garage_type = null,
       garage_capacity = null
 where garage_capacity is null and garage_type is not null;

-- ── Viewing requests ───────────────────────────────────────────────────────
-- The note field was named for the old automotive-only brief. It is now
-- generic (group size, dates, pool/bonfire needs), so give it a neutral name
-- and keep the old column readable for anything already written.
alter table if exists public.bhk_viewing_requests
  add column if not exists notes text;

update public.bhk_viewing_requests
   set notes = automotive_mandate
 where notes is null and automotive_mandate is not null;

comment on column public.bhk_viewing_requests.notes is
  'Free-form buyer note: group size, dates, pool/bonfire needs, vehicle requirements.';
