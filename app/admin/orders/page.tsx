'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listPickupOrdersForAdmin,
  type PickupOrder,
  type PickupOrderStatus,
  updatePickupOrderForAdmin,
} from '../../lib/supabase-rest';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
import AdminHeader from '../admin-header';

const STATUS_OPTIONS: Array<{ value: PickupOrderStatus; label: string }> = [
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid · New order' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready for pickup' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'refund_pending', label: 'Refund needed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES: PickupOrderStatus[] = [
  'awaiting_payment',
  'paid',
  'preparing',
  'ready',
  'refund_pending',
];

function money(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function time(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function day(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function AdminPickupOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dirtyOrderIds = useRef(new Set<string>());

  const loadOrders = useCallback(async (quiet = false) => {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      setOrders(await listPickupOrdersForAdmin(token));
      setError('');
    } catch (loadError) {
      if (isAdminSessionError(loadError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Could not load pickup orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrders();
    const interval = window.setInterval(() => {
      if (!dirtyOrderIds.current.size) loadOrders(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadOrders]);

  const visibleOrders = useMemo(
    () => filter === 'all' ? orders : orders.filter((order) => {
      if (!ACTIVE_STATUSES.includes(order.status)) return false;
      if (order.status !== 'awaiting_payment') return true;
      return Date.now() - new Date(order.created_at).getTime() < 2 * 60 * 60 * 1000;
    }),
    [filter, orders],
  );

  function editOrder(
    orderId: string,
    changes: Partial<Pick<PickupOrder, 'status' | 'internal_notes'>>,
  ) {
    dirtyOrderIds.current.add(orderId);
    setOrders((current) => current.map((order) =>
      order.id === orderId ? { ...order, ...changes } : order,
    ));
  }

  async function saveOrder(order: PickupOrder) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSavingId(order.id);
    setMessage('');
    setError('');
    try {
      const updated = await updatePickupOrderForAdmin(token, order.id, {
        status: order.status,
        internal_notes: order.internal_notes,
      });
      dirtyOrderIds.current.delete(order.id);
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Order #${order.id.slice(0, 6).toUpperCase()} updated.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not update that order.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="admin-shell admin-orders-shell">
      <AdminHeader title="Pickup orders">
        <Link className="pill solid" href="/order" target="_blank">View ordering</Link>
      </AdminHeader>

      <section className="admin-order-overview admin-card">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Live queue</p>
            <h2>Square leads. Dame follows.</h2>
          </div>
          <p>Update fulfillment on the Square machine. This queue and the customer’s private tracking page will follow automatically; these controls remain available as a backup.</p>
        </div>

        <div className="admin-catering-summary" aria-label="Pickup order summary">
          <article><strong>{orders.filter((order) => order.status === 'paid').length}</strong><span>New paid</span></article>
          <article><strong>{orders.filter((order) => order.status === 'preparing').length}</strong><span>Preparing</span></article>
          <article><strong>{orders.filter((order) => order.status === 'ready').length}</strong><span>Ready</span></article>
          <article><strong>{orders.filter((order) => order.status === 'refund_pending').length}</strong><span>Refunds</span></article>
        </div>

        <div className="admin-order-toolbar">
          <div role="group" aria-label="Filter pickup orders">
            <button className={filter === 'active' ? 'is-active' : ''} type="button" onClick={() => setFilter('active')}>Active</button>
            <button className={filter === 'all' ? 'is-active' : ''} type="button" onClick={() => setFilter('all')}>All orders</button>
          </div>
          <button type="button" onClick={() => loadOrders(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh queue'}
          </button>
        </div>

        {message ? <p className="admin-success">{message}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </section>

      {loading ? (
        <section className="admin-card admin-rewards-card"><p>Loading pickup orders…</p></section>
      ) : visibleOrders.length ? (
        <section className="admin-pickup-list" aria-label="Pickup orders">
          {visibleOrders.map((order) => {
            const statusLabel = order.status === 'refunded'
              ? 'Refunded'
              : STATUS_OPTIONS.find((option) => option.value === order.status)?.label ?? order.status;
            return (
              <article className={`admin-pickup-order is-${order.status}`} key={order.id}>
                <header>
                  <div>
                    <span>{statusLabel}</span>
                    <h2>{order.customer_name}</h2>
                    <p>#{order.id.slice(0, 6).toUpperCase()} · {day(order.created_at)} at {time(order.created_at)}</p>
                  </div>
                  <div className="admin-catering-price">
                    <strong>{money(order.paid_cents ?? order.subtotal_cents)}</strong>
                    <small>{order.paid_cents ? 'paid with Square' : 'awaiting payment'}</small>
                  </div>
                </header>

                <div className="admin-pickup-body">
                  <section>
                    <p className="eyebrow">Order</p>
                    <ul>
                      {order.line_items.map((line, index) => (
                        <li key={`${line.item_name}-${index}`}>
                          <div>
                            <strong>{line.quantity}× {line.item_name}</strong>
                            <span>{[
                              line.variation_name !== 'Regular' ? line.variation_name : '',
                              ...line.modifier_names,
                            ].filter(Boolean).join(' · ') || 'Made as ordered'}</span>
                          </div>
                          <b>{money(line.line_total_cents)}</b>
                        </li>
                      ))}
                    </ul>
                    {order.customer_note ? <p className="admin-order-note"><b>Pickup note:</b> {order.customer_note}</p> : null}
                  </section>

                  <aside>
                    <p className="eyebrow">Customer</p>
                    <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                    <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
                    <p><b>Quoted wait:</b> {order.quoted_wait_minutes} minutes</p>
                    <p><b>Pickup:</b> {order.location_title}</p>
                  </aside>
                </div>

                <div className="admin-catering-workflow">
                  <label>
                    Order status
                    <select
                      value={order.status}
                      onChange={(event) => editOrder(order.id, { status: event.target.value as PickupOrderStatus })}
                      disabled={order.status === 'refunded'}
                    >
                      {order.status === 'refunded' ? <option value="refunded">Refunded</option> : null}
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Private notes
                    <textarea
                      value={order.internal_notes}
                      onChange={(event) => editOrder(order.id, { internal_notes: event.target.value })}
                      placeholder="Remake, customer call, sold-out substitution, or refund details."
                      maxLength={2000}
                      rows={3}
                    />
                  </label>
                  {order.status === 'refund_pending' ? (
                    <div className="admin-refund-reminder">
                      <strong>Refund this order in Square.</strong>
                      <p>When Square confirms the full refund, this order will change to Refunded automatically.</p>
                      <a href="https://app.squareup.com/dashboard/sales/transactions" target="_blank" rel="noreferrer">Open Square transactions ↗</a>
                    </div>
                  ) : null}
                  {order.status !== 'refunded' ? (
                    <button className="pill solid" type="button" onClick={() => saveOrder(order)} disabled={savingId === order.id}>
                      {savingId === order.id ? 'Saving…' : 'Update customer status'}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="admin-card admin-rewards-card admin-order-empty">
          <p className="eyebrow">Queue clear</p>
          <h2>No {filter === 'active' ? 'active' : ''} pickup orders yet.</h2>
          <p>New online orders will appear here after customers begin Square checkout, then move to Paid automatically when Square confirms payment.</p>
        </section>
      )}
    </main>
  );
}
