-- Dame Coffee OS Phase 4B
-- Growth-ready rewards: 10 points per dollar, merchandise tiers,
-- qualified referrals, and scheduled point multiplier campaigns.
-- Run after supabase-phase4-owned-rewards.sql.

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
    200,
    'addon',
    true,
    10
  ),
  (
    'free-food',
    'Free food item',
    'Choose one available food item from the Dame cart.',
    500,
    'food',
    true,
    20
  ),
  (
    'free-drink',
    'Free Dame drink',
    'Choose one available Dame drink from the menu.',
    700,
    'drink',
    true,
    30
  ),
  (
    'dame-shirt',
    'Dame T-shirt',
    'Choose one available Dame Coffee T-shirt.',
    2500,
    'merch',
    true,
    40
  ),
  (
    'dame-hoodie',
    'Dame hoodie',
    'Choose one available Dame Coffee hoodie.',
    5000,
    'merch',
    true,
    50
  ),
  (
    'beans-1lb',
    '1 lb bag of Dame beans',
    'Take home one available one-pound bag of Dame coffee beans.',
    12500,
    'merch',
    true,
    60
  ),
  (
    'beans-5lb',
    '5 lb bag of Dame beans',
    'Take home one available five-pound bag of Dame coffee beans.',
    25000,
    'merch',
    true,
    70
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

alter table public.customer_profiles
  add column if not exists referral_code text;

update public.customer_profiles
set referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null;

alter table public.customer_profiles
  alter column referral_code
  set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

alter table public.customer_profiles
  alter column referral_code set not null;

create unique index if not exists customer_profiles_referral_code_unique
  on public.customer_profiles (referral_code);

alter table public.reward_ledger
  drop constraint if exists reward_ledger_event_type_check;

alter table public.reward_ledger
  add constraint reward_ledger_event_type_check
  check (
    event_type in (
      'purchase',
      'refund',
      'redemption',
      'cancellation',
      'birthday',
      'referral',
      'manual'
    )
  );

alter table public.reward_ledger
  drop constraint if exists reward_ledger_source_type_check;

alter table public.reward_ledger
  add constraint reward_ledger_source_type_check
  check (
    source_type in (
      'square_payment',
      'square_refund',
      'redemption',
      'birthday',
      'referral',
      'manual'
    )
  );

alter table public.reward_ledger
  add column if not exists multiplier smallint not null default 1
  check (multiplier between 1 and 5);

alter table public.reward_ledger
  add column if not exists related_source_id text;

create index if not exists reward_ledger_related_source_idx
  on public.reward_ledger (related_source_id)
  where related_source_id is not null;

create table if not exists public.reward_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'reversed')),
  qualifying_square_payment_id text unique,
  referrer_points integer not null default 500 check (referrer_points >= 0),
  referred_points integer not null default 250 check (referred_points >= 0),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  reversed_at timestamptz,
  check (referrer_user_id <> referred_user_id)
);

create index if not exists reward_referrals_referrer_idx
  on public.reward_referrals (referrer_user_id, status, qualified_at desc);

create table if not exists public.reward_promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  multiplier smallint not null default 2 check (multiplier between 2 and 5),
  scope text not null default 'all'
    check (scope in ('all', 'menu_categories')),
  eligible_categories text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    scope = 'all'
    or (
      cardinality(eligible_categories) > 0
      and eligible_categories <@ array['basics', 'specialty', 'foam', 'food']::text[]
    )
  )
);

create index if not exists reward_promotions_active_window_idx
  on public.reward_promotions (active, starts_at, ends_at);

create index if not exists reward_promotions_created_by_idx
  on public.reward_promotions (created_by)
  where created_by is not null;

alter table public.reward_referrals enable row level security;
alter table public.reward_promotions enable row level security;

drop policy if exists "Members can read own referral activity" on public.reward_referrals;
create policy "Members can read own referral activity"
on public.reward_referrals
for select
to authenticated
using (
  (select auth.uid()) = referrer_user_id
  or (select auth.uid()) = referred_user_id
);

