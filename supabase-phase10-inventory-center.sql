-- Dame Coffee OS Phase 10
-- Private ingredient and supply inventory for approved Dame admins.

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'other',
  quantity numeric(10, 2) not null default 0,
  unit text not null default 'units',
  low_stock_at numeric(10, 2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_name_length check (char_length(trim(name)) between 1 and 100),
  constraint inventory_items_category check (
    category in ('ingredients', 'milk', 'packaging', 'food', 'merchandise', 'other')
  ),
  constraint inventory_items_quantity_nonnegative check (quantity >= 0),
  constraint inventory_items_low_stock_nonnegative check (low_stock_at >= 0),
  constraint inventory_items_unit_length check (char_length(trim(unit)) between 1 and 30),
  constraint inventory_items_notes_length check (char_length(notes) <= 500)
);

create unique index if not exists inventory_items_name_unique
  on public.inventory_items (lower(trim(name)));

create index if not exists inventory_items_category_name_idx
  on public.inventory_items (category, name);

alter table public.inventory_items enable row level security;

revoke all on public.inventory_items from anon, authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant all on public.inventory_items to service_role;

drop policy if exists "Admins can read inventory" on public.inventory_items;
create policy "Admins can read inventory"
on public.inventory_items
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can add inventory" on public.inventory_items;
create policy "Admins can add inventory"
on public.inventory_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update inventory" on public.inventory_items;
create policy "Admins can update inventory"
on public.inventory_items
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

drop policy if exists "Admins can remove inventory" on public.inventory_items;
create policy "Admins can remove inventory"
on public.inventory_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
