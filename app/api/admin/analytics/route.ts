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
    const month = Number(params.get('month'));
    const year = Number(params.get('year'));
    const analytics = await getDameSalesAnalytics(range, {
      month: Number.isInteger(month) ? month : undefined,
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
