import 'server-only';

const SQUARE_API_VERSION = '2026-07-15';
const BUSINESS_TIME_ZONE = 'America/Los_Angeles';

export type SalesRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type SalesSelection = {
  date?: string;
  month?: number;
  quarter?: number;
  year?: number;
};

type SalesMetrics = {
  netSalesCents: number;
  totalCollectedCents: number;
  orderCount: number;
  averageOrderCents: number;
  taxCents: number;
  tipCents: number;
  discountCents: number;
  serviceChargeCents: number;
};

type ItemSummary = {
  name: string;
  quantity: number;
  salesCents: number;
};

export type DameSalesAnalytics = {
  range: SalesRange;
  label: string;
  updatedAt: string;
  period: {
    startAt: string;
    endAt: string;
  };
  metrics: SalesMetrics;
  comparison: {
    previousNetSalesCents: number;
    percentChange: number | null;
  };
  chart: Array<{
    label: string;
    detailLabel: string;
    startAt: string;
    endAt: string;
    salesCents: number;
    orderCount: number;
    metrics: SalesMetrics;
    items: ItemSummary[];
  }>;
  topItems: ItemSummary[];
  customerInsights: {
    identifiedCustomers: number;
    repeatCustomers: number;
  };
  peakHour: {
    label: string;
    orderCount: number;
    salesCents: number;
  } | null;
  categorySummary: Array<{
    name: string;
    quantity: number;
    salesCents: number;
  }>;
};

type SquareMoney = { amount?: number };

type AnalyticsOrder = {
  id?: string;
  customer_id?: string;
  state?: string;
  closed_at?: string;
  total_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_tip_money?: SquareMoney;
  total_discount_money?: SquareMoney;
  total_service_charge_money?: SquareMoney;
  line_items?: Array<{
    name?: string;
    quantity?: string;
    total_money?: SquareMoney;
    total_tax_money?: SquareMoney;
  }>;
};

type SearchOrdersResponse = {
  orders?: AnalyticsOrder[];
  cursor?: string;
  errors?: Array<{ detail?: string }>;
};

type CalendarParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const rangeLabels: Record<SalesRange, string> = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
};

function squareConfig() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';
  if (!accessToken || !locationId) {
    throw new Error('Square sales reporting is not configured yet.');
  }
  return {
    accessToken,
    locationId,
    baseUrl: environment === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com',
  };
}

function dateParts(date: Date, timeZone = BUSINESS_TIME_ZONE): CalendarParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const number = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: number('year'),
    month: number('month'),
    day: number('day'),
    hour: number('hour'),
    minute: number('minute'),
    second: number('second'),
  };
}

function zonedDateTimeToUtc(parts: CalendarParts) {
  const desired = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let guess = desired;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = dateParts(new Date(guess));
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    const adjustment = desired - observedAsUtc;
    guess += adjustment;
    if (!adjustment) break;
  }

  return new Date(guess);
}

function localMidnight(year: number, month: number, day: number) {
  return zonedDateTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0 });
}

function currentRangeStart(range: SalesRange, now: Date) {
  const local = dateParts(now);
  if (range === 'day') return localMidnight(local.year, local.month, local.day);
  if (range === 'month') return localMidnight(local.year, local.month, 1);
  if (range === 'quarter') {
    const quarterMonth = Math.floor((local.month - 1) / 3) * 3 + 1;
    return localMidnight(local.year, quarterMonth, 1);
  }
  if (range === 'year') return localMidnight(local.year, 1, 1);

  const localDate = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const dayFromMonday = (localDate.getUTCDay() + 6) % 7;
  localDate.setUTCDate(localDate.getUTCDate() - dayFromMonday);
  return localMidnight(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth() + 1,
    localDate.getUTCDate(),
  );
}

