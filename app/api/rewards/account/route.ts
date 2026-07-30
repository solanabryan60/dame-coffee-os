import { getSquareRewardsStatus } from '@/app/lib/square';
import {
  readAuthUser,
  readCustomerProfile,
} from '@/app/lib/supabase-rest';

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
    const profile = await readCustomerProfile(accessToken, user.id);
    const rewards = await getSquareRewardsStatus(user.email, profile.phone);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: Boolean(user.email_confirmed_at),
      },
      profile,
      rewards,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load your rewards.';
    const status = /sign in|jwt|token|session/i.test(message) ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
