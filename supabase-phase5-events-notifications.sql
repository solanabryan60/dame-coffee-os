-- Dame Coffee OS Phase 5
-- Upcoming events and opt-in browser/app notifications.

create table if not exists public.upcoming_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  start_time time,
  end_time time,
  address text not null,
  details text not null default '',
  maps_url text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint upcoming_event_title_length check (char_length(title) between 1 and 120),
  constraint upcoming_event_address_length check (char_length(address) between 1 and 300),
  constraint upcoming_event_details_length check (char_length(details) <= 800)
);

create index if not exists upcoming_events_date_idx
on public.upcoming_events (event_date, start_time);

alter table public.upcoming_events enable row level security;

revoke all on public.upcoming_events from anon, authenticated;
grant select on public.upcoming_events to anon, authenticated;
grant insert, update, delete on public.upcoming_events to authenticated;

drop policy if exists "Public can read published upcoming events" on public.upcoming_events;
create policy "Public can read published upcoming events"
on public.upcoming_events
for select
to anon
using (is_published = true and event_date >= current_date);

drop policy if exists "Authenticated users can read available events" on public.upcoming_events;
create policy "Authenticated users can read available events"
on public.upcoming_events
for select
to authenticated
using (
  (is_published = true and event_date >= current_date)
  or exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
);

drop policy if exists "Admins can create upcoming events" on public.upcoming_events;
create policy "Admins can create upcoming events"
on public.upcoming_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update upcoming events" on public.upcoming_events;
create policy "Admins can update upcoming events"
on public.upcoming_events
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can delete upcoming events" on public.upcoming_events;
create policy "Admins can delete upcoming events"
on public.upcoming_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_endpoint_length check (char_length(endpoint) between 20 and 4096),
  constraint push_p256dh_length check (char_length(p256dh) between 20 and 512),
  constraint push_auth_length check (char_length(auth) between 8 and 256)
);

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;

drop policy if exists "No client access to push subscriptions" on public.push_subscriptions;
create policy "No client access to push subscriptions"
on public.push_subscriptions
for all
to anon, authenticated
using (false)
with check (false);
