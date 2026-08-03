import { findPickupOrderByTracking } from '@/app/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const trackingToken = new URL(request.url).searchParams.get('key') ?? '';

  if (!id || trackingToken.length < 20) {
    return Response.json({ error: 'This pickup link is incomplete.' }, { status: 400 });
  }

  try {
    const order = await findPickupOrderByTracking({ orderId: id, trackingToken });
    if (!order) {
      return Response.json({ error: 'We could not find that pickup order.' }, { status: 404 });
    }

    return Response.json(
      {
        id: order.id,
        orderNumber: order.id.slice(0, 6).toUpperCase(),
        customerName: order.customer_name,
        lineItems: order.line_items,
        subtotalCents: order.subtotal_cents,
        paidCents: order.paid_cents,
        status: order.status,
        locationTitle: order.location_title,
        locationAddress: order.location_address,
        quotedWaitMinutes: order.quoted_wait_minutes,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        preparingAt: order.preparing_at,
        readyAt: order.ready_at,
        pickedUpAt: order.picked_up_at,
        refundedAt: order.refunded_at,
        cancelledAt: order.cancelled_at,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(
      'Dame pickup tracking:',
      error instanceof Error ? error.message : 'Unknown pickup tracking error',
    );
    return Response.json({ error: 'Pickup tracking is temporarily unavailable.' }, { status: 500 });
  }
}
