-- Dame Coffee OS Phase 14
-- Limits authenticated receipt claims to three successful receipts per Pacific day.
-- Run after supabase-phase4e-referral-threshold.sql.

create table if not exists private.reward_receipt_claims (
  square_payment_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  claim_day date not null default ((now() at time zone 'America/Los_Angeles')::date)
);

create index if not exists reward_receipt_claims_user_day_idx
  on private.reward_receipt_claims (user_id, claim_day);

revoke all on table private.reward_receipt_claims from public, anon, authenticated;

create or replace function private.record_dame_receipt_claim(
  p_user_id uuid,
  p_square_payment_id text,
  p_points integer,
  p_amount_cents integer,
  p_description text,
  p_multiplier integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  pacific_day date := (now() at time zone 'America/Los_Angeles')::date;
  claims_today integer := 0;
  existing_owner uuid;
begin
  if p_user_id is null or nullif(trim(p_square_payment_id), '') is null then
    raise exception 'Receipt claim details are invalid';
  end if;

  if p_points <= 0 or p_amount_cents < 0 or p_multiplier not between 1 and 5 then
    raise exception 'Receipt claim values are invalid';
  end if;

  insert into public.rewards_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  -- The account row lock serializes claims for this member so parallel tabs
  -- cannot step around the daily limit.
  perform 1
  from public.rewards_accounts
  where user_id = p_user_id
  for update;

  -- A payment already in the ledger remains idempotent and does not consume
  -- another one of today's receipt claims.
  select user_id
  into existing_owner
    from public.reward_ledger
    where source_type = 'square_payment'
      and source_id = p_square_payment_id
    limit 1;

  if existing_owner is not null and existing_owner <> p_user_id then
    raise exception 'Those receipt points have already been saved to another member.';
  end if;

  if existing_owner = p_user_id then
    return private.record_dame_square_event(
      p_user_id,
      p_square_payment_id,
      'purchase',
      p_points,
      p_amount_cents,
      p_description,
      p_multiplier,
      null
    );
  end if;

  select count(*)
  into claims_today
  from private.reward_receipt_claims
  where user_id = p_user_id
    and claim_day = pacific_day;

  if claims_today >= 3 then
    raise exception 'You have reached the three receipt claims allowed today. Please try again tomorrow.';
  end if;

  insert into private.reward_receipt_claims (
    square_payment_id,
    user_id,
    claim_day
  )
  values (
    p_square_payment_id,
    p_user_id,
    pacific_day
  );

  return private.record_dame_square_event(
    p_user_id,
    p_square_payment_id,
    'purchase',
    p_points,
    p_amount_cents,
    p_description,
    p_multiplier,
    null
  );
end;
$$;

create or replace function public.record_dame_receipt_claim(
  p_user_id uuid,
  p_square_payment_id text,
  p_points integer,
  p_amount_cents integer,
  p_description text,
  p_multiplier integer
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.record_dame_receipt_claim(
    p_user_id,
    p_square_payment_id,
    p_points,
    p_amount_cents,
    p_description,
    p_multiplier
  );
$$;

revoke all on function private.record_dame_receipt_claim(
  uuid,
  text,
  integer,
  integer,
  text,
  integer
) from public, anon, authenticated;

grant execute on function private.record_dame_receipt_claim(
  uuid,
  text,
  integer,
  integer,
  text,
  integer
) to service_role;

revoke all on function public.record_dame_receipt_claim(
  uuid,
  text,
  integer,
  integer,
  text,
  integer
) from public, anon, authenticated;

grant execute on function public.record_dame_receipt_claim(
  uuid,
  text,
  integer,
  integer,
  text,
  integer
) to service_role;
