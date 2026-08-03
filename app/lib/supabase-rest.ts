export type SiteSettings = {
  id: number;
  location_title: string;
  address: string;
  directions: string;
  hours: string;
  is_open: boolean;
  mobile_ordering: boolean;
  wait_minutes: number;
  maps_url: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type?: string;
  user: AuthUser;
};

export type CustomerProfile = {
  user_id: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  marketing_opt_in: boolean;
  referral_code: string;
  created_at: string;
  updated_at: string;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  address: string;
  details: string;
  maps_url: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CateringRequestStatus =
  | 'awaiting_payment'
  | 'deposit_paid'
  | 'contacted'
  | 'confirmed'
  | 'alternate_proposed'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled'
  | 'completed';

export type CateringRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  event_date: string;
  start_time: string;
  drinks: number;
  service_hours: number;
  estimate_cents: number;
  deposit_cents: number;
  status: CateringRequestStatus;
  square_order_id: string;
  square_payment_id: string | null;
  internal_notes: string;
  deposit_paid_at: string | null;
  confirmed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PickupOrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled';

export type PickupOrderLineItem = {
  item_name: string;
  variation_name: string;
  quantity: number;
  modifier_names: string[];
  unit_amount_cents: number;
  line_total_cents: number;
};

export type PickupOrder = {
  id: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_note: string;
  line_items: PickupOrderLineItem[];
  subtotal_cents: number;
  paid_cents: number | null;
  status: PickupOrderStatus;
  square_order_id: string;
  square_payment_id: string | null;
  tracking_token_hash: string;
  location_title: string;
  location_address: string;
  quoted_wait_minutes: number;
  internal_notes: string;
  paid_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  refunded_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing in Vercel.');
  }
  return { supabaseUrl, supabaseKey };
}

export async function readSiteSettings(): Promise<SiteSettings> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/site_settings?id=eq.1&select=*`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${config.supabaseKey}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not load site settings.');
  }

  const rows = (await response.json()) as SiteSettings[];
  if (!rows[0]) throw new Error('The site_settings row has not been created.');
  return rows[0];
}

async function publicRequest<T>(path: string, accessToken?: string): Promise<T> {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken || config.supabaseKey}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not load Dame Coffee.'));
  return payload as T;
}

export async function readUpcomingEvents(): Promise<UpcomingEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  return publicRequest<UpcomingEvent[]>(
    `/upcoming_events?is_published=is.true&event_date=gte.${today}&select=*&order=event_date.asc,start_time.asc&limit=8`,
  );
}

export async function listUpcomingEventsForAdmin(accessToken: string) {
  return publicRequest<UpcomingEvent[]>(
    '/upcoming_events?select=*&order=event_date.asc,start_time.asc',
    accessToken,
  );
}

export async function createUpcomingEvent(
  accessToken: string,
  input: Omit<UpcomingEvent, 'id' | 'created_at' | 'updated_at'>,
) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/upcoming_events`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not add that event.'));
  const event = (payload as UpcomingEvent[])[0];
  if (!event) throw new Error('Could not add that event.');
  return event;
}

export async function setUpcomingEventPublished(
  accessToken: string,
  eventId: string,
  isPublished: boolean,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/upcoming_events?id=eq.${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that event.'));
  const event = (payload as UpcomingEvent[])[0];
  if (!event) throw new Error('Could not update that event.');
  return event;
}

export async function deleteUpcomingEvent(accessToken: string, eventId: string) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/upcoming_events?id=eq.${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not remove that event.'));
  }
}

export async function listCateringRequestsForAdmin(accessToken: string) {
  return publicRequest<CateringRequest[]>(
    '/catering_requests?select=*&order=event_date.asc,start_time.asc,created_at.desc',
    accessToken,
  );
}

export async function listPickupOrdersForAdmin(accessToken: string) {
  return publicRequest<PickupOrder[]>(
    '/pickup_orders?select=*&order=created_at.desc&limit=100',
    accessToken,
  );
}

