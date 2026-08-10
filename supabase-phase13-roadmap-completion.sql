-- Dame Coffee OS Phase 13
-- Completes the remaining roadmap foundations: menu media, richer catering,
-- customer favorites/history access, and the private team workspace.

-- Public menu photos. Public means anyone with the final URL may view a photo;
-- only approved Dame admins may upload, replace, list, or remove files.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'menu-media',
  'menu-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Dame admins can list menu media" on storage.objects;
create policy "Dame admins can list menu media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'menu-media'
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Dame admins can upload menu media" on storage.objects;
create policy "Dame admins can upload menu media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menu-media'
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Dame admins can update menu media" on storage.objects;
create policy "Dame admins can update menu media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menu-media'
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'menu-media'
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Dame admins can remove menu media" on storage.objects;
create policy "Dame admins can remove menu media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menu-media'
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

-- Richer event details and optional customer-account connection.
alter table public.catering_requests
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists company text not null default '',
  add column if not exists guest_count integer,
  add column if not exists event_setting text not null default 'outdoor',
  add column if not exists budget_cents integer,
  add column if not exists customer_notes text not null default '';

alter table public.catering_requests
  drop constraint if exists catering_request_company_length,
  add constraint catering_request_company_length check (char_length(company) <= 160),
  drop constraint if exists catering_request_guest_count,
  add constraint catering_request_guest_count check (guest_count is null or guest_count between 1 and 5000),
  drop constraint if exists catering_request_setting,
  add constraint catering_request_setting check (event_setting in ('indoor', 'outdoor', 'both', 'unsure')),
  drop constraint if exists catering_request_budget,
  add constraint catering_request_budget check (budget_cents is null or budget_cents between 0 and 100000000),
  drop constraint if exists catering_request_customer_notes_length,
  add constraint catering_request_customer_notes_length check (char_length(customer_notes) <= 2000);

create index if not exists catering_requests_customer_user_idx
  on public.catering_requests (customer_user_id, event_date desc)
  where customer_user_id is not null;

drop policy if exists "Customers can read own catering requests" on public.catering_requests;
create policy "Customers can read own catering requests"
on public.catering_requests
for select
to authenticated
using ((select auth.uid()) = customer_user_id);

drop policy if exists "Customers can read own pickup orders" on public.pickup_orders;
create policy "Customers can read own pickup orders"
on public.pickup_orders
for select
to authenticated
using ((select auth.uid()) = customer_user_id);

-- Customer favorites are intentionally lightweight and stay connected to the
-- Square item id so prices and availability continue to come from Square.
create table if not exists public.customer_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  square_item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, square_item_id),
  constraint customer_favorite_item_length check (char_length(square_item_id) between 1 and 200)
);

create index if not exists customer_favorites_user_created_idx
  on public.customer_favorites (user_id, created_at desc);

alter table public.customer_favorites enable row level security;
revoke all on public.customer_favorites from anon, authenticated;
grant select, insert, delete on public.customer_favorites to authenticated;
grant all on public.customer_favorites to service_role;

drop policy if exists "Customers can read own favorites" on public.customer_favorites;
create policy "Customers can read own favorites"
on public.customer_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Customers can add own favorites" on public.customer_favorites;
create policy "Customers can add own favorites"
on public.customer_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Customers can remove own favorites" on public.customer_favorites;
create policy "Customers can remove own favorites"
on public.customer_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Private staff profiles, schedules, time entries, recipes, and training.
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'barista',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_profile_name_length check (char_length(trim(display_name)) between 1 and 100),
  constraint staff_profile_role check (role in ('owner', 'manager', 'barista'))
);

insert into public.staff_profiles (user_id, display_name, role)
select
  admins.user_id,
  initcap(replace(split_part(users.email, '@', 1), '.', ' ')),
  'owner'
from public.admin_users as admins
join auth.users as users on users.id = admins.user_id
on conflict (user_id) do nothing;

create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.staff_profiles(user_id) on delete cascade,
  shift_date date not null,
  starts_at time not null,
  ends_at time not null,
  location text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_shift_times check (ends_at > starts_at),
  constraint staff_shift_location_length check (char_length(location) <= 200),
  constraint staff_shift_notes_length check (char_length(notes) <= 500)
);

create index if not exists staff_shifts_date_idx
  on public.staff_shifts (shift_date, starts_at);
create index if not exists staff_shifts_user_date_idx
  on public.staff_shifts (user_id, shift_date desc);

create table if not exists public.employee_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.staff_profiles(user_id) on delete cascade,
  clocked_in_at timestamptz not null default now(),
  clocked_out_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_time_order check (clocked_out_at is null or clocked_out_at > clocked_in_at),
  constraint employee_time_notes_length check (char_length(notes) <= 500)
);

create unique index if not exists employee_one_open_shift_idx
  on public.employee_time_entries (user_id)
  where clocked_out_at is null;
create index if not exists employee_time_user_idx
  on public.employee_time_entries (user_id, clocked_in_at desc);

create table if not exists public.employee_resources (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  title text not null,
  content text not null default '',
  media_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_resource_type check (resource_type in ('recipe', 'training')),
  constraint employee_resource_title_length check (char_length(trim(title)) between 1 and 160),
  constraint employee_resource_content_length check (char_length(content) <= 10000),
  constraint employee_resource_media_length check (media_url is null or char_length(media_url) <= 2048),
  constraint employee_resource_sort_order check (sort_order >= 0)
);

create unique index if not exists employee_resources_type_title_unique
  on public.employee_resources (resource_type, title);

insert into public.employee_resources (resource_type, title, content, sort_order)
values
  ('training', 'Welcome to Dame', 'Start with hospitality: greet every guest, confirm every order, and keep the cart calm and clean.', 10),
  ('recipe', 'Cold brew service standard', 'Use the current Dame recipe card and approved Square modifiers. Confirm milk and cold foam choices before serving.', 20),
  ('recipe', 'Matcha service standard', 'Whisk until smooth, follow the current Dame recipe card, and confirm milk and sweetness choices before serving.', 30)
on conflict (resource_type, title) do nothing;

alter table public.staff_profiles enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.employee_time_entries enable row level security;
alter table public.employee_resources enable row level security;

revoke all on public.staff_profiles, public.staff_shifts, public.employee_time_entries, public.employee_resources from anon, authenticated;
grant select, insert, update, delete on public.staff_profiles, public.staff_shifts, public.employee_time_entries, public.employee_resources to authenticated;
grant all on public.staff_profiles, public.staff_shifts, public.employee_time_entries, public.employee_resources to service_role;

drop policy if exists "Admins can manage staff profiles" on public.staff_profiles;
create policy "Admins can manage staff profiles"
on public.staff_profiles for all to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Admins can manage staff shifts" on public.staff_shifts;
create policy "Admins can manage staff shifts"
on public.staff_shifts for all to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Admins can manage employee time" on public.employee_time_entries;
create policy "Admins can manage employee time"
on public.employee_time_entries for all to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Admins can manage employee resources" on public.employee_resources;
create policy "Admins can manage employee resources"
on public.employee_resources for all to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));
