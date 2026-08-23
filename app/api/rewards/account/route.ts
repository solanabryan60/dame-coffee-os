import { getDameRewardsStatus } from '@/app/lib/dame-rewards';
import {
  listCustomerCateringRequests,
  listCustomerFavorites,
  listCustomerPickupOrders,
  readAuthUser,
  readCustomerProfile,
  readMenuPresentation,
} from '@/app/lib/supabase-rest';
import { getSquareCatalog } from '@/app/lib/square';
import { applyMenuPresentation } from '@/app/lib/menu-presentation';

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function GET(request: Request) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return Response.json({ error: 'Please sign in to view your rewards.' }, { status: 401 });
    }

    const user = await readAuthUser(accessToken);
    if (!user.email) {
      return Response.json({ error: 'Your account needs a confirmed email address.' }, { status: 400 });
    }
    const [profile, rewards, favoriteRows, orders, bookings, catalog, presentation] = await Promise.all([
      readCustomerProfile(accessToken, user.id),
      getDameRewardsStatus(accessToken, user.id),
      listCustomerFavorites(accessToken, user.id).catch(() => []),
      listCustomerPickupOrders(accessToken, user.id).catch(() => []),
      listCustomerCateringRequests(accessToken, user.id).catch(() => []),
      getSquareCatalog(),
      readMenuPresentation().catch(() => []),
    ]);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: Boolean(user.email_confirmed_at),
      },
      profile,
      rewards,
      favorites: favoriteRows.map((favorite) => favorite.square_item_id),
      menu: applyMenuPresentation(catalog.items, presentation),
      orders,
      bookings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load your rewards.';
    const status = /sign in|jwt|token|session/i.test(message) ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
