import 'server-only';

import { createHash } from 'node:crypto';
import {
  readAuthUser,
  type CateringRequest,
  type PickupOrder,
} from './supabase-rest';

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

type NewCateringRequest = Pick<
  CateringRequest,
  | 'id'
  | 'customer_user_id'
  | 'name'
  | 'email'
  | 'phone'
  | 'company'
  | 'guest_count'
  | 'event_setting'
  | 'budget_cents'
  | 'customer_notes'
  | 'address'
  | 'event_date'
  | 'start_time'
  | 'drinks'
  | 'service_hours'
  | 'estimate_cents'
  | 'deposit_cents'
  | 'square_order_id'
>;

type NewPickupOrder = Pick<
  PickupOrder,
  | 'id'
  | 'customer_user_id'
  | 'customer_name'
  | 'customer_email'
  | 'customer_phone'
  | 'customer_note'
  | 'line_items'
  | 'subtotal_cents'
  | 'square_order_id'
  | 'tracking_token_hash'
  | 'location_title'
  | 'location_address'
  | 'quoted_wait_minutes'
>;

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

export function hashPickupTrackingToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createPickupOrder(input: NewPickupOrder) {
  const rows = await adminRequest<PickupOrder[]>('/pickup_orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      ...input,
      status: 'awaiting_payment',
      internal_notes: '',
    }),
  });
  const order = rows[0];
  if (!order) throw new Error('Could not save the pickup order.');
  return order;
}

export async function findPickupOrderBySquareOrder(squareOrderId: string) {
  const rows = await adminRequest<PickupOrder[]>(
    `/pickup_orders?square_order_id=eq.${encodeURIComponent(squareOrderId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function findPickupOrderBySquarePayment(squarePaymentId: string) {
  const rows = await adminRequest<PickupOrder[]>(
    `/pickup_orders?square_payment_id=eq.${encodeURIComponent(squarePaymentId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function findPickupOrderByTracking(input: {
  orderId: string;
  trackingToken: string;
}) {
  const tokenHash = hashPickupTrackingToken(input.trackingToken);
  const rows = await adminRequest<PickupOrder[]>(
    `/pickup_orders?id=eq.${encodeURIComponent(input.orderId)}&tracking_token_hash=eq.${encodeURIComponent(tokenHash)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function markPickupOrderPaid(input: {
  orderId: string;
  squarePaymentId: string;
  paidCents: number;
}) {
  const now = new Date().toISOString();
  await adminRequest<unknown>(
    `/pickup_orders?id=eq.${encodeURIComponent(input.orderId)}&status=eq.awaiting_payment`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'paid',
        square_payment_id: input.squarePaymentId,
        paid_cents: input.paidCents,
        paid_at: now,
        updated_at: now,
      }),
    },
  );
}

export async function markPickupOrderRefunded(orderId: string) {
  const now = new Date().toISOString();
  await adminRequest<unknown>(
    `/pickup_orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'refunded',
        refunded_at: now,
        updated_at: now,
      }),
    },
  );
}

export async function syncPickupOrderFulfillmentStatus(
  orderId: string,
  status: Extract<PickupOrder['status'], 'preparing' | 'ready' | 'picked_up' | 'cancelled'>,
) {
  const now = new Date().toISOString();
  const timestamp = status === 'preparing'
    ? { preparing_at: now }
    : status === 'ready'
      ? { ready_at: now }
      : status === 'picked_up'
        ? { picked_up_at: now }
        : { cancelled_at: now };

  await adminRequest<unknown>(
    `/pickup_orders?id=eq.${encodeURIComponent(orderId)}&status=not.in.(refunded,refund_pending)`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status,
        ...timestamp,
        updated_at: now,
      }),
    },
  );
}

export async function listPushSubscriptions() {
  return adminRequest<StoredPushSubscription[]>(
    '/push_subscriptions?select=id,endpoint,p256dh,auth&order=created_at.asc',
  );
}

export async function createCateringRequest(input: NewCateringRequest) {
  const rows = await adminRequest<CateringRequest[]>('/catering_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      ...input,
      status: 'awaiting_payment',
      internal_notes: '',
    }),
  });
  const cateringRequest = rows[0];
  if (!cateringRequest) throw new Error('Could not save the catering request.');
  return cateringRequest;
}

export async function findCateringRequestBySquareOrder(squareOrderId: string) {
  const rows = await adminRequest<CateringRequest[]>(
    `/catering_requests?square_order_id=eq.${encodeURIComponent(squareOrderId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function findCateringRequestBySquarePayment(squarePaymentId: string) {
  const rows = await adminRequest<CateringRequest[]>(
    `/catering_requests?square_payment_id=eq.${encodeURIComponent(squarePaymentId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function markCateringDepositPaid(input: {
  requestId: string;
  squarePaymentId: string;
}) {
  const now = new Date().toISOString();
  await adminRequest<unknown>(
    `/catering_requests?id=eq.${encodeURIComponent(input.requestId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'deposit_paid',
        square_payment_id: input.squarePaymentId,
        deposit_paid_at: now,
        updated_at: now,
      }),
    },
  );
}

export async function markCateringDepositRefunded(requestId: string) {
  const now = new Date().toISOString();
  await adminRequest<unknown>(
    `/catering_requests?id=eq.${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'refunded',
        refunded_at: now,
        updated_at: now,
      }),
    },
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

export async function getRewardPromotionsAt(timestamp: string) {
  const moment = encodeURIComponent(timestamp);
  return adminRequest<ActiveRewardPromotion[]>(
    `/reward_promotions?active=is.true&starts_at=lte.${moment}&ends_at=gt.${moment}&select=id,name,multiplier,scope,eligible_categories&order=multiplier.desc,starts_at.asc`,
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

export async function getDameBusinessActivity(startAt: string, endAt: string) {
  const start = encodeURIComponent(startAt);
  const end = encodeURIComponent(endAt);
  const [bookings, redemptions, customers] = await Promise.all([
    adminRequest<Array<{ id: string }>>(
      `/catering_requests?created_at=gte.${start}&created_at=lt.${end}&status=not.in.(awaiting_payment,cancelled,refunded)&select=id`,
    ),
    adminRequest<Array<{ id: string }>>(
      `/reward_redemptions?redeemed_at=gte.${start}&redeemed_at=lt.${end}&status=eq.redeemed&select=id`,
    ),
    adminRequest<Array<{ user_id: string }>>(
      `/customer_profiles?created_at=gte.${start}&created_at=lt.${end}&select=user_id`,
    ),
  ]);
  return {
    eventsBooked: bookings.length,
    rewardsRedeemed: redemptions.length,
    newCustomers: customers.length,
  };
}
