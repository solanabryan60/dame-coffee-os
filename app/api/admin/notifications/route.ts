import webpush from 'web-push';
import {
  deletePushSubscription,
  listPushSubscriptions,
  requireDameAdmin,
} from '@/app/lib/supabase-admin';

export const runtime = 'nodejs';

function bearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

function requireVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error('Dame notifications are not configured in Vercel yet.');
  }
  return { publicKey, privateKey };
}

export async function GET(request: Request) {
  try {
    await requireDameAdmin(bearerToken(request));
    const subscriptions = await listPushSubscriptions();
    return Response.json({ subscribers: subscriptions.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not load notifications.' },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireDameAdmin(bearerToken(request));
    const vapid = requireVapidConfig();
    const body = (await request.json()) as {
      title?: unknown;
      message?: unknown;
      url?: unknown;
    };
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '/app';

    if (!title || title.length > 80 || !message || message.length > 180) {
      return Response.json({ error: 'Add a short title and message before sending.' }, { status: 400 });
    }
    if (!url.startsWith('/') || url.startsWith('//') || url.length > 300) {
      return Response.json({ error: 'Notification links must stay inside damecoffeeco.com.' }, { status: 400 });
    }

    webpush.setVapidDetails(
      `mailto:${admin.email || 'info@damecoffeeco.com'}`,
      vapid.publicKey,
      vapid.privateKey,
    );

    const subscriptions = await listPushSubscriptions();
    let sent = 0;
    let expired = 0;
    const payload = JSON.stringify({ title, body: message, url });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
            { TTL: 60 * 60 * 12, urgency: 'normal' },
          );
          sent += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await deletePushSubscription(subscription.endpoint);
            expired += 1;
          }
        }
      }),
    );

    return Response.json({ sent, expired, subscribers: subscriptions.length - expired });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not send that notification.' },
      { status: 500 },
    );
  }
}
