import {
  deletePushSubscription,
  savePushSubscription,
} from '@/app/lib/supabase-admin';

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

function validText(value: unknown, min: number, max: number) {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

function validEndpoint(value: unknown) {
  if (!validText(value, 20, 4096)) return false;
  try {
    return new URL(value as string).protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscriptionBody;
    if (
      !validEndpoint(body.endpoint) ||
      !validText(body.keys?.p256dh, 20, 512) ||
      !validText(body.keys?.auth, 8, 256)
    ) {
      return Response.json({ error: 'That notification subscription is not valid.' }, { status: 400 });
    }

    await savePushSubscription({
      endpoint: body.endpoint as string,
      p256dh: body.keys?.p256dh as string,
      auth: body.keys?.auth as string,
    });
    return Response.json({ subscribed: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not turn on notifications.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { endpoint?: unknown };
    if (!validEndpoint(body.endpoint)) {
      return Response.json({ error: 'That notification subscription is not valid.' }, { status: 400 });
    }
    await deletePushSubscription(body.endpoint as string);
    return Response.json({ subscribed: false });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not turn off notifications.' },
      { status: 500 },
    );
  }
}
