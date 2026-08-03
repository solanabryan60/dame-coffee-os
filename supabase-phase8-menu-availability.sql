-- Dame Coffee OS Phase 8
-- Staff-controlled same-day menu availability.

create table if not exists public.menu_item_availability (
  square_item_id text primary key,
  is_sold_out boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint menu_item_availability_square_id_length
    check (char_length(square_item_id) between 1 and 255)
);

alter table public.menu_item_availability enable row level security;

revoke all on public.menu_item_availability from anon, authenticated;
grant select on public.menu_item_availability to anon, authenticated;
grant insert (square_item_id, is_sold_out, updated_at)
  on public.menu_item_availability to authenticated;
grant update (is_sold_out, updated_at)
  on public.menu_item_availability to authenticated;
grant all on public.menu_item_availability to service_role;

drop policy if exists "Anyone can read menu availability"
on public.menu_item_availability;
create policy "Anyone can read menu availability"
on public.menu_item_availability
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can add menu availability"
on public.menu_item_availability;
create policy "Admins can add menu availability"
on public.menu_item_availability
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update menu availability"
on public.menu_item_availability;
create policy "Admins can update menu availability"
on public.menu_item_availability
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
