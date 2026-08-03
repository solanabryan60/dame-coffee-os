-- Dame Coffee OS Phase 6
-- Catering request center for paid date-request deposits.

create table if not exists public.catering_requests (
  id uuid primary key,
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  event_date date not null,
  start_time time not null,
  drinks integer not null,
  service_hours integer not null,
  estimate_cents integer not null,
  deposit_cents integer not null default 20000,
  status text not null default 'awaiting_payment',
  square_order_id text not null unique,
  square_payment_id text unique,
  internal_notes text not null default '',
  deposit_paid_at timestamptz,
  confirmed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catering_request_name_length check (char_length(name) between 1 and 160),
  constraint catering_request_email_length check (char_length(email) between 3 and 320),
  constraint catering_request_phone_length check (char_length(phone) between 7 and 40),
  constraint catering_request_address_length check (char_length(address) between 5 and 500),
  constraint catering_request_drinks check (drinks between 100 and 600 and drinks % 50 = 0),
  constraint catering_request_service_hours check (service_hours between 2 and 12 and service_hours % 2 = 0),
  constraint catering_request_estimate check (estimate_cents >= 75000),
  constraint catering_request_deposit check (deposit_cents = 20000),
  constraint catering_request_status check (
    status in (
      'awaiting_payment',
      'deposit_paid',
      'contacted',
      'confirmed',
      'alternate_proposed',
      'refund_pending',
      'refunded',
      'cancelled',
      'completed'
    )
  ),
  constraint catering_request_notes_length check (char_length(internal_notes) <= 2000)
);

create index if not exists catering_requests_event_date_idx
on public.catering_requests (event_date, start_time);

create index if not exists catering_requests_status_idx
on public.catering_requests (status, event_date);

alter table public.catering_requests enable row level security;

revoke all on public.catering_requests from anon, authenticated;
grant select on public.catering_requests to authenticated;
grant update (status, internal_notes, confirmed_at, updated_at)
on public.catering_requests to authenticated;
grant all on public.catering_requests to service_role;

drop policy if exists "Admins can read catering requests" on public.catering_requests;
create policy "Admins can read catering requests"
on public.catering_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update catering requests" on public.catering_requests;
create policy "Admins can update catering requests"
on public.catering_requests
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
