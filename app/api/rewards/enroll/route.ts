import { enrollSquareRewards } from '@/app/lib/square';
import {
  readAuthUser,
  readCustomerProfile,
} from '@/app/lib/supabase-rest';

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return Response.json({ error: 'Please sign in before joining rewards.' }, { status: 401 });
    }

    const user = await readAuthUser(accessToken);
    if (!user.email || !user.email_confirmed_at) {
      return Response.json(
        { error: 'Confirm your email before connecting Square Rewards.' },
        { status: 400 },
      );
    }
    const profile = await readCustomerProfile(accessToken, user.id);
    if (!profile.phone) {
      return Response.json(
        { error: 'Add a mobile number to your profile before joining.' },
        { status: 400 },
      );
    }

    const rewards = await enrollSquareRewards({
      userId: user.id,
      firstName: profile.first_name,
      email: user.email,
      phone: profile.phone,
    });
    return Response.json({ rewards });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not finish enrollment.';
    const status = /sign in|jwt|token|session/i.test(message) ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
