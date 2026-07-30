-- Dame Coffee OS Phase 4D
-- Keeps the promotion policies fast as the rewards program grows.
-- Run after supabase-phase4c-reward-refund-tracking.sql.

create index if not exists reward_promotions_created_by_idx
  on public.reward_promotions (created_by)
  where created_by is not null;

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
