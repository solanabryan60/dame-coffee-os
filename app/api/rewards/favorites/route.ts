import { readAuthUser, setCustomerFavorite } from '@/app/lib/supabase-rest';

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return Response.json({ error: 'Please sign in to manage your favorites.' }, { status: 401 });
    }
    const user = await readAuthUser(accessToken);
    const body = (await request.json()) as { squareItemId?: string; selected?: boolean };
    const squareItemId = body.squareItemId?.trim() ?? '';
    if (!squareItemId || squareItemId.length > 200 || typeof body.selected !== 'boolean') {
      return Response.json({ error: 'Choose a valid Dame menu item.' }, { status: 400 });
    }
    await setCustomerFavorite(accessToken, user.id, squareItemId, body.selected);
    return Response.json({ squareItemId, selected: body.selected });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update that favorite.';
    const status = /sign in|jwt|token|session/i.test(message) ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
