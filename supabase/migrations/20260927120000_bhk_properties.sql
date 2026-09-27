create table if not exists public.bhk_properties (
  id text primary key,
  host_id uuid references auth.users (id) on delete set null,
  name text not null,
  description text,
  type text,
  location text,
  city text,
  area text,
  address text,
  guests integer not null default 1,
  bedrooms integer not null default 1,
  beds integer not null default 1,
  bathrooms integer not null default 1,
  price integer not null default 0,
  cleaning integer not null default 0,
  deposit integer not null default 0,
  min_stay integer not null default 2,
  amenities text[] not null default '{}',
  vibes text[] not null default '{}',
  image_urls text[] not null default '{}',
  rating numeric not null default 0,
  reviews integer not null default 0,
  highlights text,
  blurb text,
  alt text,
  guest_favourite boolean not null default false,
  group_name text,
  status text not null default 'published' check (status in ('draft', 'pending', 'published')),
  created_at timestamptz not null default now()
);

alter table public.bhk_properties enable row level security;

grant select on public.bhk_properties to anon, authenticated;
grant insert, update, delete on public.bhk_properties to authenticated;

drop policy if exists bhk_properties_public_read on public.bhk_properties;
create policy bhk_properties_public_read on public.bhk_properties
  for select using (status = 'published' or host_id = auth.uid());

drop policy if exists bhk_properties_insert_own on public.bhk_properties;
create policy bhk_properties_insert_own on public.bhk_properties
  for insert with check (host_id = auth.uid());

