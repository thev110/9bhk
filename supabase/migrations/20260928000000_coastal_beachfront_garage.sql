-- Migration: Add Coastal Beachfront and Luxury Garage Specifications
alter table if exists public.bhk_properties
  add column if not exists beach_frontage text,
  add column if not exists coastal_zone text default 'Direct Oceanfront',
  add column if not exists private_beach_access boolean default true,
  add column if not exists tide_distance_meters integer default 40,
  add column if not exists garage_type text default 'collector_vault',
  add column if not exists garage_capacity integer default 2,
  add column if not exists supercar_friendly boolean default false,
  add column if not exists ev_charging_kw integer default 0,
  add column if not exists washdown_station boolean default true,
  add column if not exists is_for_sale boolean default false,
  add column if not exists sale_price bigint,
  add column if not exists land_area text;

-- Update comments for clarity
comment on column public.bhk_properties.beach_frontage is 'Linear feet of direct ocean/beach frontage (e.g. 180 ft)';
comment on column public.bhk_properties.garage_type is 'collector_vault | marine_port | ev_pavilion | teak_portico';
comment on column public.bhk_properties.supercar_friendly is 'Whether approach ramp is under 7 degrees for zero scrape';
comment on column public.bhk_properties.is_for_sale is 'Whether property is listed for sale in addition to or instead of rentals';
