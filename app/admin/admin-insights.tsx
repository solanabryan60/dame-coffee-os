'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../lib/admin-session';
import { useRouter } from 'next/navigation';

type SalesRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

type Analytics = {
  range: SalesRange;
  label: string;
  updatedAt: string;
  metrics: {
    netSalesCents: number;
    totalCollectedCents: number;
    orderCount: number;
    averageOrderCents: number;
    taxCents: number;
    tipCents: number;
    discountCents: number;
  };
  comparison: {
    previousNetSalesCents: number;
    percentChange: number | null;
  };
  chart: Array<{ label: string; salesCents: number; orderCount: number }>;
  topItems: Array<{ name: string; quantity: number; salesCents: number }>;
};

const ranges: Array<{ value: SalesRange; label: string }> = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

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
  const [range, setRange] = useState<SalesRange>('day');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextRange: SalesRange, signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/analytics?range=${nextRange}`, {
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
    void load(range, controller.signal);
    return () => controller.abort();
  }, [load, range]);

  const maxSales = Math.max(1, ...(analytics?.chart.map((bucket) => bucket.salesCents) ?? [1]));

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

      {error ? (
        <div className="admin-insights-state" role="alert">
          <strong>Sales could not load.</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void load(range)}>Try again</button>
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

          <div className="admin-insights-grid">
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
                  <div className="admin-sales-bar" key={`${bucket.label}-${index}`}>
                    <div className="admin-sales-bar-track">
                      <i style={{ height: `${Math.max(bucket.salesCents ? 8 : 2, (bucket.salesCents / maxSales) * 100)}%` }} />
                    </div>
                    <b>{bucket.label}</b>
                    <span>{bucket.salesCents ? money(bucket.salesCents) : '—'}</span>
                  </div>
                ))}
              </div>
            </article>

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
          </div>

          <footer className="admin-insights-footer">
            <span>Tax {money(analytics.metrics.taxCents)}</span>
            <span>Tips {money(analytics.metrics.tipCents)}</span>
            <span>Discounts {money(analytics.metrics.discountCents)}</span>
            <small>Last checked {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(analytics.updatedAt))}</small>
          </footer>
        </div>
      ) : null}
    </section>
  );
}
