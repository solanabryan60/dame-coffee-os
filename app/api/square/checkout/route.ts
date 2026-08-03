import { createSquarePaymentLink } from '@/app/lib/square';
import { createRewardsOrderLink } from '@/app/lib/dame-rewards';
import {
  createPickupOrder,
  hashPickupTrackingToken,
} from '@/app/lib/supabase-admin';
import { readAuthUser, readSiteSettings } from '@/app/lib/supabase-rest';

type CheckoutRequest = {
  lines?: Array<{
    variationId?: string;
    quantity?: number;
    modifierIds?: string[];
  }>;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    note?: string;
  };
};

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function POST(request: Request) {
  try {
    const settings = await readSiteSettings();
    if (!settings.is_open || !settings.mobile_ordering) {
      return Response.json(
        { error: 'Pickup ordering is currently paused. Check our live location for the next opening.' },
        { status: 409 },
      );
    }

    const body = (await request.json()) as CheckoutRequest;
    const lines = (body.lines ?? []).map((line) => ({
      variationId: line.variationId ?? '',
      quantity: line.quantity ?? 0,
      modifierIds: Array.isArray(line.modifierIds) ? line.modifierIds.slice(0, 20) : [],
    }));
    const customer = {
      name: body.customer?.name?.trim().slice(0, 160) ?? '',
      email: body.customer?.email?.trim().toLowerCase().slice(0, 320) ?? '',
      phone: body.customer?.phone?.trim().slice(0, 40) ?? '',
      note: body.customer?.note?.trim().slice(0, 500) ?? '',
    };

    if (!lines.length || lines.length > 30) {
      return Response.json({ error: 'Add at least one item to your order.' }, { status: 400 });
    }
    if (!customer.name || !customer.email || !customer.phone) {
      return Response.json({ error: 'Enter your name, email, and phone number for pickup.' }, { status: 400 });
    }

    const accessToken = bearerToken(request);
    const rewardsUser = accessToken ? await readAuthUser(accessToken) : null;
    const pickupOrderId = crypto.randomUUID();
    const trackingToken = crypto.randomUUID();
    const trackingQuery = new URLSearchParams({
      order: pickupOrderId,
      key: trackingToken,
    });
    const paymentLink = await createSquarePaymentLink(
      lines,
      customer,
      settings.wait_minutes,
      `/order/complete?${trackingQuery}`,
    );

    await createPickupOrder({
      id: pickupOrderId,
      customer_user_id: rewardsUser?.id ?? null,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_note: customer.note,
      line_items: paymentLink.lineItems,
      subtotal_cents: paymentLink.subtotalCents,
      square_order_id: paymentLink.orderId,
      tracking_token_hash: hashPickupTrackingToken(trackingToken),
      location_title: settings.location_title,
      location_address: settings.address,
      quoted_wait_minutes: settings.wait_minutes,
    });

    if (accessToken && rewardsUser) {
      await createRewardsOrderLink(accessToken, rewardsUser.id, paymentLink.orderId);
    }

    return Response.json({ checkoutUrl: paymentLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout is temporarily unavailable.';
    return Response.json({ error: message }, { status: 500 });
  }
}
