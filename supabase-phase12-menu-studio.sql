-- Dame Coffee OS Phase 12
-- Website-only menu presentation layered on top of the live Square catalog.
-- Square remains the source of truth for names, prices, modifiers, and checkout.

create table if not exists public.menu_item_presentation (
  square_item_id text primary key,
  description text,
  image_url text,
  is_featured boolean not null default false,
  is_seasonal boolean not null default false,
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint menu_item_presentation_square_id_length
    check (char_length(square_item_id) between 1 and 255),
  constraint menu_item_presentation_description_length
    check (description is null or char_length(description) <= 500),
  constraint menu_item_presentation_image_url_length
    check (image_url is null or char_length(image_url) <= 2048)
);

alter table public.menu_item_presentation enable row level security;

revoke all on public.menu_item_presentation from anon, authenticated;
grant select on public.menu_item_presentation to anon, authenticated;
grant insert (
  square_item_id,
  description,
  image_url,
  is_featured,
  is_seasonal,
  is_hidden,
  updated_at
) on public.menu_item_presentation to authenticated;
grant update (
  description,
  image_url,
  is_featured,
  is_seasonal,
  is_hidden,
  updated_at
) on public.menu_item_presentation to authenticated;
grant all on public.menu_item_presentation to service_role;

drop policy if exists "Anyone can read menu presentation"
on public.menu_item_presentation;
create policy "Anyone can read menu presentation"
on public.menu_item_presentation
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can add menu presentation"
on public.menu_item_presentation;
create policy "Admins can add menu presentation"
on public.menu_item_presentation
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update menu presentation"
on public.menu_item_presentation;
create policy "Admins can update menu presentation"
on public.menu_item_presentation
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
