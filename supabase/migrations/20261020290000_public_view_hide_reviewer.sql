-- The public listings view must not reveal which staff member reviewed a
-- listing. Replace verification_status/verification_type/verification_date/
-- verified_by with two derived columns:
--   is_verified  boolean  staff review recorded (status 'verified' + reviewer + date)
--   verified_at  date     review date, only when is_verified
-- verified_by, verification_type and verification_status stay on
-- bhk_properties for staff (admin reads the base table; anon cannot).
--
-- CREATE OR REPLACE VIEW cannot drop columns, so the view is dropped and
-- recreated. Its two dependants (row-level policies that check a listing is
-- public) are dropped and recreated with identical definitions.
-- Privileges are re-stated explicitly: SELECT only, no write privileges, so
-- Supabase's default "grant all to anon/authenticated" does not apply.
begin;

drop policy if exists trial_terms_public on public.bhk_trial_stay_terms;
drop policy if exists seller_questions_public on public.bhk_seller_question_sets;
drop view public.bhk_public_properties;

create view public.bhk_public_properties with (security_barrier=true) as
  select p.id,p.name,p.description,p.type,p.location,p.city,p.area,p.guests,p.bedrooms,p.beds,p.bathrooms,
    p.price,p.cleaning,p.deposit,p.min_stay,p.weekend_price,p.tax_rate,p.platform_fee_rate,p.amenities,p.vibes,p.image_urls,
    p.highlights,p.blurb,p.alt,p.guest_favourite,p.group_name,p.status,p.created_at,p.blocked_dates,
    p.setting,p.setting_name,p.setting_detail,p.beach_frontage,p.coastal_zone,p.private_beach_access,p.tide_distance_meters,
    p.garage_type,p.garage_capacity,p.supercar_friendly,p.ev_charging_kw,p.washdown_station,p.is_for_sale,p.sale_price,p.land_area,
    p.hosts_celebrations,p.max_event_guests,p.power_load_kw,p.sound_curfew_hour,p.parking_cars,p.generator_kw,p.caterer_kitchen,
    p.check_in_time,p.check_out_time,p.house_rules,p.pets_allowed,p.seo_title,p.seo_description,p.canonical_url,p.noindex,
    coalesce(p.verification_status='verified' and p.verified_by is not null and p.verification_date is not null,false) as is_verified,
    case when p.verification_status='verified' and p.verified_by is not null then p.verification_date end as verified_at,
    (select coalesce(avg(r.rating),0) from public.bhk_stay_reviews r where r.property_id=p.id and r.published and r.verified_stay) as verified_review_rating,
    (select count(*) from public.bhk_stay_reviews r where r.property_id=p.id and r.published and r.verified_stay) as verified_review_count,
    (p.host_id is not null) as bookable
  from public.bhk_properties p where p.status='published' and p.bedrooms>=3;

revoke all on public.bhk_public_properties from public, anon, authenticated, service_role;
grant select on public.bhk_public_properties to anon, authenticated, service_role;

create policy trial_terms_public on public.bhk_trial_stay_terms for select to anon,authenticated
  using(exists(select 1 from bhk_public_properties p where p.id=property_id));
create policy seller_questions_public on public.bhk_seller_question_sets for select to anon,authenticated
  using(exists(select 1 from bhk_public_properties p where p.id=property_id));

commit;