drop policy if exists "Members can read live reward promotions" on public.reward_promotions;
drop policy if exists "Admins can read reward promotions" on public.reward_promotions;
drop policy if exists "Members and admins can read reward promotions" on public.reward_promotions;
create policy "Members and admins can read reward promotions"
on public.reward_promotions
for select
to authenticated
using (
  (
    active
    and starts_at <= now()
    and ends_at > now()
  )
  or exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can create reward promotions" on public.reward_promotions;
create policy "Admins can create reward promotions"
on public.reward_promotions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update reward promotions" on public.reward_promotions;
create policy "Admins can update reward promotions"
on public.reward_promotions
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

drop policy if exists "Admins can delete reward promotions" on public.reward_promotions;
create policy "Admins can delete reward promotions"
on public.reward_promotions
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

grant select on public.reward_referrals to authenticated;
grant select, insert, update, delete on public.reward_promotions to authenticated;

grant select, insert, update on public.reward_referrals to service_role;
grant select, insert, update, delete on public.reward_promotions to service_role;

create or replace function private.prepare_reward_promotion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.prepare_reward_promotion() from public, anon;
grant execute on function private.prepare_reward_promotion() to authenticated;

drop trigger if exists prepare_reward_promotion on public.reward_promotions;
create trigger prepare_reward_promotion
before insert or update on public.reward_promotions
for each row execute function private.prepare_reward_promotion();

create or replace function private.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_referral_code text;
  referrer_id uuid;
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

  submitted_referral_code := upper(
    trim(coalesce(new.raw_user_meta_data ->> 'referral_code', ''))
  );

  if submitted_referral_code <> '' then
    select user_id
    into referrer_id
    from public.customer_profiles
    where referral_code = submitted_referral_code
      and user_id <> new.id
    limit 1;

    if referrer_id is not null then
      insert into public.reward_referrals (
        referrer_user_id,
        referred_user_id,
        referral_code
      )
      values (
        referrer_id,
        new.id,
        submitted_referral_code
      )
      on conflict (referred_user_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_customer() from public, anon, authenticated;

drop function if exists public.record_dame_square_event(
  uuid,
  text,
  text,
  integer,
  integer,
  text
);

drop function if exists private.record_dame_square_event(
  uuid,
  text,
  text,
  integer,
  integer,
  text
);

create or replace function private.record_dame_square_event(
  p_user_id uuid,
  p_square_id text,
  p_event_type text,
  p_points integer,
  p_amount_cents integer,
  p_description text,
  p_multiplier integer,
  p_related_square_id text
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
  referral_row public.reward_referrals%rowtype;
  referral_count integer := 0;
  referrer_bonus integer := 0;
  referred_bonus integer := 0;
  reversal_points integer := 0;
begin
  if p_event_type not in ('purchase', 'refund') then
    raise exception 'Unsupported Square reward event';
  end if;

  if p_points <= 0 or p_amount_cents < 0 or p_multiplier not between 1 and 5 then
    raise exception 'Reward event values are invalid';
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

  if delta <> 0 then
    insert into public.reward_ledger (
      user_id,
      points_delta,
      event_type,
      source_type,
      source_id,
      related_source_id,
      amount_cents,
      description,
      multiplier
    )
    values (
      p_user_id,
      delta,
      p_event_type,
      source_kind,
      p_square_id,
      p_related_square_id,
      p_amount_cents,
      left(p_description, 240),
      p_multiplier
    );

    update public.rewards_accounts
    set
      points_balance = points_balance + delta,
      lifetime_points = lifetime_points + case when delta > 0 then delta else 0 end,
      updated_at = now()
    where user_id = p_user_id
    returning * into account_row;
  end if;

  if p_event_type = 'purchase' and p_amount_cents >= 500 then
    select *
    into referral_row
    from public.reward_referrals
    where referred_user_id = p_user_id
      and status = 'pending'
    for update;

    if referral_row.id is not null then
      select count(*)
      into referral_count
      from public.reward_referrals
      where referrer_user_id = referral_row.referrer_user_id
        and status = 'qualified'
        and qualified_at >= date_trunc('month', now())
        and qualified_at < date_trunc('month', now()) + interval '1 month';

      referred_bonus := 250;
      referrer_bonus := case when referral_count < 10 then 500 else 0 end;

      insert into public.rewards_accounts (user_id)
      values (referral_row.referrer_user_id)
      on conflict (user_id) do nothing;

      insert into public.reward_ledger (
        user_id,
        points_delta,
        event_type,
        source_type,
        source_id,
        amount_cents,
        description,
        multiplier
      )
      values (
        p_user_id,
        referred_bonus,
        'referral',
        'referral',
        referral_row.id::text || ':friend',
        null,
        'Welcome referral bonus',
        1
      )
      on conflict (source_type, source_id) do nothing;

      if found then
        update public.rewards_accounts
        set
          points_balance = points_balance + referred_bonus,
          lifetime_points = lifetime_points + referred_bonus,
          updated_at = now()
        where user_id = p_user_id;
      end if;

      if referrer_bonus > 0 then
        insert into public.reward_ledger (
          user_id,
          points_delta,
          event_type,
          source_type,
          source_id,
          amount_cents,
          description,
          multiplier
        )
        values (
          referral_row.referrer_user_id,
          referrer_bonus,
          'referral',
          'referral',
          referral_row.id::text || ':referrer',
          null,
          'A friend joined Dame Rewards',
          1
        )
        on conflict (source_type, source_id) do nothing;

        if found then
          update public.rewards_accounts
          set
            points_balance = points_balance + referrer_bonus,
            lifetime_points = lifetime_points + referrer_bonus,
            updated_at = now()
          where user_id = referral_row.referrer_user_id;
        end if;
      end if;

      update public.reward_referrals
      set
        status = 'qualified',
        qualifying_square_payment_id = p_square_id,
        referrer_points = referrer_bonus,
        referred_points = referred_bonus,
        qualified_at = now()
      where id = referral_row.id;
    end if;
  end if;

  if (
    p_event_type = 'refund'
    and p_related_square_id is not null
    and exists (
      select 1
      from public.reward_ledger as purchase
      where purchase.source_type = 'square_payment'
        and purchase.source_id = p_related_square_id
        and purchase.amount_cents - coalesce((
          select sum(refund.amount_cents)
          from public.reward_ledger as refund
          where refund.source_type = 'square_refund'
            and refund.related_source_id = p_related_square_id
        ), 0) < 500
    )
  ) then
    select *
    into referral_row
    from public.reward_referrals
    where qualifying_square_payment_id = p_related_square_id
      and status = 'qualified'
    for update;

    if referral_row.id is not null then
      select points_balance
      into reversal_points
      from public.rewards_accounts
      where user_id = referral_row.referred_user_id
      for update;

      reversal_points := least(coalesce(reversal_points, 0), referral_row.referred_points);
      if reversal_points > 0 then
        insert into public.reward_ledger (
          user_id,
          points_delta,
          event_type,
          source_type,
          source_id,
          description,
          multiplier
        )
        values (
          referral_row.referred_user_id,
          -reversal_points,
          'refund',
          'referral',
          referral_row.id::text || ':friend-reversed',
          'Referral bonus reversed after refund',
          1
        )
        on conflict (source_type, source_id) do nothing;

        if found then
          update public.rewards_accounts
          set
            points_balance = points_balance - reversal_points,
            updated_at = now()
          where user_id = referral_row.referred_user_id;
        end if;
      end if;

      select points_balance
      into reversal_points
      from public.rewards_accounts
      where user_id = referral_row.referrer_user_id
      for update;

      reversal_points := least(coalesce(reversal_points, 0), referral_row.referrer_points);
      if reversal_points > 0 then
        insert into public.reward_ledger (
          user_id,
          points_delta,
          event_type,
          source_type,
          source_id,
          description,
          multiplier
        )
        values (
          referral_row.referrer_user_id,
          -reversal_points,
          'refund',
          'referral',
          referral_row.id::text || ':referrer-reversed',
          'Referral bonus reversed after refund',
          1
        )
        on conflict (source_type, source_id) do nothing;

        if found then
          update public.rewards_accounts
          set
            points_balance = points_balance - reversal_points,
            updated_at = now()
          where user_id = referral_row.referrer_user_id;
        end if;
      end if;

      update public.reward_referrals
      set
        status = 'reversed',
        reversed_at = now()
      where id = referral_row.id;
    end if;
  end if;

  select *
  into account_row
  from public.rewards_accounts
  where user_id = p_user_id;

  return jsonb_build_object(
    'duplicate', false,
    'points_delta', delta,
    'points_balance', account_row.points_balance,
    'lifetime_points', account_row.lifetime_points,
    'referrer_bonus', referrer_bonus,
    'referred_bonus', referred_bonus
  );
end;
$$;

create or replace function public.record_dame_square_event(
  p_user_id uuid,
  p_square_id text,
  p_event_type text,
  p_points integer,
  p_amount_cents integer,
  p_description text,
  p_multiplier integer,
  p_related_square_id text
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
    p_description,
    p_multiplier,
    p_related_square_id
  );
$$;

revoke all on function private.record_dame_square_event(
  uuid,
  text,
  text,
  integer,
  integer,
  text,
  integer,
  text
) from public, anon, authenticated;

grant execute on function private.record_dame_square_event(
  uuid,
  text,
  text,
  integer,
  integer,
  text,
  integer,
  text
) to service_role;

revoke all on function public.record_dame_square_event(
  uuid,
  text,
  text,
  integer,
  integer,
  text,
  integer,
  text
) from public, anon, authenticated;

grant execute on function public.record_dame_square_event(
  uuid,
  text,
  text,
  integer,
  integer,
  text,
  integer,
  text
) to service_role;
