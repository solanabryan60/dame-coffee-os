-- Dame Coffee OS Phase 4
-- Dame-owned rewards ledger. Square remains the payment and order processor.
-- Run once in Supabase after supabase-phase3-rewards.sql.

alter table public.customer_profiles
  add column if not exists email text;

update public.customer_profiles as profile
set email = lower(users.email)
from auth.users as users
where users.id = profile.user_id
  and profile.email is null;

create unique index if not exists customer_profiles_email_unique
  on public.customer_profiles (lower(email))
  where email is not null;

create unique index if not exists customer_profiles_phone_unique
  on public.customer_profiles (phone)
  where phone is not null;

create table if not exists public.rewards_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_definitions (
  id text primary key,
  name text not null,
  description text not null,
  points_cost integer not null check (points_cost > 0),
  reward_kind text not null check (
    reward_kind in ('addon', 'food', 'drink', 'merch', 'special')
  ),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.reward_definitions (
  id,
  name,
  description,
  points_cost,
  reward_kind,
  active,
  sort_order
)
values
  (
    'free-addon',
    'Free drink add-on',
    'Add cold foam or an alternative milk to one drink.',
    25,
    'addon',
    true,
    10
  ),
  (
    'free-food',
    'Free food item',
    'Choose one available food item from the Dame cart.',
    75,
    'food',
    true,
    20
  ),
  (
    'free-drink',
    'Free Dame drink',
    'Choose one available Dame drink from the menu.',
    100,
    'drink',
    true,
    30
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  points_cost = excluded.points_cost,
  reward_kind = excluded.reward_kind,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

create table if not exists public.rewards_order_links (
  square_order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists rewards_order_links_user_id_idx
  on public.rewards_order_links (user_id, created_at desc);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  event_type text not null check (
    event_type in ('purchase', 'refund', 'redemption', 'cancellation', 'birthday', 'manual')
  ),
  source_type text not null check (
    source_type in ('square_payment', 'square_refund', 'redemption', 'birthday', 'manual')
  ),
  source_id text not null,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  description text not null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create index if not exists reward_ledger_user_id_idx
  on public.reward_ledger (user_id, created_at desc);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null references public.reward_definitions(id),
  points_spent integer not null check (points_spent > 0),
  code text not null unique,
  status text not null default 'pending' check (
    status in ('pending', 'redeemed', 'cancelled', 'expired')
  ),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id)
);

create index if not exists reward_redemptions_user_id_idx
  on public.reward_redemptions (user_id, created_at desc);

create index if not exists reward_redemptions_reward_id_idx
  on public.reward_redemptions (reward_id);

create index if not exists reward_redemptions_redeemed_by_idx
  on public.reward_redemptions (redeemed_by)
  where redeemed_by is not null;

create index if not exists reward_redemptions_pending_code_idx
  on public.reward_redemptions (code)
  where status = 'pending';

insert into public.rewards_accounts (user_id)
select user_id
from public.customer_profiles
on conflict (user_id) do nothing;

alter table public.rewards_accounts enable row level security;
alter table public.reward_definitions enable row level security;
alter table public.rewards_order_links enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.reward_redemptions enable row level security;

drop policy if exists "Customers can read own rewards account" on public.rewards_accounts;
create policy "Customers can read own rewards account"
on public.rewards_accounts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Members can read active reward definitions" on public.reward_definitions;
create policy "Members can read active reward definitions"
on public.reward_definitions
for select
to authenticated
using (active);

drop policy if exists "Customers can read own order links" on public.rewards_order_links;
create policy "Customers can read own order links"
on public.rewards_order_links
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Customers can create own order links" on public.rewards_order_links;
create policy "Customers can create own order links"
on public.rewards_order_links
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Customers can read own reward history" on public.reward_ledger;
create policy "Customers can read own reward history"
on public.reward_ledger
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Customers can read own reward redemptions" on public.reward_redemptions;
create policy "Customers can read own reward redemptions"
on public.reward_redemptions
for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.rewards_accounts to authenticated;
grant select on public.reward_definitions to authenticated;
grant select, insert on public.rewards_order_links to authenticated;
grant select on public.reward_ledger to authenticated;
grant select on public.reward_redemptions to authenticated;

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
    email,
    phone,
    birthday,
    marketing_opt_in
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), 'Friend'),
    lower(new.email),
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
  on conflict (user_id) do update
  set email = excluded.email;

  insert into public.rewards_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_customer() from public, anon, authenticated;