function shiftLocalMonth(year: number, month: number, amount: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

function addLocalDays(start: Date, days: number) {
  const local = dateParts(start);
  const shifted = new Date(Date.UTC(local.year, local.month - 1, local.day + days));
  return localMidnight(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

function selectedLocalDay(value: string | undefined, now: Date) {
  const fallback = dateParts(now);
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return fallback;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  const valid = check.getUTCFullYear() === year
    && check.getUTCMonth() + 1 === month
    && check.getUTCDate() === day;
  if (!valid) return fallback;

  const earliestYear = fallback.year - 10;
  const chosen = localMidnight(Math.max(earliestYear, year), month, day);
  const today = localMidnight(fallback.year, fallback.month, fallback.day);
  return dateParts(chosen > today ? today : chosen);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function weekLabel(start: Date, end: Date) {
  const lastDay = addLocalDays(end, -1);
  const startParts = dateParts(start);
  const endParts = dateParts(lastDay);
  const startLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    ...(startParts.year !== endParts.year ? { year: 'numeric' as const } : {}),
  }).format(start);
  const endLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(lastDay);
  return `${startLabel}–${endLabel}`;
}

function periodFor(range: SalesRange, selection: SalesSelection, now: Date) {
  const localNow = dateParts(now);
  let start = currentRangeStart(range, now);
  let naturalEnd: Date | null = null;
  let previousCalendarStart: Date | null = null;
  let label = rangeLabels[range];

  if (range === 'day' || range === 'week') {
    const chosen = selectedLocalDay(selection.date, now);
    start = localMidnight(chosen.year, chosen.month, chosen.day);

    if (range === 'week') {
      const chosenDate = new Date(Date.UTC(chosen.year, chosen.month - 1, chosen.day));
      const dayFromMonday = (chosenDate.getUTCDay() + 6) % 7;
      start = addLocalDays(start, -dayFromMonday);
      naturalEnd = addLocalDays(start, 7);
      previousCalendarStart = addLocalDays(start, -7);
      label = weekLabel(start, naturalEnd);
    } else {
      naturalEnd = addLocalDays(start, 1);
      previousCalendarStart = addLocalDays(start, -1);
      label = dayLabel(start);
    }
  }

  if (range === 'month' && selection.year && selection.month) {
    const year = Math.min(localNow.year, Math.max(localNow.year - 10, selection.year));
    const latestMonth = year === localNow.year ? localNow.month : 12;
    const month = Math.min(latestMonth, Math.max(1, selection.month));
    const next = shiftLocalMonth(year, month, 1);
    const previous = shiftLocalMonth(year, month, -1);
    start = localMidnight(year, month, 1);
    naturalEnd = localMidnight(next.year, next.month, 1);
    previousCalendarStart = localMidnight(previous.year, previous.month, 1);
    label = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE,
      month: 'long',
      year: 'numeric',
    }).format(start);
  }

  if (range === 'year' && selection.year) {
    const year = Math.min(localNow.year, Math.max(localNow.year - 10, selection.year));
    start = localMidnight(year, 1, 1);
    naturalEnd = localMidnight(year + 1, 1, 1);
    previousCalendarStart = localMidnight(year - 1, 1, 1);
    label = String(year);
  }

  if (range === 'quarter' && selection.year && selection.quarter) {
    const year = Math.min(localNow.year, Math.max(localNow.year - 10, selection.year));
    const latestQuarter = year === localNow.year ? Math.ceil(localNow.month / 3) : 4;
    const quarter = Math.min(latestQuarter, Math.max(1, selection.quarter));
    const month = (quarter - 1) * 3 + 1;
    const next = shiftLocalMonth(year, month, 3);
    const previous = shiftLocalMonth(year, month, -3);
    start = localMidnight(year, month, 1);
    naturalEnd = localMidnight(next.year, next.month, 1);
    previousCalendarStart = localMidnight(previous.year, previous.month, 1);
    label = `Q${quarter} ${year}`;
  }

  const end = naturalEnd && naturalEnd < now ? naturalEnd : now;
  const isCompleteCalendarPeriod = Boolean(naturalEnd && naturalEnd <= now);
  const previousEnd = start;
  const previousStart = isCompleteCalendarPeriod && previousCalendarStart
    ? previousCalendarStart
    : new Date(start.getTime() - (end.getTime() - start.getTime()));

  return { start, end, previousStart, previousEnd, label };
}

