-- Migration: Preferred interface language (Tamil / Telugu)
--
-- Stores the language a user picked so the choice follows them across devices
-- instead of resetting to English on every new browser.

alter table if exists public.bhk_profiles
  add column if not exists locale text not null default 'en';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bhk_profiles_locale_check'
  ) then
    alter table public.bhk_profiles
      add constraint bhk_profiles_locale_check
      check (locale in ('en', 'ta', 'te'));
  end if;
end $$;

create index if not exists bhk_profiles_locale_idx on public.bhk_profiles (locale);
