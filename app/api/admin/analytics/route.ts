import { requireDameAdmin } from '@/app/lib/supabase-admin';
import {
  getDameSalesAnalytics,
  type SalesRange,
} from '@/app/lib/square-analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedRanges = new Set<SalesRange>(['day', 'week', 'month', 'quarter', 'year']);

function bearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

export async function GET(request: Request) {
  try {
    await requireDameAdmin(bearerToken(request));
    const params = new URL(request.url).searchParams;
    const requested = params.get('range') as SalesRange | null;
    const range = requested && allowedRanges.has(requested) ? requested : 'day';
    const monthParam = params.get('month');
    const quarterParam = params.get('quarter');
    const yearParam = params.get('year');
    const month = monthParam ? Number(monthParam) : undefined;
    const quarter = quarterParam ? Number(quarterParam) : undefined;
    const year = yearParam ? Number(yearParam) : undefined;
    const analytics = await getDameSalesAnalytics(range, {
      date: params.get('date') ?? undefined,
      month: Number.isInteger(month) ? month : undefined,
      quarter: Number.isInteger(quarter) ? quarter : undefined,
      year: Number.isInteger(year) ? year : undefined,
    });
    return Response.json(analytics, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load Square sales.';
    const status = /sign in|access|jwt|token|account does not have/i.test(message) ? 401 : 500;
    return Response.json({ error: message }, { status });
  }
}
