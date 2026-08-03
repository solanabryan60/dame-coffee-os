import { calculateCateringEstimateCents } from '@/app/lib/catering-pricing';
import { createSquareCateringDepositLink } from '@/app/lib/square';
import { createCateringRequest } from '@/app/lib/supabase-admin';

type CateringDepositBody = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date?: string;
  startTime?: string;
  drinks?: number;
  hours?: number;
  acceptedTerms?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CateringDepositBody;
    const details = {
      name: body.name?.trim() ?? '',
      email: body.email?.trim().toLowerCase() ?? '',
      phone: body.phone?.trim() ?? '',
      address: body.address?.trim() ?? '',
      date: body.date?.trim() ?? '',
      startTime: body.startTime?.trim() ?? '',
      drinks: Number(body.drinks),
      hours: Number(body.hours),
    };

    if (!details.name || !details.email || !details.phone || !details.address) {
      return Response.json({ error: 'Enter your contact details and full event address.' }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(details.email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!DATE_PATTERN.test(details.date) || !TIME_PATTERN.test(details.startTime)) {
      return Response.json({ error: 'Choose the event date and start time.' }, { status: 400 });
    }
    if (details.date < new Date().toISOString().slice(0, 10)) {
      return Response.json({ error: 'Choose a future event date.' }, { status: 400 });
    }
    if (!Number.isInteger(details.drinks) || details.drinks < 100 || details.drinks > 600 || details.drinks % 50 !== 0) {
      return Response.json({ error: 'Choose 100–600 drinks in groups of 50.' }, { status: 400 });
    }
    if (!Number.isInteger(details.hours) || details.hours < 2 || details.hours > 12 || details.hours % 2 !== 0) {
      return Response.json({ error: 'Choose 2–12 hours in two-hour steps.' }, { status: 400 });
    }
    if (body.acceptedTerms !== true) {
      return Response.json({ error: 'Accept the deposit and date-request terms to continue.' }, { status: 400 });
    }

    const requestId = crypto.randomUUID();
    const paymentLink = await createSquareCateringDepositLink(details, requestId);
    await createCateringRequest({
      id: requestId,
      name: details.name,
      email: details.email,
      phone: details.phone,
      address: details.address,
      event_date: details.date,
      start_time: details.startTime,
      drinks: details.drinks,
      service_hours: details.hours,
      estimate_cents: calculateCateringEstimateCents(details.drinks, details.hours),
      deposit_cents: 20000,
      square_order_id: paymentLink.orderId,
    });
    return Response.json({ checkoutUrl: paymentLink.url, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deposit checkout is temporarily unavailable.';
    return Response.json({ error: message }, { status: 500 });
  }
}
