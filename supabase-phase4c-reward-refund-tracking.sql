-- Dame Coffee OS Phase 4C
-- Links Square refund ledger entries to their original payment so repeated
-- partial refunds can never reverse more points than the purchase earned.
-- Run after supabase-phase4b-rewards-growth.sql.

alter table public.reward_ledger
  add column if not exists related_source_id text;

create index if not exists reward_ledger_related_source_idx
  on public.reward_ledger (related_source_id)
  where related_source_id is not null;

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

  if p_event_type = 'purchase' and p_amount_cents >= 1000 then
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
        ), 0) < 1000
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
