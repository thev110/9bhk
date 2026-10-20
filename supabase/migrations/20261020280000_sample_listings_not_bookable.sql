-- Sample listings (no host account behind them) are shown for illustration
-- only. Expose a host-free "bookable" flag to the public view so the UI can
-- label them, and refuse holds and checkout for them in the database itself,
-- whichever RPC (bhk_prepare_booking, bhk_prepare_occasion_booking, ...) or
-- service path creates the row.
begin;

-- Same projection as 20261013020000, with one appended column. Appending is
-- the only change CREATE OR REPLACE VIEW allows, so existing grants and
-- dependants are preserved.
create or replace view public.bhk_public_properties with (security_barrier=true) as
  select p.id,p.name,p.description,p.type,p.location,p.city,p.area,p.guests,p.bedrooms,p.beds,p.bathrooms,
    p.price,p.cleaning,p.deposit,p.min_stay,p.weekend_price,p.tax_rate,p.platform_fee_rate,p.amenities,p.vibes,p.image_urls,
    p.highlights,p.blurb,p.alt,p.guest_favourite,p.group_name,p.status,p.created_at,p.blocked_dates,
    p.setting,p.setting_name,p.setting_detail,p.beach_frontage,p.coastal_zone,p.private_beach_access,p.tide_distance_meters,
    p.garage_type,p.garage_capacity,p.supercar_friendly,p.ev_charging_kw,p.washdown_station,p.is_for_sale,p.sale_price,p.land_area,
    p.hosts_celebrations,p.max_event_guests,p.power_load_kw,p.sound_curfew_hour,p.parking_cars,p.generator_kw,p.caterer_kitchen,
    p.check_in_time,p.check_out_time,p.house_rules,p.pets_allowed,p.seo_title,p.seo_description,p.canonical_url,p.noindex,
    p.verification_status,p.verification_type,p.verification_date,p.verified_by,
    (select coalesce(avg(r.rating),0) from public.bhk_stay_reviews r where r.property_id=p.id and r.published and r.verified_stay) as verified_review_rating,
    (select count(*) from public.bhk_stay_reviews r where r.property_id=p.id and r.published and r.verified_stay) as verified_review_count,
    (p.host_id is not null) as bookable
  from public.bhk_properties p where p.status='published' and p.bedrooms>=3;

create or replace function public.bhk_refuse_sample_booking()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.host_id is null or not exists(select 1 from bhk_properties where id=new.property_id and host_id is not null) then
    raise exception 'Sample listing is not bookable';
  end if;
  return new;
end $$;
revoke all on function public.bhk_refuse_sample_booking() from public, anon, authenticated;
drop trigger if exists bhk_bookings_refuse_sample on public.bhk_bookings;
create trigger bhk_bookings_refuse_sample before insert on public.bhk_bookings
  for each row execute function public.bhk_refuse_sample_booking();

-- Checkout for any hold that already exists on a host-less listing.
create or replace function public.bhk_refuse_sample_checkout()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.kind in ('booking','share') and (
    new.booking_id is null or exists(
      select 1 from bhk_bookings b left join bhk_properties p on p.id=b.property_id
      where b.id=new.booking_id and (b.host_id is null or p.host_id is null))) then
    raise exception 'Sample listing is not bookable';
  end if;
  return new;
end $$;
revoke all on function public.bhk_refuse_sample_checkout() from public, anon, authenticated;
drop trigger if exists bhk_payment_orders_refuse_sample on public.bhk_payment_orders;
create trigger bhk_payment_orders_refuse_sample before insert on public.bhk_payment_orders
  for each row execute function public.bhk_refuse_sample_checkout();
commit;
