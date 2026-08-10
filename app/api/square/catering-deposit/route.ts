import { calculateCateringEstimateCents } from '@/app/lib/catering-pricing';
import { createSquareCateringDepositLink } from '@/app/lib/square';
import { createCateringRequest } from '@/app/lib/supabase-admin';
import { readAuthUser } from '@/app/lib/supabase-rest';

type CateringDepositBody = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  guestCount?: number | null;
  eventSetting?: 'indoor' | 'outdoor' | 'both' | 'unsure';
  budgetDollars?: number | null;
  notes?: string;
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
const EVENT_SETTINGS = new Set(['indoor', 'outdoor', 'both', 'unsure']);

function bearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CateringDepositBody;
    const details = {
      name: body.name?.trim() ?? '',
      email: body.email?.trim().toLowerCase() ?? '',
      phone: body.phone?.trim() ?? '',
      company: body.company?.trim() ?? '',
      guestCount: body.guestCount == null ? null : Number(body.guestCount),
      eventSetting: body.eventSetting ?? 'outdoor',
      budgetCents: body.budgetDollars == null ? null : Math.round(Number(body.budgetDollars) * 100),
      notes: body.notes?.trim() ?? '',
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
    if (details.company.length > 160 || details.notes.length > 2000) {
      return Response.json({ error: 'Shorten the company name or event notes.' }, { status: 400 });
    }
    if (details.guestCount !== null && (!Number.isInteger(details.guestCount) || details.guestCount < 1 || details.guestCount > 5000)) {
      return Response.json({ error: 'Enter a guest count between 1 and 5,000.' }, { status: 400 });
    }
    if (!EVENT_SETTINGS.has(details.eventSetting)) {
      return Response.json({ error: 'Choose an indoor, outdoor, mixed, or undecided event setting.' }, { status: 400 });
    }
    if (details.budgetCents !== null && (!Number.isInteger(details.budgetCents) || details.budgetCents < 0 || details.budgetCents > 100000000)) {
      return Response.json({ error: 'Enter a valid event budget.' }, { status: 400 });
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
    const accessToken = bearerToken(request);
    const customerUserId = accessToken
      ? await readAuthUser(accessToken).then((user) => user.id).catch(() => null)
      : null;
    const paymentLink = await createSquareCateringDepositLink(details, requestId);
    await createCateringRequest({
      id: requestId,
      customer_user_id: customerUserId,
      name: details.name,
      email: details.email,
      phone: details.phone,
      company: details.company,
      guest_count: details.guestCount,
      event_setting: details.eventSetting,
      budget_cents: details.budgetCents,
      customer_notes: details.notes,
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
