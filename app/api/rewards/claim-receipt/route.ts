import {
  findSquarePaymentForReceiptClaim,
  getSquareOrderRewardContext,
} from '@/app/lib/square';
import {
  findCateringRequestBySquareOrder,
  findRewardUserByPayment,
  getRewardPromotionsAt,
  recordDameReceiptClaim,
  type ActiveRewardPromotion,
} from '@/app/lib/supabase-admin';
import { readAuthUser } from '@/app/lib/supabase-rest';

export const runtime = 'nodejs';

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function matchingPromotion(
  promotions: ActiveRewardPromotion[],
  categories: string[],
) {
  const orderCategories = new Set(categories);
  return promotions.find((promotion) =>
    promotion.scope === 'all' ||
    promotion.eligible_categories.some((category) => orderCategories.has(category)),
  );
}

function validPurchaseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const age = Date.now() - date.getTime();
  return age >= -24 * 60 * 60 * 1000 && age <= 30 * 24 * 60 * 60 * 1000;
}

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return Response.json(
        { error: 'Join or sign in before saving this purchase.' },
        { status: 401 },
      );
    }

    const user = await readAuthUser(accessToken);
    const body = (await request.json()) as {
      receiptNumber?: string;
      purchaseDate?: string;
      totalCents?: number;
    };
    const receiptNumber = body.receiptNumber
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 32) ?? '';
    const purchaseDate = body.purchaseDate?.trim() ?? '';
    const totalCents = Number.isInteger(body.totalCents) ? Number(body.totalCents) : 0;

    if (receiptNumber.length < 3 || !validPurchaseDate(purchaseDate)) {
      return Response.json(
        { error: 'Check the receipt number and choose a purchase date from the last 30 days.' },
        { status: 400 },
      );
    }
    if (totalCents < 100 || totalCents > 100_000) {
      return Response.json(
        { error: 'Enter the exact receipt total, including tax and tip.' },
        { status: 400 },
      );
    }

    const payment = await findSquarePaymentForReceiptClaim({
      receiptNumber,
      purchaseDate,
      totalCents,
    });
    if (!payment) {
      return Response.json(
        { error: 'We could not match those receipt details. Check the code, date, and exact total.' },
        { status: 404 },
      );
    }

    if (payment.orderId) {
      const catering = await findCateringRequestBySquareOrder(payment.orderId);
      if (catering) {
        return Response.json(
          { error: 'Catering deposits do not earn Dame Rewards points.' },
          { status: 400 },
        );
      }
    }

    const existingUserId = await findRewardUserByPayment(payment.id);
    if (existingUserId && existingUserId !== user.id) {
      return Response.json(
        { error: 'Those receipt points have already been saved to another member.' },
        { status: 409 },
      );
    }
    if (existingUserId === user.id) {
      return Response.json({ duplicate: true, pointsAdded: 0 });
    }

    const [orderContext, promotions] = await Promise.all([
      payment.orderId
        ? getSquareOrderRewardContext(payment.orderId)
        : Promise.resolve(null),
      getRewardPromotionsAt(payment.createdAt),
    ]);
    const paidAfterRefunds = Math.max(0, payment.totalCents - payment.refundedCents);
    const eligibleAmountCents = Math.min(
      paidAfterRefunds,
      orderContext?.eligibleAmountCents ?? paidAfterRefunds,
    );
    if (eligibleAmountCents < 100) {
      return Response.json(
        { error: 'This purchase no longer has an eligible balance for points.' },
        { status: 400 },
      );
    }

    const promotion = matchingPromotion(promotions, orderContext?.categories ?? []);
    const multiplier = promotion?.multiplier ?? 1;
    const points = Math.floor(eligibleAmountCents / 10) * multiplier;
    const result = await recordDameReceiptClaim({
      userId: user.id,
      squarePaymentId: payment.id,
      points,
      amountCents: eligibleAmountCents,
      multiplier,
      description: promotion
        ? `Receipt saved · ${promotion.name} · ${points} points earned`
        : `Receipt saved · ${points} points earned`,
    });

    return Response.json({
      duplicate: result.duplicate,
      pointsAdded: result.duplicate ? 0 : result.points_delta ?? points,
      pointsBalance: result.points_balance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'We could not save those points.';
    const status = /sign in|jwt|token|session/i.test(message)
      ? 401
      : /three receipt claims|claim limit/i.test(message)
        ? 429
        : 500;
    return Response.json({ error: message }, { status });
  }
}
