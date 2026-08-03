import 'server-only';

import { readAuthUser } from './supabase-rest';

type ProfileMatch = {
  user_id: string;
};

type LedgerMatch = {
  user_id: string;
  points_delta?: number;
  amount_cents?: number | null;
  multiplier?: number;
};

export type ActiveRewardPromotion = {
  id: string;
  name: string;
  multiplier: number;
  scope: 'all' | 'menu_categories';
  eligible_categories: string[];
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

export type StoredPushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function requireDameAdmin(accessToken: string) {
  if (!accessToken) throw new Error('Please sign in to Dame Coffee OS again.');
  const user = await readAuthUser(accessToken);
  const membership = await adminRequest<Array<{ user_id: string }>>(
    `/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`,
  );
  if (!membership[0]) throw new Error('This account does not have Dame Coffee OS access.');
  return user;
}

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  await adminRequest<unknown[]>('/push_subscriptions?on_conflict=endpoint', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function deletePushSubscription(endpoint: string) {
  await adminRequest<unknown>(
    `/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
  );
}

export async function listPushSubscriptions() {
  return adminRequest<StoredPushSubscription[]>(
    '/push_subscriptions?select=id,endpoint,p256dh,auth&order=created_at.asc',
  );
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

export async function findRewardPurchaseByPayment(squarePaymentId: string) {
  const [rows, refunds] = await Promise.all([
    adminRequest<LedgerMatch[]>(
      `/reward_ledger?source_type=eq.square_payment&source_id=eq.${encodeURIComponent(squarePaymentId)}&select=user_id,points_delta,amount_cents,multiplier&limit=1`,
    ),
    adminRequest<LedgerMatch[]>(
      `/reward_ledger?source_type=eq.square_refund&related_source_id=eq.${encodeURIComponent(squarePaymentId)}&select=points_delta,amount_cents`,
    ),
  ]);
  const purchase = rows[0];
  if (!purchase?.user_id || !purchase.points_delta || !purchase.amount_cents) return null;
  return {
    userId: purchase.user_id,
    points: purchase.points_delta,
    amountCents: purchase.amount_cents,
    multiplier: purchase.multiplier ?? 1,
    refundedPoints: refunds.reduce(
      (total, refund) => total + Math.abs(refund.points_delta ?? 0),
      0,
    ),
  };
}

export async function getActiveRewardPromotions() {
  const now = encodeURIComponent(new Date().toISOString());
  return adminRequest<ActiveRewardPromotion[]>(
    `/reward_promotions?active=is.true&starts_at=lte.${now}&ends_at=gt.${now}&select=id,name,multiplier,scope,eligible_categories&order=multiplier.desc,starts_at.asc`,
  );
}

export async function recordDameSquareEvent(input: {
  userId: string;
  squareId: string;
  eventType: 'purchase' | 'refund';
  points: number;
  amountCents: number;
  description: string;
  multiplier: number;
  relatedSquareId?: string | null;
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
      p_multiplier: input.multiplier,
      p_related_square_id: input.relatedSquareId ?? null,
    }),
  });
}

export function hasDameRewardsServerConfig() {
  return Boolean(supabaseUrl && supabaseSecret);
}