async function searchCompletedOrders(start: Date, end: Date) {
  const config = squareConfig();
  const orders: AnalyticsOrder[] = [];
  let cursor = '';

  for (let page = 0; page < 30; page += 1) {
    const response = await fetch(`${config.baseUrl}/v2/orders/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': SQUARE_API_VERSION,
      },
      body: JSON.stringify({
        location_ids: [config.locationId],
        limit: 1000,
        cursor: cursor || undefined,
        return_entries: false,
        query: {
          filter: {
            state_filter: { states: ['COMPLETED'] },
            date_time_filter: {
              closed_at: {
                start_at: start.toISOString(),
                end_at: end.toISOString(),
              },
            },
          },
          sort: { sort_field: 'CLOSED_AT', sort_order: 'ASC' },
        },
      }),
      cache: 'no-store',
    });
    const payload = (await response.json()) as SearchOrdersResponse;
    if (!response.ok) {
      const detail = payload.errors?.[0]?.detail;
      if (/permission|unauthorized/i.test(detail ?? '')) {
        throw new Error('Square needs permission to read completed orders before sales can appear here.');
      }
      throw new Error(detail || 'Square sales are temporarily unavailable.');
    }
    orders.push(...(payload.orders ?? []));
    cursor = payload.cursor ?? '';
    if (!cursor) break;
  }

  return orders;
}

function cents(money?: SquareMoney) {
  return Number(money?.amount ?? 0);
}

function summarize(orders: AnalyticsOrder[]) {
  const summary = orders.reduce(
    (total, order) => {
      const collected = cents(order.total_money);
      const tax = cents(order.total_tax_money);
      const tip = cents(order.total_tip_money);
      const service = cents(order.total_service_charge_money);
      total.netSalesCents += collected - tax - tip - service;
      total.totalCollectedCents += collected;
      total.taxCents += tax;
      total.tipCents += tip;
      total.discountCents += cents(order.total_discount_money);
      total.serviceChargeCents += service;
      return total;
    },
    {
      netSalesCents: 0,
      totalCollectedCents: 0,
      taxCents: 0,
      tipCents: 0,
      discountCents: 0,
      serviceChargeCents: 0,
    },
  );
  return {
    ...summary,
    orderCount: orders.length,
    averageOrderCents: orders.length ? Math.round(summary.netSalesCents / orders.length) : 0,
  };
}

function bucketLabel(date: Date, range: SalesRange) {
  if (range === 'day') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: 'numeric',
    }).format(date);
  }
  if (range === 'quarter' || range === 'year') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE,
      month: 'short',
    }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function bucketDetailLabel(start: Date, end: Date, range: SalesRange) {
  if (range === 'day') {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${formatter.format(start)}–${formatter.format(end)}`;
  }
  if (range === 'week') return dayLabel(start);
  if (range === 'month') return weekLabel(start, end);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(start);
}

function buildChart(orders: AnalyticsOrder[], start: Date, end: Date, range: SalesRange) {
  const boundaries: Date[] = [start];
  const local = dateParts(start);

  if (range === 'day') {
    for (let hours = 3; hours < 24; hours += 3) {
      const boundary = new Date(start.getTime() + hours * 60 * 60 * 1000);
      if (boundary < end) boundaries.push(boundary);
    }
  } else if (range === 'week') {
    for (let day = 1; day < 7; day += 1) {
      const boundary = addLocalDays(start, day);
      if (boundary < end) boundaries.push(boundary);
    }
  } else if (range === 'month') {
    for (let day = 7; day < 35; day += 7) {
      const boundary = addLocalDays(start, day);
      if (boundary < end) boundaries.push(boundary);
    }
  } else {
    const maxMonths = range === 'quarter' ? 3 : 12;
    for (let monthOffset = 1; monthOffset < maxMonths; monthOffset += 1) {
      const next = shiftLocalMonth(local.year, local.month, monthOffset);
      const boundary = localMidnight(next.year, next.month, 1);
      if (boundary < end) boundaries.push(boundary);
    }
  }

  return boundaries.map((boundary, index) => {
    const bucketEnd = boundaries[index + 1] ?? end;
    const bucketOrders = orders.filter((order) => {
      const closedAt = new Date(order.closed_at ?? '').getTime();
      return Number.isFinite(closedAt)
        && closedAt >= boundary.getTime()
        && closedAt < bucketEnd.getTime();
    });
    const metrics = summarize(bucketOrders);
    return {
      label: bucketLabel(boundary, range),
      detailLabel: bucketDetailLabel(boundary, bucketEnd, range),
      startAt: boundary.toISOString(),
      endAt: bucketEnd.toISOString(),
      salesCents: metrics.netSalesCents,
      orderCount: metrics.orderCount,
      metrics,
      items: topItems(bucketOrders),
    };
  });
}

function topItems(orders: AnalyticsOrder[]) {
  const items = new Map<string, { quantity: number; salesCents: number }>();
  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      const name = item.name?.trim() || 'Unlabeled item';
      const current = items.get(name) ?? { quantity: 0, salesCents: 0 };
      current.quantity += Number(item.quantity ?? 0) || 0;
      current.salesCents += cents(item.total_money) - cents(item.total_tax_money);
      items.set(name, current);
    }
  }
  return [...items.entries()]
    .map(([name, item]) => ({ name, ...item, quantity: Math.round(item.quantity * 100) / 100 }))
    .sort((a, b) => b.quantity - a.quantity || b.salesCents - a.salesCents);
}

