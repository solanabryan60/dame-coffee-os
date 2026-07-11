-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  location_title text not null,
  address text not null,
  directions text not null,
  hours text not null,
  is_open boolean not null default false,
  mobile_ordering boolean not null default false,
  wait_minutes integer not null default 10 check (wait_minutes between 0 and 180),
  maps_url text not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (
  id,
  location_title,
  address,
  directions,
  hours,
  is_open,
  mobile_ordering,
  wait_minutes,
  maps_url
)
values (
  1,
  'VENICE BEACH',
  'Ocean Front Walk near The Waterfront, Venice, CA',
  'Look for the white Dame Coffee cart along Ocean Front Walk near The Waterfront.',
  '6:00 AM–4:00 PM',
  true,
  false,
  10,
  'https://www.google.com/maps/search/?api=1&query=The+Waterfront+Venice+CA'
)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can update settings" on public.site_settings;
create policy "Authenticated admins can update settings"
on public.site_settings
for update
to authenticated
using (true)
with check (true);
