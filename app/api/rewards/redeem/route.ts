import { createDameRedemption } from '@/app/lib/dame-rewards';
import { readAuthUser } from '@/app/lib/supabase-rest';

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return Response.json({ error: 'Please sign in before choosing a reward.' }, { status: 401 });
    }

    await readAuthUser(accessToken);
    const body = (await request.json()) as { rewardId?: string };
    const rewardId = body.rewardId?.trim() ?? '';
    if (!rewardId) {
      return Response.json({ error: 'Choose a reward first.' }, { status: 400 });
    }

    const redemption = await createDameRedemption(accessToken, rewardId);
    return Response.json({ redemption });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not prepare that reward.';
    const status = /sign in|jwt|token|session/i.test(message) ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