function customerInsights(orders: AnalyticsOrder[]) {
  const orderCounts = new Map<string, number>();
  for (const order of orders) {
    if (!order.customer_id) continue;
    orderCounts.set(order.customer_id, (orderCounts.get(order.customer_id) ?? 0) + 1);
  }
  return {
    identifiedCustomers: orderCounts.size,
    repeatCustomers: [...orderCounts.values()].filter((count) => count > 1).length,
  };
}

function peakHour(orders: AnalyticsOrder[]) {
  const hours = new Map<number, { orderCount: number; salesCents: number }>();
  for (const order of orders) {
    if (!order.closed_at) continue;
    const hour = dateParts(new Date(order.closed_at)).hour;
    const current = hours.get(hour) ?? { orderCount: 0, salesCents: 0 };
    current.orderCount += 1;
    current.salesCents += cents(order.total_money)
      - cents(order.total_tax_money)
      - cents(order.total_tip_money)
      - cents(order.total_service_charge_money);
    hours.set(hour, current);
  }
  const best = [...hours.entries()].sort((a, b) => b[1].orderCount - a[1].orderCount || b[1].salesCents - a[1].salesCents)[0];
  if (!best) return null;
  const [hour, totals] = best;
  const label = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
  return { label, ...totals };
}

function itemCategory(name: string) {
  const normalized = name.toLowerCase();
  if (/croissant|pastry|cookie|burrito|sandwich|muffin|food/.test(normalized)) return 'Food & pastries';
  if (/matcha/.test(normalized)) return 'Matcha';
  if (/cold brew|coffee|latte|mocha|americano|espresso|cortado/.test(normalized)) return 'Coffee';
  return 'Other';
}

function categorySummary(orders: AnalyticsOrder[]) {
  const categories = new Map<string, { quantity: number; salesCents: number }>();
  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      const category = itemCategory(item.name?.trim() || 'Other');
      const current = categories.get(category) ?? { quantity: 0, salesCents: 0 };
      current.quantity += Number(item.quantity ?? 0) || 0;
      current.salesCents += cents(item.total_money) - cents(item.total_tax_money);
      categories.set(category, current);
    }
  }
  return [...categories.entries()]
    .map(([name, totals]) => ({ name, quantity: Math.round(totals.quantity * 100) / 100, salesCents: totals.salesCents }))
    .sort((a, b) => b.quantity - a.quantity || b.salesCents - a.salesCents);
}

export async function getDameSalesAnalytics(
  range: SalesRange,
  selection: SalesSelection = {},
): Promise<DameSalesAnalytics> {
  const now = new Date();
  const period = periodFor(range, selection, now);
  const allOrders = await searchCompletedOrders(period.previousStart, period.end);
  const currentOrders = allOrders.filter((order) => {
    const closed = new Date(order.closed_at ?? 0);
    return closed >= period.start && closed < period.end;
  });
  const previousOrders = allOrders.filter((order) => {
    const closed = new Date(order.closed_at ?? 0);
    return closed >= period.previousStart && closed < period.previousEnd;
  });
  const metrics = summarize(currentOrders);
  const previous = summarize(previousOrders);
  const percentChange = previous.netSalesCents
    ? ((metrics.netSalesCents - previous.netSalesCents) / Math.abs(previous.netSalesCents)) * 100
    : null;

  return {
    range,
    label: period.label,
    updatedAt: now.toISOString(),
    period: {
      startAt: period.start.toISOString(),
      endAt: period.end.toISOString(),
    },
    metrics,
    comparison: {
      previousNetSalesCents: previous.netSalesCents,
      percentChange: percentChange === null ? null : Math.round(percentChange * 10) / 10,
    },
    chart: buildChart(currentOrders, period.start, period.end, range),
    topItems: topItems(currentOrders),
    customerInsights: customerInsights(currentOrders),
    peakHour: peakHour(currentOrders),
    categorySummary: categorySummary(currentOrders),
  };
}