export async function updatePickupOrderForAdmin(
  accessToken: string,
  orderId: string,
  input: {
    status: PickupOrderStatus;
    internal_notes: string;
  },
) {
  const config = requireConfig();
  const now = new Date().toISOString();
  const timestampFields: Partial<Pick<
    PickupOrder,
    'preparing_at' | 'ready_at' | 'picked_up_at' | 'cancelled_at'
  >> = {};
  if (input.status === 'preparing') timestampFields.preparing_at = now;
  if (input.status === 'ready') timestampFields.ready_at = now;
  if (input.status === 'picked_up') timestampFields.picked_up_at = now;
  if (input.status === 'cancelled') timestampFields.cancelled_at = now;

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/pickup_orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: input.status,
        internal_notes: input.internal_notes.trim(),
        ...timestampFields,
        updated_at: now,
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that pickup order.'));
  const order = (payload as PickupOrder[])[0];
  if (!order) throw new Error('Could not update that pickup order.');
  return order;
}

export async function updateCateringRequestForAdmin(
  accessToken: string,
  requestId: string,
  input: {
    status: CateringRequestStatus;
    internal_notes: string;
  },
) {
  const config = requireConfig();
  const now = new Date().toISOString();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/catering_requests?id=eq.${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: input.status,
        internal_notes: input.internal_notes.trim(),
        ...(input.status === 'confirmed' ? { confirmed_at: now } : {}),
        updated_at: now,
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that catering request.'));
  const cateringRequest = (payload as CateringRequest[])[0];
  if (!cateringRequest) throw new Error('Could not update that catering request.');
  return cateringRequest;
}

export async function loginAdmin(email: string, password: string) {
  const session = await loginCustomer(email, password);
  const membership = await readAdminMembership(session.access_token, session.user.id);
  if (!membership) {
    throw new Error('This account does not have access to Dame Coffee OS.');
  }
  return session;
}

export async function updateSiteSettings(
  settings: SiteSettings,
  accessToken: string,
): Promise<void> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/site_settings?id=eq.1`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        location_title: settings.location_title,
        address: settings.address,
        directions: settings.directions,
        hours: settings.hours,
        is_open: settings.is_open,
        mobile_ordering: settings.mobile_ordering,
        wait_minutes: settings.wait_minutes,
        maps_url: settings.maps_url,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not save changes.');
  }
}

function authError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  return String(
    record.error_description ||
      record.msg ||
      record.message ||
      record.error ||
      fallback,
  );
}

export function normalizeUsPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  throw new Error('Enter a valid 10-digit phone number.');
}

export async function signUpCustomer(input: {
  firstName: string;
  email: string;
  phone: string;
  birthday?: string;
  password: string;
  marketingOptIn: boolean;
  referralCode?: string;
}) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      data: {
        first_name: input.firstName.trim(),
        phone: normalizeUsPhone(input.phone),
        birthday: input.birthday || null,
        marketing_opt_in: input.marketingOptIn,
        referral_code: input.referralCode?.trim().toUpperCase() || null,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not create your account.'));
  return payload as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number;
    user: AuthUser;
  };
}

export async function loginCustomer(email: string, password: string): Promise<AuthSession> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
  );

  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Sign in failed.'));
  return payload as AuthSession;
}

export async function refreshCustomerSession(refreshToken: string): Promise<AuthSession> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Your session has expired.'));
  return payload as AuthSession;
}

export async function readAuthUser(accessToken: string): Promise<AuthUser> {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Please sign in again.'));
  return payload as AuthUser;
}

export async function readCustomerProfile(
  accessToken: string,
  userId: string,
): Promise<CustomerProfile> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not load your profile.'));
  const rows = payload as CustomerProfile[];
  if (!rows[0]) throw new Error('Your rewards profile is still being prepared.');
  return rows[0];
}

export async function updateCustomerProfile(
  accessToken: string,
  userId: string,
  profile: Pick<CustomerProfile, 'first_name' | 'phone' | 'birthday' | 'marketing_opt_in'>,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        first_name: profile.first_name.trim(),
        phone: profile.phone ? normalizeUsPhone(profile.phone) : null,
        birthday: profile.birthday || null,
        marketing_opt_in: profile.marketing_opt_in,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not save your profile.'));
  return (payload as CustomerProfile[])[0];
}

export async function readAdminMembership(
  accessToken: string,
  userId: string,
): Promise<boolean> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not verify admin access.'));
  return Array.isArray(payload) && payload.length > 0;
}
