import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  getSquareCustomer,
  getSquareOrderRewardContext,
} from '@/app/lib/square';
import {
  findRewardUserByContact,
  findRewardPurchaseByPayment,
  findRewardUserBySquareOrder,
  findCateringRequestBySquareOrder,
  findCateringRequestBySquarePayment,
  findPickupOrderBySquareOrder,
  findPickupOrderBySquarePayment,
  getActiveRewardPromotions,
  hasDameRewardsServerConfig,
  markCateringDepositPaid,
  markCateringDepositRefunded,
  markPickupOrderPaid,
  markPickupOrderRefunded,
  recordDameSquareEvent,
  type ActiveRewardPromotion,
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

function matchingPromotion(
  promotions: ActiveRewardPromotion[],
  categories: string[],
) {
  const orderCategories = new Set(categories);
  return promotions.find((promotion) => {
    if (promotion.scope === 'all') return true;
    return promotion.eligible_categories.some((category) =>
      orderCategories.has(category),
    );
  });
}

async function handlePayment(event: SquareWebhookEvent) {
  const payment = event.data?.object?.payment;
  if (!payment?.id || payment.status !== 'COMPLETED') return;

  const paymentAmountCents = payment.amount_money?.amount ?? 0;
  if (paymentAmountCents <= 0) return;

  if (payment.order_id) {
    const cateringRequest = await findCateringRequestBySquareOrder(payment.order_id);
    if (cateringRequest) {
      await markCateringDepositPaid({
        requestId: cateringRequest.id,
        squarePaymentId: payment.id,
      });
      return;
    }

    const pickupOrder = await findPickupOrderBySquareOrder(payment.order_id);
    if (pickupOrder) {
      await markPickupOrderPaid({
        orderId: pickupOrder.id,
        squarePaymentId: payment.id,
        paidCents: paymentAmountCents,
      });
    }
  }

  const userId = await resolvePaymentUser(payment);
  if (!userId) return;

  const [orderContext, promotions] = await Promise.all([
    payment.order_id
      ? getSquareOrderRewardContext(payment.order_id)
      : Promise.resolve(null),
    getActiveRewardPromotions(),
  ]);
  const eligibleAmountCents = orderContext
    ? Math.min(paymentAmountCents, orderContext.eligibleAmountCents)
    : paymentAmountCents;
  const promotion = matchingPromotion(
    promotions,
    orderContext?.categories ?? [],
  );
  const multiplier = promotion?.multiplier ?? 1;
  const points = Math.floor(eligibleAmountCents / 10) * multiplier;
  if (eligibleAmountCents <= 0 || points <= 0) return;

  await recordDameSquareEvent({
    userId,
    squareId: payment.id,
    eventType: 'purchase',
    points,
    amountCents: eligibleAmountCents,
    multiplier,
    description: promotion
      ? `Dame purchase · ${promotion.name} · ${points} points earned`
      : `Dame purchase · ${points} points earned`,
  });
}

async function handleRefund(event: SquareWebhookEvent) {
  const refund = event.data?.object?.refund;
  if (!refund?.id || !refund.payment_id || refund.status !== 'COMPLETED') return;

  const amountCents = refund.amount_money?.amount ?? 0;
  if (amountCents <= 0) return;

  const cateringRequest = await findCateringRequestBySquarePayment(refund.payment_id);
  if (cateringRequest) {
    if (amountCents >= cateringRequest.deposit_cents) {
      await markCateringDepositRefunded(cateringRequest.id);
    }
    return;
  }

  const pickupOrder = await findPickupOrderBySquarePayment(refund.payment_id);
  if (
    pickupOrder &&
    pickupOrder.paid_cents &&
    amountCents >= pickupOrder.paid_cents
  ) {
    await markPickupOrderRefunded(pickupOrder.id);
  }

  const purchase = await findRewardPurchaseByPayment(refund.payment_id);
  if (!purchase) return;
  const remainingPoints = Math.max(
    0,
    purchase.points - purchase.refundedPoints,
  );
  const points = Math.min(
    remainingPoints,
    Math.max(
      1,
      Math.floor(
        purchase.points * Math.min(1, amountCents / purchase.amountCents),
      ),
    ),
  );
  if (points <= 0) return;

  await recordDameSquareEvent({
    userId: purchase.userId,
    squareId: refund.id,
    eventType: 'refund',
    points,
    amountCents,
    multiplier: purchase.multiplier,
    relatedSquareId: refund.payment_id,
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
