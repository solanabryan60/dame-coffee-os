-- Dame Coffee OS Phase 3
-- Run once in Supabase. This secures admin access before customer accounts open.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Seed only Dame's four approved owner/admin accounts. Customer signups must
-- never inherit access to the private control center.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) in (
  'info@damecoffeeco.com',
  'solanabryan60@gmail.com',
  'damecoffeecollc@gmail.com',
  'sarahortiz288@gmail.com'
)
on conflict (user_id) do nothing;

alter table public.admin_users enable row level security;

drop policy if exists "Users can read own admin membership" on public.admin_users;
create policy "Users can read own admin membership"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.admin_users to authenticated;

drop policy if exists "Authenticated admins can update settings" on public.site_settings;
create policy "Authenticated admins can update settings"
on public.site_settings
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

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  phone text,
  birthday date,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_first_name_length check (char_length(first_name) <= 80),
  constraint customer_phone_e164 check (
    phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'
  )
);

alter table public.customer_profiles enable row level security;

drop policy if exists "Customers can read own profile" on public.customer_profiles;
create policy "Customers can read own profile"
on public.customer_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Customers can update own profile" on public.customer_profiles;
create policy "Customers can update own profile"
on public.customer_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, update on public.customer_profiles to authenticated;

create or replace function private.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_profiles (
    user_id,
    first_name,
    phone,
    birthday,
    marketing_opt_in
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), 'Friend'),
    case
      when new.raw_user_meta_data ->> 'phone' ~ '^\+[1-9][0-9]{7,14}$'
        then new.raw_user_meta_data ->> 'phone'
      else null
    end,
    case
      when new.raw_user_meta_data ->> 'birthday' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        then (new.raw_user_meta_data ->> 'birthday')::date
      else null
    end,
    coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false') = 'true'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_customer() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_customer_profile on auth.users;
create trigger on_auth_user_created_create_customer_profile
after insert on auth.users
for each row execute function private.handle_new_customer();
