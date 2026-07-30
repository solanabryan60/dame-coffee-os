import 'server-only';

type ProfileMatch = {
  user_id: string;
};

type LedgerMatch = {
  user_id: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireAdminConfig() {
  if (!supabaseUrl || !supabaseSecret) {
    throw new Error('The server-side Supabase secret is not configured.');
  }
  return { supabaseUrl, supabaseSecret };
}

function messageFrom(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  return String(record.message || record.error_description || record.error || fallback);
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = requireAdminConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseSecret,
      Authorization: `Bearer ${config.supabaseSecret}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(messageFrom(payload, 'The rewards service is unavailable.'));
  return payload as T;
}

export async function findRewardUserBySquareOrder(squareOrderId: string) {
  const rows = await adminRequest<ProfileMatch[]>(
    `/rewards_order_links?square_order_id=eq.${encodeURIComponent(squareOrderId)}&select=user_id&limit=1`,
  );
  return rows[0]?.user_id ?? null;
}

export async function findRewardUserByContact(input: {
  email?: string | null;
  phone?: string | null;
}) {
  if (input.email) {
    const rows = await adminRequest<ProfileMatch[]>(
      `/customer_profiles?email=eq.${encodeURIComponent(input.email.trim().toLowerCase())}&select=user_id&limit=1`,
    );
    if (rows[0]) return rows[0].user_id;
  }

  if (input.phone) {
    const rows = await adminRequest<ProfileMatch[]>(
      `/customer_profiles?phone=eq.${encodeURIComponent(input.phone)}&select=user_id&limit=1`,
    );
    if (rows[0]) return rows[0].user_id;
  }

  return null;
}

export async function findRewardUserByPayment(squarePaymentId: string) {
  const rows = await adminRequest<LedgerMatch[]>(
    `/reward_ledger?source_type=eq.square_payment&source_id=eq.${encodeURIComponent(squarePaymentId)}&select=user_id&limit=1`,
  );
  return rows[0]?.user_id ?? null;
}

export async function recordDameSquareEvent(input: {
  userId: string;
  squareId: string;
  eventType: 'purchase' | 'refund';
  points: number;
  amountCents: number;
  description: string;
}) {
  return adminRequest<{
    duplicate: boolean;
    points_delta?: number;
    points_balance: number;
    lifetime_points?: number;
  }>('/rpc/record_dame_square_event', {
    method: 'POST',
    body: JSON.stringify({
      p_user_id: input.userId,
      p_square_id: input.squareId,
      p_event_type: input.eventType,
      p_points: input.points,
      p_amount_cents: input.amountCents,
      p_description: input.description,
    }),
  });
}

export function hasDameRewardsServerConfig() {
  return Boolean(supabaseUrl && supabaseSecret);
}
