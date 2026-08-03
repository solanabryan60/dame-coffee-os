-- Dame Coffee OS Phase 7
-- Private pickup-order queue with secure customer tracking.

create table if not exists public.pickup_orders (
  id uuid primary key,
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_note text not null default '',
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null,
  paid_cents integer,
  status text not null default 'awaiting_payment',
  square_order_id text not null unique,
  square_payment_id text unique,
  tracking_token_hash text not null unique,
  location_title text not null,
  location_address text not null,
  quoted_wait_minutes integer not null,
  internal_notes text not null default '',
  paid_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  picked_up_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pickup_order_name_length check (char_length(customer_name) between 1 and 160),
  constraint pickup_order_email_length check (char_length(customer_email) between 3 and 320),
  constraint pickup_order_phone_length check (char_length(customer_phone) between 7 and 40),
  constraint pickup_order_note_length check (char_length(customer_note) <= 500),
  constraint pickup_order_items_array check (jsonb_typeof(line_items) = 'array'),
  constraint pickup_order_subtotal check (subtotal_cents > 0),
  constraint pickup_order_paid_amount check (paid_cents is null or paid_cents > 0),
  constraint pickup_order_tracking_hash check (char_length(tracking_token_hash) = 64),
  constraint pickup_order_location_title check (char_length(location_title) between 1 and 200),
  constraint pickup_order_location_address check (char_length(location_address) between 1 and 500),
  constraint pickup_order_wait check (quoted_wait_minutes between 0 and 180),
  constraint pickup_order_internal_notes check (char_length(internal_notes) <= 2000),
  constraint pickup_order_status check (
    status in (
      'awaiting_payment',
      'paid',
      'preparing',
      'ready',
      'picked_up',
      'refund_pending',
      'refunded',
      'cancelled'
    )
  )
);

create index if not exists pickup_orders_status_created_idx
on public.pickup_orders (status, created_at desc);

create index if not exists pickup_orders_customer_user_idx
on public.pickup_orders (customer_user_id, created_at desc)
where customer_user_id is not null;

alter table public.pickup_orders enable row level security;

revoke all on public.pickup_orders from anon, authenticated;
grant select on public.pickup_orders to authenticated;
grant update (
  status,
  internal_notes,
  preparing_at,
  ready_at,
  picked_up_at,
  cancelled_at,
  updated_at
) on public.pickup_orders to authenticated;
grant all on public.pickup_orders to service_role;

drop policy if exists "Admins can read pickup orders" on public.pickup_orders;
create policy "Admins can read pickup orders"
on public.pickup_orders
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update pickup orders" on public.pickup_orders;
create policy "Admins can update pickup orders"
on public.pickup_orders
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
