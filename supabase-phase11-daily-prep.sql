-- Dame Coffee OS Phase 11
-- Private recurring daily prep checklist for approved Dame admins.

create table if not exists public.prep_tasks (
  id bigint generated always as identity primary key,
  title text not null,
  phase text not null default 'opening',
  sort_order integer not null default 0,
  last_completed_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prep_tasks_title_length check (char_length(trim(title)) between 1 and 140),
  constraint prep_tasks_phase check (phase in ('opening', 'service', 'closing')),
  constraint prep_tasks_sort_order_nonnegative check (sort_order >= 0)
);

create unique index if not exists prep_tasks_phase_title_unique
  on public.prep_tasks (phase, lower(trim(title)));

create index if not exists prep_tasks_phase_sort_idx
  on public.prep_tasks (phase, sort_order, id);

alter table public.prep_tasks enable row level security;

revoke all on public.prep_tasks from anon, authenticated;
grant select, insert, update, delete on public.prep_tasks to authenticated;
grant all on public.prep_tasks to service_role;
grant usage, select on sequence public.prep_tasks_id_seq to authenticated, service_role;

drop policy if exists "Admins can read prep tasks" on public.prep_tasks;
create policy "Admins can read prep tasks"
on public.prep_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can add prep tasks" on public.prep_tasks;
create policy "Admins can add prep tasks"
on public.prep_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update prep tasks" on public.prep_tasks;
create policy "Admins can update prep tasks"
on public.prep_tasks
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

drop policy if exists "Admins can remove prep tasks" on public.prep_tasks;
create policy "Admins can remove prep tasks"
on public.prep_tasks
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

insert into public.prep_tasks (title, phase, sort_order)
select seed.title, seed.phase, seed.sort_order
from (values
  ('Sanitize the cart and work surfaces', 'opening', 10),
  ('Fill fresh water and check wastewater capacity', 'opening', 20),
  ('Restock cups, lids, straws, and napkins', 'opening', 30),
  ('Set up cold brew and matcha stations', 'opening', 40),
  ('Check milk, syrup, cold foam, and ice levels', 'opening', 50),
  ('Confirm Square and mobile ordering are ready', 'opening', 60),
  ('Check ice and milk levels', 'service', 10),
  ('Update anything sold out on the online menu', 'service', 20),
  ('Review the Mobile Orders queue', 'service', 30),
  ('Wipe and reset the service area', 'service', 40),
  ('Turn off mobile ordering and mark Dame closed', 'closing', 10),
  ('Record remaining inventory', 'closing', 20),
  ('Wash and sanitize tools and containers', 'closing', 30),
  ('Empty wastewater and trash', 'closing', 40),
  ('Charge devices and secure the cart', 'closing', 50)
) as seed(title, phase, sort_order)
where not exists (select 1 from public.prep_tasks);
