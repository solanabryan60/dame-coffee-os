-- Dame Coffee OS Phase 13b
-- Combines owner and admin read access into one policy per table so Postgres
-- evaluates one permissive policy instead of two on every account-history read.

drop policy if exists "Admins can read catering requests" on public.catering_requests;
drop policy if exists "Customers can read own catering requests" on public.catering_requests;
create policy "Admins or customers can read catering requests"
on public.catering_requests
for select
to authenticated
using (
  customer_user_id = (select auth.uid())
  or exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can read pickup orders" on public.pickup_orders;
drop policy if exists "Customers can read own pickup orders" on public.pickup_orders;
create policy "Admins or customers can read pickup orders"
on public.pickup_orders
for select
to authenticated
using (
  customer_user_id = (select auth.uid())
  or exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
