'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../lib/admin-session';
import { useRouter } from 'next/navigation';

type SalesRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

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

type ItemSummary = { name: string; quantity: number; salesCents: number };

type ChartBucket = {
  label: string;
  detailLabel: string;
  startAt: string;
  endAt: string;
  salesCents: number;
  orderCount: number;
  metrics: SalesMetrics;
  items: ItemSummary[];
};

type Analytics = {
  range: SalesRange;
  label: string;
  updatedAt: string;
  period: { startAt: string; endAt: string };
  metrics: SalesMetrics;
  comparison: {
    previousNetSalesCents: number;
    percentChange: number | null;
  };
  chart: ChartBucket[];
  topItems: ItemSummary[];
};

const ranges: Array<{ value: SalesRange; label: string }> = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

const months = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, index, 1)),
}));

const quarters = [1, 2, 3, 4];

function dateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function money(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function comparisonCopy(analytics: Analytics) {
  const change = analytics.comparison.percentChange;
  if (change === null) {
    return analytics.metrics.netSalesCents > 0
      ? 'Fresh sales with no matching previous-period total.'
      : 'No completed sales in this period yet.';
  }
  if (change === 0) return 'Even with the previous period.';
  return `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'higher' : 'lower'} than the previous period.`;
}

export default function AdminInsights() {
  const router = useRouter();
  const [today] = useState(() => new Date());
  const todayValue = dateInputValue(today);
  const [range, setRange] = useState<SalesRange>('day');
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((today.getMonth() + 1) / 3));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedBucketStart, setSelectedBucketStart] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (
    nextRange: SalesRange,
    date: string,
    month: number,
    quarter: number,
    year: number,
    signal?: AbortSignal,
  ) => {
    setLoading(true);
    setError('');
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    try {
      const query = new URLSearchParams({ range: nextRange });
      if (nextRange === 'day' || nextRange === 'week') query.set('date', date);
      if (nextRange === 'month') query.set('month', String(month));
      if (nextRange === 'quarter') query.set('quarter', String(quarter));
      if (nextRange === 'month' || nextRange === 'quarter' || nextRange === 'year') {
        query.set('year', String(year));
      }
      const response = await fetch(`/api/admin/analytics?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load Square sales.');
      setAnalytics(payload as Analytics);
    } catch (loadError) {
      if (signal?.aborted) return;
      if (isAdminSessionError(loadError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Could not load Square sales.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    setSelectedBucketStart(null);
    void load(range, selectedDate, selectedMonth, selectedQuarter, selectedYear, controller.signal);
    return () => controller.abort();
  }, [load, range, selectedDate, selectedMonth, selectedQuarter, selectedYear]);

  const maxSales = Math.max(1, ...(analytics?.chart.map((bucket) => bucket.salesCents) ?? [1]));
  const availableYears = Array.from({ length: 10 }, (_, index) => today.getFullYear() - index);
  const selectedBucket = analytics?.chart.find((bucket) => bucket.startAt === selectedBucketStart) ?? null;

  function chooseYear(year: number) {
    setSelectedYear(year);
    if (year === today.getFullYear() && selectedMonth > today.getMonth() + 1) {
      setSelectedMonth(today.getMonth() + 1);
    }
    if (year === today.getFullYear() && selectedQuarter > Math.ceil((today.getMonth() + 1) / 3)) {
      setSelectedQuarter(Math.ceil((today.getMonth() + 1) / 3));
    }
  }

  function openBucket(bucket: ChartBucket) {
    const bucketDate = new Date(bucket.startAt);
    if (range === 'year' || range === 'quarter') {
      setSelectedMonth(Number(dateInputValue(bucketDate).slice(5, 7)));
      setSelectedYear(Number(dateInputValue(bucketDate).slice(0, 4)));
      setRange('month');
      return;
    }
    if (range === 'month') {
      setSelectedDate(dateInputValue(bucketDate));
      setRange('week');
      return;
    }
    if (range === 'week') {
      setSelectedDate(dateInputValue(bucketDate));
      setRange('day');
    }
  }

  return (
    <section className="admin-card admin-insights" aria-labelledby="dame-insights-title">
      <header className="admin-insights-header">
        <div>
          <p className="eyebrow">DAME INSIGHTS</p>
          <h2 id="dame-insights-title">Sales at a glance.</h2>
          <p>Completed Square sales, organized the way you actually use them.</p>
        </div>
        <div className="admin-range-tabs" aria-label="Sales period">
          {ranges.map((option) => (
            <button
              type="button"
              key={option.value}
              className={range === option.value ? 'is-active' : ''}
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="admin-date-controls" aria-label="Choose sales date">
          {range === 'day' || range === 'week' ? (
            <label className="admin-date-field">
              <span>{range === 'day' ? 'Date' : 'Week containing'}</span>
              <input
                type="date"
                value={selectedDate}
                max={todayValue}
                onChange={(event) => setSelectedDate(event.target.value || todayValue)}
              />
            </label>
          ) : null}
          {range === 'month' ? (
            <label>
              <span>Month</span>
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
                {months.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                    disabled={selectedYear === today.getFullYear() && month.value > today.getMonth() + 1}
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {range === 'quarter' ? (
            <label>
              <span>Quarter</span>
              <select value={selectedQuarter} onChange={(event) => setSelectedQuarter(Number(event.target.value))}>
                {quarters.map((quarter) => (
                  <option
                    key={quarter}
                    value={quarter}
                    disabled={selectedYear === today.getFullYear() && quarter > Math.ceil((today.getMonth() + 1) / 3)}
                  >
                    Q{quarter}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {range === 'month' || range === 'quarter' || range === 'year' ? (
            <label>
              <span>Year</span>
              <select value={selectedYear} onChange={(event) => chooseYear(Number(event.target.value))}>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          ) : null}
          <p>
            Showing <strong>{analytics?.label ?? 'your selected period'}</strong>. Tap any graph bar for its full breakdown.
          </p>
        </div>

      {error ? (
        <div className="admin-insights-state" role="alert">
          <strong>Sales could not load.</strong>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load(range, selectedDate, selectedMonth, selectedQuarter, selectedYear)}
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading && !analytics ? (
        <div className="admin-insights-state" aria-live="polite">Bringing in your Square sales…</div>
      ) : null}

      {analytics ? (
        <div className={loading ? 'admin-insights-content is-refreshing' : 'admin-insights-content'}>
          <div className="admin-metric-grid">
            <article className="admin-metric admin-metric-primary">
              <span>{analytics.label} · net sales</span>
              <strong>{money(analytics.metrics.netSalesCents)}</strong>
              <p>{comparisonCopy(analytics)}</p>
            </article>
            <article className="admin-metric">
              <span>Completed orders</span>
              <strong>{analytics.metrics.orderCount}</strong>
              <p>Register and online orders together.</p>
            </article>
            <article className="admin-metric">
              <span>Average order</span>
              <strong>{money(analytics.metrics.averageOrderCents)}</strong>
              <p>Sales before tax and tips per order.</p>
            </article>
            <article className="admin-metric">
              <span>Total collected</span>
              <strong>{money(analytics.metrics.totalCollectedCents)}</strong>
              <p>Includes tax, tips, and service charges.</p>
            </article>
          </div>

          <article className="admin-sales-chart-card">
              <header>
                <div>
                  <span>Sales rhythm</span>
                  <strong>{analytics.label}</strong>
                </div>
                <small>Net sales</small>
              </header>
              <div className="admin-sales-chart" aria-label={`${analytics.label} net sales chart`}>
                {analytics.chart.map((bucket, index) => (
                  <button
                    type="button"
                    className={selectedBucketStart === bucket.startAt ? 'admin-sales-bar is-selected' : 'admin-sales-bar'}
                    key={`${bucket.label}-${index}`}
                    aria-label={`${bucket.detailLabel}: ${money(bucket.salesCents)} from ${bucket.orderCount} ${bucket.orderCount === 1 ? 'order' : 'orders'}. Show full breakdown.`}
                    aria-pressed={selectedBucketStart === bucket.startAt}
                    onClick={() => setSelectedBucketStart(bucket.startAt)}
                  >
                    <div className="admin-sales-bar-track">
                      <em>{bucket.salesCents ? money(bucket.salesCents) : '$0'}</em>
                      <i style={{ height: `${Math.max(bucket.salesCents ? 8 : 2, (bucket.salesCents / maxSales) * 100)}%` }} />
                    </div>
                    <b>{bucket.label}</b>
                    <span>{bucket.orderCount} {bucket.orderCount === 1 ? 'order' : 'orders'}</span>
                  </button>
                ))}
              </div>
          </article>

          {selectedBucket ? (
            <article className="admin-period-breakdown" aria-live="polite">
              <header>
                <div>
                  <span>Selected breakdown</span>
                  <strong>{selectedBucket.detailLabel}</strong>
                  <p>Every completed Square sale inside this graph bar.</p>
                </div>
                <button type="button" onClick={() => setSelectedBucketStart(null)}>Close</button>
              </header>

              <div className="admin-period-metrics">
                <section><span>Net sales</span><strong>{money(selectedBucket.metrics.netSalesCents)}</strong></section>
                <section><span>Orders</span><strong>{selectedBucket.metrics.orderCount}</strong></section>
                <section><span>Average order</span><strong>{money(selectedBucket.metrics.averageOrderCents)}</strong></section>
                <section><span>Total collected</span><strong>{money(selectedBucket.metrics.totalCollectedCents)}</strong></section>
              </div>

              <div className="admin-period-details">
                <section>
                  <span>Tax</span>
                  <strong>{money(selectedBucket.metrics.taxCents)}</strong>
                </section>
                <section>
                  <span>Tips</span>
                  <strong>{money(selectedBucket.metrics.tipCents)}</strong>
                </section>
                <section>
                  <span>Discounts</span>
                  <strong>{money(selectedBucket.metrics.discountCents)}</strong>
                </section>
                <section>
                  <span>Service charges</span>
                  <strong>{money(selectedBucket.metrics.serviceChargeCents)}</strong>
                </section>
              </div>

              <div className="admin-period-items">
                <div>
                  <span>Item breakdown</span>
                  <strong>What sold</strong>
                </div>
                {selectedBucket.items.length ? (
                  <ol>
                    {selectedBucket.items.map((item) => (
                      <li key={item.name}>
                        <div><b>{item.name}</b><span>{item.quantity} sold</span></div>
                        <strong>{money(item.salesCents)}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No completed items were recorded in this period.</p>
                )}
              </div>

              {range !== 'day' ? (
                <button className="admin-period-open" type="button" onClick={() => openBucket(selectedBucket)}>
                  Open this {range === 'week' ? 'day' : range === 'month' ? 'week' : 'month'}
                </button>
              ) : null}
            </article>
          ) : null}

          <div className="admin-insights-grid">
            <article className="admin-top-items-card">
              <header>
                <span>Top sellers</span>
                <strong>What moved</strong>
              </header>
              {analytics.topItems.length ? (
                <ol>
                  {analytics.topItems.map((item) => (
                    <li key={item.name}>
                      <div><b>{item.name}</b><span>{item.quantity} sold</span></div>
                      <strong>{money(item.salesCents)}</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="admin-empty-copy">Top items will appear after the first completed sale in this period.</p>
              )}
            </article>
            <article className="admin-money-breakdown">
              <header>
                <span>Money breakdown</span>
                <strong>Beyond net sales</strong>
              </header>
              <div>
                <section><span>Tax</span><strong>{money(analytics.metrics.taxCents)}</strong><p>Collected for sales tax.</p></section>
                <section><span>Tips</span><strong>{money(analytics.metrics.tipCents)}</strong><p>Tips customers left the team.</p></section>
                <section><span>Discounts</span><strong>{money(analytics.metrics.discountCents)}</strong><p>Savings applied to orders.</p></section>
                <section><span>Service charges</span><strong>{money(analytics.metrics.serviceChargeCents)}</strong><p>Square order service charges.</p></section>
              </div>
            </article>
          </div>

          <footer className="admin-insights-footer">
            <small>
              Last updated{' '}
              {new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(analytics.updatedAt))}
            </small>
          </footer>
        </div>
      ) : null}
    </section>
  );
}
