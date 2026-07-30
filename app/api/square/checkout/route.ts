import { createSquarePaymentLink } from '@/app/lib/square';
import { readSiteSettings } from '@/app/lib/supabase-rest';

type CheckoutRequest = {
  lines?: Array<{
    variationId?: string;
    quantity?: number;
    modifierIds?: string[];
  }>;
  customer?: {
    name?: string;
    phone?: string;
    note?: string;
  };
};

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
      name: body.customer?.name?.trim() ?? '',
      phone: body.customer?.phone?.trim() ?? '',
      note: body.customer?.note?.trim() ?? '',
    };

    if (!lines.length || lines.length > 30) {
      return Response.json({ error: 'Add at least one item to your order.' }, { status: 400 });
    }
    if (!customer.name || !customer.phone) {
      return Response.json({ error: 'Enter your name and phone number for pickup.' }, { status: 400 });
    }

    const checkoutUrl = await createSquarePaymentLink(lines, customer, settings.wait_minutes);
    return Response.json({ checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout is temporarily unavailable.';
    return Response.json({ error: message }, { status: 500 });
  }
}