create or replace function private.expire_dame_redemptions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_row record;
  expired_count integer := 0;
begin
  if (select auth.uid()) is distinct from p_user_id
    and not exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    )
  then
    raise exception 'Not authorized';
  end if;

  for expired_row in
    select id, points_spent
    from public.reward_redemptions
    where user_id = p_user_id
      and status = 'pending'
      and expires_at <= now()
    for update
  loop
    update public.reward_redemptions
    set status = 'expired'
    where id = expired_row.id;

    insert into public.reward_ledger (
      user_id,
      points_delta,
      event_type,
      source_type,
      source_id,
      description
    )
    values (
      p_user_id,
      expired_row.points_spent,
      'cancellation',
      'redemption',
      expired_row.id::text || ':expired',
      'Expired reward returned to balance'
    )
    on conflict (source_type, source_id) do nothing;

    if found then
      update public.rewards_accounts
      set
        points_balance = points_balance + expired_row.points_spent,
        updated_at = now()
      where user_id = p_user_id;
    end if;

    expired_count := expired_count + 1;
  end loop;

  return expired_count;
end;
$$;

create or replace function private.create_dame_reward_redemption(p_reward_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  reward_row public.reward_definitions%rowtype;
  account_row public.rewards_accounts%rowtype;
  redemption_row public.reward_redemptions%rowtype;
  generated_code text;
begin
  if current_user_id is null then
    raise exception 'Sign in to redeem a reward';
  end if;

  perform private.expire_dame_redemptions(current_user_id);

  select *
  into reward_row
  from public.reward_definitions
  where id = p_reward_id
    and active
  for share;

  if reward_row.id is null then
    raise exception 'That reward is not available';
  end if;

  insert into public.rewards_accounts (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select *
  into account_row
  from public.rewards_accounts
  where user_id = current_user_id
  for update;

  if account_row.points_balance < reward_row.points_cost then
    raise exception 'Not enough points for that reward';
  end if;

  generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.reward_redemptions (
    user_id,
    reward_id,
    points_spent,
    code
  )
  values (
    current_user_id,
    reward_row.id,
    reward_row.points_cost,
    generated_code
  )
  returning * into redemption_row;

  update public.rewards_accounts
  set
    points_balance = points_balance - reward_row.points_cost,
    updated_at = now()
  where user_id = current_user_id;

  insert into public.reward_ledger (
    user_id,
    points_delta,
    event_type,
    source_type,
    source_id,
    description
  )
  values (
    current_user_id,
    -reward_row.points_cost,
    'redemption',
    'redemption',
    redemption_row.id::text,
    reward_row.name || ' reserved'
  );

  return jsonb_build_object(
    'id', redemption_row.id,
    'reward_id', reward_row.id,
    'reward_name', reward_row.name,
    'points_spent', reward_row.points_cost,
    'code', redemption_row.code,
    'status', redemption_row.status,
    'expires_at', redemption_row.expires_at
  );
end;
$$;

create or replace function private.cancel_dame_reward_redemption(p_redemption_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  redemption_row public.reward_redemptions%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in to manage a reward';
  end if;

  select *
  into redemption_row
  from public.reward_redemptions
  where id = p_redemption_id
    and user_id = current_user_id
  for update;

  if redemption_row.id is null then
    raise exception 'Reward code not found';
  end if;

  if redemption_row.status <> 'pending' then
    raise exception 'Only a pending reward can be cancelled';
  end if;

  update public.reward_redemptions
  set status = 'cancelled'
  where id = redemption_row.id;

  insert into public.reward_ledger (
    user_id,
    points_delta,
    event_type,
    source_type,
    source_id,
    description
  )
  values (
    current_user_id,
    redemption_row.points_spent,
    'cancellation',
    'redemption',
    redemption_row.id::text || ':cancelled',
    'Cancelled reward returned to balance'
  )
  on conflict (source_type, source_id) do nothing;

  if found then
    update public.rewards_accounts
    set
      points_balance = points_balance + redemption_row.points_spent,
      updated_at = now()
    where user_id = current_user_id;
  end if;

  return jsonb_build_object(
    'id', redemption_row.id,
    'status', 'cancelled',
    'points_returned', redemption_row.points_spent
  );
end;
$$;

create or replace function private.lookup_dame_reward(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  redemption_row record;
begin
  if not exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  ) then
    raise exception 'Admin access required';
  end if;

  select
    redemption.id,
    redemption.user_id,
    redemption.code,
    redemption.status,
    redemption.points_spent,
    redemption.expires_at,
    definition.name as reward_name,
    profile.first_name,
    profile.email
  into redemption_row
  from public.reward_redemptions as redemption
  join public.reward_definitions as definition on definition.id = redemption.reward_id
  join public.customer_profiles as profile on profile.user_id = redemption.user_id
  where redemption.code = upper(trim(p_code));

  if redemption_row.id is null then
    raise exception 'Reward code not found';
  end if;

  if redemption_row.status = 'pending' and redemption_row.expires_at <= now() then
    perform private.expire_dame_redemptions(redemption_row.user_id);
    redemption_row.status := 'expired';
  end if;

  return to_jsonb(redemption_row);
end;
$$;

create or replace function private.redeem_dame_reward(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  redemption_row record;
begin
  if not exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  ) then
    raise exception 'Admin access required';
  end if;

  select
    redemption.id,
    redemption.user_id,
    redemption.code,
    redemption.status,
    redemption.expires_at,
    definition.name as reward_name,
    profile.first_name
  into redemption_row
  from public.reward_redemptions as redemption
  join public.reward_definitions as definition on definition.id = redemption.reward_id
  join public.customer_profiles as profile on profile.user_id = redemption.user_id
  where redemption.code = upper(trim(p_code))
  for update of redemption;

  if redemption_row.id is null then
    raise exception 'Reward code not found';
  end if;

  if redemption_row.status <> 'pending' then
    raise exception 'This reward code is no longer pending';
  end if;

  if redemption_row.expires_at <= now() then
    perform private.expire_dame_redemptions(redemption_row.user_id);
    raise exception 'This reward code expired';
  end if;

  update public.reward_redemptions
  set
    status = 'redeemed',
    redeemed_at = now(),
    redeemed_by = (select auth.uid())
  where id = redemption_row.id;

  return jsonb_build_object(
    'id', redemption_row.id,
    'code', redemption_row.code,
    'status', 'redeemed',
    'reward_name', redemption_row.reward_name,
    'first_name', redemption_row.first_name
  );
end;
$$;

create or replace function private.record_dame_square_event(
  p_user_id uuid,
  p_square_id text,
  p_event_type text,
  p_points integer,
  p_amount_cents integer,
  p_description text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_kind text;
  delta integer;
  account_row public.rewards_accounts%rowtype;
begin
  if p_event_type not in ('purchase', 'refund') then
    raise exception 'Unsupported Square reward event';
  end if;

  if p_points <= 0 or p_amount_cents < 0 then
    raise exception 'Reward event values must be positive';
  end if;

  source_kind := case
    when p_event_type = 'purchase' then 'square_payment'
    else 'square_refund'
  end;

  if exists (
    select 1
    from public.reward_ledger
    where source_type = source_kind
      and source_id = p_square_id
  ) then
    select *
    into account_row
    from public.rewards_accounts
    where user_id = p_user_id;

    return jsonb_build_object(
      'duplicate', true,
      'points_balance', coalesce(account_row.points_balance, 0)
    );
  end if;

  insert into public.rewards_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into account_row
  from public.rewards_accounts
  where user_id = p_user_id
  for update;

  delta := case
    when p_event_type = 'purchase' then p_points
    else -least(account_row.points_balance, p_points)
  end;

  if delta = 0 then
    return jsonb_build_object(
      'duplicate', false,
      'points_delta', 0,
      'points_balance', account_row.points_balance
    );
  end if;

  insert into public.reward_ledger (
    user_id,
    points_delta,
    event_type,
    source_type,
    source_id,
    amount_cents,
    description
  )
  values (
    p_user_id,
    delta,
    p_event_type,
    source_kind,
    p_square_id,
    p_amount_cents,
    left(p_description, 240)
  );

  update public.rewards_accounts
  set
    points_balance = points_balance + delta,
    lifetime_points = lifetime_points + case when delta > 0 then delta else 0 end,
    updated_at = now()
  where user_id = p_user_id
  returning * into account_row;

  return jsonb_build_object(
    'duplicate', false,
    'points_delta', delta,
    'points_balance', account_row.points_balance,
    'lifetime_points', account_row.lifetime_points
  );
end;
$$;

create or replace function public.expire_dame_rewards()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.expire_dame_redemptions((select auth.uid()));
$$;

create or replace function public.create_dame_reward_redemption(p_reward_id text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_dame_reward_redemption(p_reward_id);
$$;

create or replace function public.cancel_dame_reward_redemption(p_redemption_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_dame_reward_redemption(p_redemption_id);
$$;

create or replace function public.lookup_dame_reward(p_code text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.lookup_dame_reward(p_code);
$$;

create or replace function public.redeem_dame_reward(p_code text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.redeem_dame_reward(p_code);
$$;

create or replace function public.record_dame_square_event(
  p_user_id uuid,
  p_square_id text,
  p_event_type text,
  p_points integer,
  p_amount_cents integer,
  p_description text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.record_dame_square_event(
    p_user_id,
    p_square_id,
    p_event_type,
    p_points,
    p_amount_cents,
    p_description
  );
$$;

revoke all on function private.expire_dame_redemptions(uuid) from public, anon;
revoke all on function private.create_dame_reward_redemption(text) from public, anon;
revoke all on function private.cancel_dame_reward_redemption(uuid) from public, anon;
revoke all on function private.lookup_dame_reward(text) from public, anon;
revoke all on function private.redeem_dame_reward(text) from public, anon;
revoke all on function private.record_dame_square_event(uuid, text, text, integer, integer, text) from public, anon, authenticated;

grant usage on schema private to authenticated, service_role;
grant execute on function private.expire_dame_redemptions(uuid) to authenticated;
grant execute on function private.create_dame_reward_redemption(text) to authenticated;
grant execute on function private.cancel_dame_reward_redemption(uuid) to authenticated;
grant execute on function private.lookup_dame_reward(text) to authenticated;
grant execute on function private.redeem_dame_reward(text) to authenticated;
grant execute on function private.record_dame_square_event(uuid, text, text, integer, integer, text) to service_role;

revoke all on function public.expire_dame_rewards() from public, anon;
revoke all on function public.create_dame_reward_redemption(text) from public, anon;
revoke all on function public.cancel_dame_reward_redemption(uuid) from public, anon;
revoke all on function public.lookup_dame_reward(text) from public, anon;
revoke all on function public.redeem_dame_reward(text) from public, anon;
revoke all on function public.record_dame_square_event(uuid, text, text, integer, integer, text) from public, anon, authenticated;

grant execute on function public.expire_dame_rewards() to authenticated;
grant execute on function public.create_dame_reward_redemption(text) to authenticated;
grant execute on function public.cancel_dame_reward_redemption(uuid) to authenticated;
grant execute on function public.lookup_dame_reward(text) to authenticated;
grant execute on function public.redeem_dame_reward(text) to authenticated;
grant execute on function public.record_dame_square_event(uuid, text, text, integer, integer, text) to service_role;

grant select, insert, update on public.rewards_accounts to service_role;
grant select on public.reward_definitions to service_role;
grant select, insert on public.rewards_order_links to service_role;
grant select, insert on public.reward_ledger to service_role;
grant select, insert, update on public.reward_redemptions to service_role;
