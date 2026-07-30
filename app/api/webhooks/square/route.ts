import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSquareCustomer } from '@/app/lib/square';
import {
  findRewardUserByContact,
  findRewardUserByPayment,
  findRewardUserBySquareOrder,
  hasDameRewardsServerConfig,
  recordDameSquareEvent,
} from '@/app/lib/supabase-admin';

export const runtime = 'nodejs';

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type SquareWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      payment?: {
        id?: string;
        order_id?: string;
        customer_id?: string;
        status?: string;
        amount_money?: SquareMoney;
      };
      refund?: {
        id?: string;
        payment_id?: string;
        status?: string;
        amount_money?: SquareMoney;
      };
    };
  };
};

function notificationUrl() {
  return (
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ||
    'https://www.damecoffeeco.com/api/webhooks/square'
  );
}

function validSignature(rawBody: string, receivedSignature: string) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey || !receivedSignature) return false;

  const expected = createHmac('sha256', signatureKey)
    .update(notificationUrl() + rawBody)
    .digest('base64');

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(receivedSignature);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function resolvePaymentUser(payment: NonNullable<
  NonNullable<NonNullable<SquareWebhookEvent['data']>['object']>['payment']
>) {
  if (payment.order_id) {
    const linkedUser = await findRewardUserBySquareOrder(payment.order_id);
    if (linkedUser) return linkedUser;
  }

  if (payment.customer_id) {
    const customer = await getSquareCustomer(payment.customer_id);
    if (customer) {
      return findRewardUserByContact({
        email: customer.email_address,
        phone: customer.phone_number,
      });
    }
  }

  return null;
}

async function handlePayment(event: SquareWebhookEvent) {
  const payment = event.data?.object?.payment;
  if (!payment?.id || payment.status !== 'COMPLETED') return;

  const amountCents = payment.amount_money?.amount ?? 0;
  const points = Math.floor(amountCents / 100);
  if (amountCents <= 0 || points <= 0) return;

  const userId = await resolvePaymentUser(payment);
  if (!userId) return;

  await recordDameSquareEvent({
    userId,
    squareId: payment.id,
    eventType: 'purchase',
    points,
    amountCents,
    description: `Dame purchase · ${points} point${points === 1 ? '' : 's'} earned`,
  });
}

async function handleRefund(event: SquareWebhookEvent) {
  const refund = event.data?.object?.refund;
  if (!refund?.id || !refund.payment_id || refund.status !== 'COMPLETED') return;

  const amountCents = refund.amount_money?.amount ?? 0;
  const points = Math.floor(amountCents / 100);
  if (amountCents <= 0 || points <= 0) return;

  const userId = await findRewardUserByPayment(refund.payment_id);
  if (!userId) return;

  await recordDameSquareEvent({
    userId,
    squareId: refund.id,
    eventType: 'refund',
    points,
    amountCents,
    description: `Refund adjustment · ${points} point${points === 1 ? '' : 's'}`,
  });
}

export async function POST(request: Request) {
  if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || !hasDameRewardsServerConfig()) {
    return Response.json({ error: 'Rewards webhook is not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const receivedSignature =
    request.headers.get('x-square-hmacsha256-signature') ?? '';

  if (!validSignature(rawBody, receivedSignature)) {
    return Response.json({ error: 'Invalid Square signature.' }, { status: 403 });
  }

  try {
    const event = JSON.parse(rawBody) as SquareWebhookEvent;
    if (event.type === 'payment.updated') await handlePayment(event);
    if (event.type === 'refund.updated') await handleRefund(event);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    console.error('Dame Rewards Square webhook:', message);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
