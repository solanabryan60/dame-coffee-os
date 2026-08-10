import type { CateringRequest, CustomerProfile, PickupOrder } from './supabase-rest';
import type { SquareMenuItem } from './square';

export type RewardDefinition = {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_kind: 'addon' | 'food' | 'drink' | 'merch' | 'special';
  active: boolean;
  sort_order: number;
};

export type RewardRedemption = {
  id: string;
  reward_id: string;
  reward_name: string;
  points_spent: number;
  code: string;
  status: 'pending' | 'redeemed' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
};

export type RewardLedgerEntry = {
  id: string;
  points_delta: number;
  event_type:
    | 'purchase'
    | 'refund'
    | 'redemption'
    | 'cancellation'
    | 'birthday'
    | 'referral'
    | 'manual';
  description: string;
  created_at: string;
};

export type RewardPromotion = {
  id: string;
  name: string;
  multiplier: number;
  scope: 'all' | 'menu_categories';
  eligible_categories: Array<'basics' | 'specialty' | 'foam' | 'food'>;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
};

export type DameRewardsStatus = {
  points: number;
  lifetimePoints: number;
  pointsLabel: 'points';
  rewardTiers: RewardDefinition[];
  nextReward: {
    name: string;
    points: number;
    pointsAway: number;
  } | null;
  pendingRedemptions: RewardRedemption[];
  activity: RewardLedgerEntry[];
  activePromotions: RewardPromotion[];
  qualifiedReferrals: number;
};

export type AdminRewardLookup = {
  id: string;
  user_id: string;
  code: string;
  status: RewardRedemption['status'];
  points_spent: number;
  expires_at: string;
  reward_name: string;
  first_name: string;
  email: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing in Vercel.');
  }
  return { supabaseUrl, supabaseKey };
}

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  return String(record.message || record.error_description || record.error || fallback);
}

async function rewardsRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(errorMessage(payload, 'Could not load Dame Rewards.'));
  return payload as T;
}