drop policy if exists bhk_properties_update_own on public.bhk_properties;
create policy bhk_properties_update_own on public.bhk_properties
  for update using (host_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

drop policy if exists bhk_property_images_read on storage.objects;
create policy bhk_property_images_read on storage.objects
  for select using (bucket_id = 'property-images');

drop policy if exists bhk_property_images_insert on storage.objects;
create policy bhk_property_images_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('palm-grove', 'Palm Grove Private Farmhouse', 'A quiet private escape surrounded by palms, open lawns and a pool — made for slow mornings and long evenings.', 'Private farmhouse', 'ECR · Near Mahabalipuram', 'ECR', 8, 3, 4, 3, 8500, 1200, array['Private pool','Bonfire pit','BBQ grill','Air conditioning','Wi-Fi','Free parking','Equipped kitchen','Pet friendly','Power backup','Projector & music'], array['Pool','Bonfire','Groups','Pet friendly'], array['/assets/prop-palm-grove.jpg'], 4.9, 128, '8 guests · Pool · Bonfire', 'A quiet private escape surrounded by palms, open lawns and a pool — made for slow mornings and long evenings.', 'A curved swimming pool ringed with palms and tropical planting at Palm Grove Private Farmhouse', true, 'featured', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('mango-orchard', 'Mango Orchard Retreat', 'A cottage set inside a working mango orchard, with a long verandah and a grill for unhurried evenings.', 'Orchard retreat', 'Chengalpattu', 'Chengalpattu', 6, 2, 3, 2, 6200, 900, array['BBQ grill','Wi-Fi','Free parking','Equipped kitchen','Pet friendly','Air conditioning'], array['Countryside','Family','Pet friendly'], array['/assets/prop-mango-orchard.jpg'], 4.8, 94, '6 guests · Orchard · BBQ', 'A cottage set inside a working mango orchard, with a long verandah and a grill for unhurried evenings.', 'A stone cottage with a sage-green door and wildflowers at Mango Orchard Retreat', false, 'featured', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('sunset-fields', 'Sunset Fields Farmhouse', 'Wide fields, a still pool and room for a big group — the kind of place where the day slows down on its own.', 'Private farmhouse', 'Kanchipuram', 'Kanchipuram', 10, 4, 5, 3, 7400, 1100, array['Private pool','Bonfire pit','Air conditioning','Wi-Fi','Free parking','Equipped kitchen','Power backup'], array['Pool','Countryside','Groups'], array['/assets/prop-sunset-fields.jpg'], 4.9, 76, '10 guests · Pool · Fields', 'Wide fields, a still pool and room for a big group — the kind of place where the day slows down on its own.', 'Open fields at golden hour beside Sunset Fields Farmhouse', false, 'featured', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('lakeview', 'Lakeview Courtyard', 'A courtyard house a short walk from the water, with a pool that catches the late light.', 'Farm stay', 'Pondicherry', 'Pondicherry', 6, 3, 3, 2, 6900, 1000, array['Private pool','BBQ grill','Bonfire pit','Wi-Fi','Air conditioning','Free parking'], array['Pool','Romantic','Countryside'], array['/assets/prop-lakeview-courtyard.jpg'], 4.8, 63, '6 guests · Pool · Lake view', 'A courtyard house a short walk from the water, with a pool that catches the late light.', 'A courtyard opening toward the water at Lakeview Courtyard', false, 'nearby', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('coconut-grove', 'Coconut Grove Escape', 'Palms, a small pool and the sea a short drive away — an easy weekend without the rush.', 'Private farmhouse', 'ECR · Mahabalipuram', 'ECR', 6, 2, 3, 2, 5800, 800, array['Private pool','Wi-Fi','Free parking','Equipped kitchen','Air conditioning'], array['Pool','Family','Romantic'], array['/assets/prop-coconut-grove.jpg'], 4.8, 210, '6 guests · Pool · Near beach', 'Palms, a small pool and the sea a short drive away — an easy weekend without the rush.', 'Palms shading the lawn at Coconut Grove Escape', false, 'nearby', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('blue-horizon', 'Blue Horizon Farm Stay', 'A larger stay with a pool and a long view toward the coast, built for groups who want space.', 'Pool villa', 'Mahabalipuram', 'Mahabalipuram', 12, 4, 6, 4, 9100, 1500, array['Private pool','Wi-Fi','Air conditioning','Free parking','Equipped kitchen','Power backup','Projector & music'], array['Pool','Groups','Family'], array['/assets/prop-blue-horizon.jpg'], 4.7, 52, '12 guests · Pool · Sea view', 'A larger stay with a pool and a long view toward the coast, built for groups who want space.', 'A blue-toned farm stay with an open view at Blue Horizon', false, 'nearby', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('guava-house', 'The Guava House', 'A garden house on the edge of the city, with fruit trees and room for a dog on the lawn.', 'Farm stay', 'Chennai', 'Chennai', 6, 2, 2, 2, 5400, 700, array['Pet friendly','Wi-Fi','Air conditioning','Free parking','Equipped kitchen','Power backup'], array['Pet friendly','Family','Countryside'], array['/assets/prop-guava-house.jpg'], 4.9, 312, '6 guests · Garden · Pet friendly', 'A garden house on the edge of the city, with fruit trees and room for a dog on the lawn.', 'A garden house with fruit trees at The Guava House', false, 'popular', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('verde-meadow', 'Verde Meadow Farmhouse', 'An open meadow, a bonfire ring and enough beds for a long weekend with friends.', 'Private farmhouse', 'Kanchipuram', 'Kanchipuram', 10, 3, 4, 2, 4900, 800, array['Bonfire pit','Wi-Fi','Free parking','Equipped kitchen','Air conditioning','Pet friendly'], array['Bonfire','Countryside','Groups','Pet friendly'], array['/assets/prop-verde-meadow.jpg'], 4.6, 88, '10 guests · Meadow · Bonfire', 'An open meadow, a bonfire ring and enough beds for a long weekend with friends.', 'A meadow stretching behind Verde Meadow Farmhouse', false, 'popular', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('terracotta', 'Terracotta Courtyard Stay', 'A warm courtyard house with a bonfire and evenings that stay outdoors.', 'Farm stay', 'Pondicherry', 'Pondicherry', 8, 3, 4, 3, 7800, 1100, array['Bonfire pit','BBQ grill','Wi-Fi','Air conditioning','Free parking','Equipped kitchen'], array['Bonfire','Romantic','Family'], array['/assets/prop-terracotta-courtyard.jpg'], 4.8, 145, '8 guests · Courtyard · Bonfire', 'A warm courtyard house with a bonfire and evenings that stay outdoors.', 'A terracotta courtyard with planted edges', false, 'popular', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;