async function rewardsRpc<T>(
  accessToken: string,
  name: string,
  body: Record<string, unknown> = {},
) {
  return rewardsRequest<T>(accessToken, `/rpc/${name}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getDameRewardsStatus(
  accessToken: string,
  userId: string,
): Promise<DameRewardsStatus> {
  await rewardsRpc<number>(accessToken, 'expire_dame_rewards');
  const now = encodeURIComponent(new Date().toISOString());

  const [
    accounts,
    rewardTiers,
    redemptions,
    activity,
    activePromotions,
    qualifiedReferrals,
  ] = await Promise.all([
    rewardsRequest<Array<{ points_balance: number; lifetime_points: number }>>(
      accessToken,
      `/rewards_accounts?user_id=eq.${encodeURIComponent(userId)}&select=points_balance,lifetime_points`,
    ),
    rewardsRequest<RewardDefinition[]>(
      accessToken,
      '/reward_definitions?active=is.true&select=id,name,description,points_cost,reward_kind,active,sort_order&order=sort_order.asc',
    ),
    rewardsRequest<Array<Omit<RewardRedemption, 'reward_name'> & {
      reward_definitions: { name: string } | null;
    }>>(
      accessToken,
      `/reward_redemptions?user_id=eq.${encodeURIComponent(userId)}&select=id,reward_id,points_spent,code,status,expires_at,created_at,reward_definitions(name)&order=created_at.desc&limit=12`,
    ),
    rewardsRequest<RewardLedgerEntry[]>(
      accessToken,
      `/reward_ledger?user_id=eq.${encodeURIComponent(userId)}&select=id,points_delta,event_type,description,created_at&order=created_at.desc&limit=12`,
    ),
    rewardsRequest<RewardPromotion[]>(
      accessToken,
      `/reward_promotions?active=is.true&starts_at=lte.${now}&ends_at=gt.${now}&select=id,name,multiplier,scope,eligible_categories,starts_at,ends_at,active,created_at&order=multiplier.desc,starts_at.asc`,
    ),
    rewardsRequest<Array<{ id: string }>>(
      accessToken,
      `/reward_referrals?referrer_user_id=eq.${encodeURIComponent(userId)}&status=eq.qualified&select=id`,
    ),
  ]);

  const account = accounts[0] ?? { points_balance: 0, lifetime_points: 0 };
  const nextTier = rewardTiers.find((tier) => tier.points_cost > account.points_balance) ?? null;

  return {
    points: account.points_balance,
    lifetimePoints: account.lifetime_points,
    pointsLabel: 'points',
    rewardTiers,
    nextReward: nextTier
      ? {
          name: nextTier.name,
          points: nextTier.points_cost,
          pointsAway: nextTier.points_cost - account.points_balance,
        }
      : null,
    pendingRedemptions: redemptions
      .map((redemption) => ({
        ...redemption,
        reward_name: redemption.reward_definitions?.name ?? 'Dame reward',
      }))
      .filter((redemption) => redemption.status === 'pending'),
    activity,
    activePromotions,
    qualifiedReferrals: qualifiedReferrals.length,
  };
}

export async function createDameRedemption(accessToken: string, rewardId: string) {
  return rewardsRpc<RewardRedemption>(
    accessToken,
    'create_dame_reward_redemption',
    { p_reward_id: rewardId },
  );
}

export async function cancelDameRedemption(accessToken: string, redemptionId: string) {
  return rewardsRpc<{ id: string; status: 'cancelled'; points_returned: number }>(
    accessToken,
    'cancel_dame_reward_redemption',
    { p_redemption_id: redemptionId },
  );
}

export async function createRewardsOrderLink(
  accessToken: string,
  userId: string,
  squareOrderId: string,
) {
  await rewardsRequest<unknown[]>(accessToken, '/rewards_order_links', {
    method: 'POST',
    headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify({
      square_order_id: squareOrderId,
      user_id: userId,
    }),
  });
}

export async function lookupDameReward(accessToken: string, code: string) {
  return rewardsRpc<AdminRewardLookup>(accessToken, 'lookup_dame_reward', {
    p_code: code,
  });
}

export async function redeemDameReward(accessToken: string, code: string) {
  return rewardsRpc<{
    id: string;
    code: string;
    status: 'redeemed';
    reward_name: string;
    first_name: string;
  }>(accessToken, 'redeem_dame_reward', {
    p_code: code,
  });
}

export async function listRewardPromotions(accessToken: string) {
  return rewardsRequest<RewardPromotion[]>(
    accessToken,
    '/reward_promotions?select=id,name,multiplier,scope,eligible_categories,starts_at,ends_at,active,created_at&order=starts_at.desc',
  );
}

export async function createRewardPromotion(
  accessToken: string,
  input: Pick<
    RewardPromotion,
    'name' | 'scope' | 'eligible_categories' | 'starts_at' | 'ends_at'
  >,
) {
  const promotions = await rewardsRequest<RewardPromotion[]>(
    accessToken,
    '/reward_promotions',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        ...input,
        multiplier: 2,
        active: true,
      }),
    },
  );
  if (!promotions[0]) throw new Error('Could not create the 2× points campaign.');
  return promotions[0];
}

export async function setRewardPromotionActive(
  accessToken: string,
  promotionId: string,
  active: boolean,
) {
  const promotions = await rewardsRequest<RewardPromotion[]>(
    accessToken,
    `/reward_promotions?id=eq.${encodeURIComponent(promotionId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ active }),
    },
  );
  if (!promotions[0]) throw new Error('Could not update that points campaign.');
  return promotions[0];
}

export type RewardsAccountPayload = {
  user: {
    id: string;
    email: string;
    emailConfirmed: boolean;
  };
  profile: CustomerProfile;
  rewards: DameRewardsStatus;
  favorites: string[];
  menu: SquareMenuItem[];
  orders: PickupOrder[];
  bookings: CateringRequest[];
};
