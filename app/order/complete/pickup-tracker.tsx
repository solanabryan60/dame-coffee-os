'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  PickupOrderLineItem,
  PickupOrderStatus,
} from '../../lib/supabase-rest';

type TrackingOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  lineItems: PickupOrderLineItem[];
  subtotalCents: number;
  paidCents: number | null;
  status: PickupOrderStatus;
  locationTitle: string;
  locationAddress: string;
  quotedWaitMinutes: number;
  createdAt: string;
  paidAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  refundedAt: string | null;
  cancelledAt: string | null;
};

const STEPS: Array<{ status: PickupOrderStatus; label: string }> = [
  { status: 'paid', label: 'Paid' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'picked_up', label: 'Picked up' },
];

const STEP_INDEX: Partial<Record<PickupOrderStatus, number>> = {
  awaiting_payment: -1,
  paid: 0,
  preparing: 1,
  ready: 2,
  picked_up: 3,
};

function money(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function statusCopy(order: TrackingOrder) {
  if (order.status === 'awaiting_payment') {
    return {
      kicker: 'Confirming payment',
      title: 'Square is finishing your order.',
      body: 'This page will update as soon as your payment is confirmed.',
    };
  }
  if (order.status === 'paid') {
    return {
      kicker: 'Order received',
      title: 'You’re in the Dame queue.',
      body: `We’ll begin your order soon. Your quoted wait is about ${order.quotedWaitMinutes} minutes.`,
    };
  }
  if (order.status === 'preparing') {
    return {
      kicker: 'Now making',
      title: 'Your drinks are in motion.',
      body: 'We’re making every item with intention. Keep this page open for the next update.',
    };
  }
  if (order.status === 'ready') {
    return {
      kicker: 'Ready for pickup',
      title: `${order.customerName}, your Dame is ready.`,
      body: `Meet us at ${order.locationTitle} and ask for order ${order.orderNumber}.`,
    };
  }
  if (order.status === 'picked_up') {
    return {
      kicker: 'Picked up',
      title: 'More flavor. More life. Más Dame.',
      body: 'Thank you for choosing Dame Coffee. We’ll be ready whenever you come back.',
    };
  }
  if (order.status === 'refund_pending') {
    return {
      kicker: 'Refund requested',
      title: 'We’re taking care of it.',
      body: 'Your refund is being handled through Square. This page will update when it is complete.',
    };
  }
  if (order.status === 'refunded') {
    return {
      kicker: 'Refund completed',
      title: 'Your payment is on its way back.',
      body: 'Square has completed the refund. Your bank may need additional time to post it.',
    };
  }
  return {
    kicker: 'Order cancelled',
    title: 'This pickup order was cancelled.',
    body: 'Call Dame Coffee if you have any questions about this order.',
  };
}

export default function PickupTracker({
  orderId,
  trackingKey,
}: {
  orderId: string;
  trackingKey: string;
}) {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId || !trackingKey) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      try {
        const response = await fetch(
          `/api/pickup-orders/${encodeURIComponent(orderId)}?key=${encodeURIComponent(trackingKey)}`,
          { cache: 'no-store' },
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not load this pickup order.');
        if (stopped) return;
        const nextOrder = payload as TrackingOrder;
        setOrder(nextOrder);
        setError('');
        if (!['picked_up', 'refunded', 'cancelled'].includes(nextOrder.status)) {
          timer = setTimeout(load, 10000);
        }
      } catch (loadError) {
        if (stopped) return;
        setError(loadError instanceof Error ? loadError.message : 'Could not load this pickup order.');
        timer = setTimeout(load, 15000);
      }
    }

    load();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, trackingKey]);

  if (!orderId || !trackingKey) {
    return (
      <section className="dame-order-complete dame-tracker-fallback">
        <div>
          <p className="dame-kicker">Order received</p>
          <h1>We’re making something special.</h1>
          <p>Square will send your receipt. Head to today’s location and ask for the pickup name on your order.</p>
          <Link className="dame-button" href="/#today">See today’s location</Link>
        </div>
        <Image src="/assets/bean.png" alt="The Dame Bean celebrating your order" width={632} height={922} priority />
      </section>
    );
  }

  if (!order) {
    return (
      <section className="dame-pickup-tracker dame-pickup-loading" aria-live="polite">
        <Image src="/assets/bean.png" alt="The Dame Bean waiting with your order" width={632} height={922} priority />
        <p className="dame-kicker">{error ? 'Still checking' : 'Finding your order'}</p>
        <h1>{error || 'One thoughtful cup at a time.'}</h1>
        <p>{error ? 'Keep this page open and we’ll try again.' : 'Your live pickup status will appear here.'}</p>
      </section>
    );
  }

  const copy = statusCopy(order);
  const currentStep = STEP_INDEX[order.status] ?? -1;

  return (
    <section className={`dame-pickup-tracker is-${order.status}`} aria-live="polite">
      <header>
        <div>
          <p className="dame-kicker">{copy.kicker} · #{order.orderNumber}</p>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        <Image src="/assets/bean.png" alt="The Dame Bean with your pickup order" width={632} height={922} priority />
      </header>

      {!['refund_pending', 'refunded', 'cancelled'].includes(order.status) ? (
        <ol className="dame-pickup-steps" aria-label="Pickup progress">
          {STEPS.map((step, index) => (
            <li className={index <= currentStep ? 'is-complete' : ''} key={step.status}>
              <span>{index < currentStep ? '✓' : index + 1}</span>
              <strong>{step.label}</strong>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="dame-pickup-summary">
        <article>
          <p className="dame-kicker">Your order</p>
          <ul>
            {order.lineItems.map((line, index) => (
              <li key={`${line.item_name}-${index}`}>
                <div>
                  <strong>{line.quantity}× {line.item_name}</strong>
                  <span>
                    {[
                      line.variation_name !== 'Regular' ? line.variation_name : '',
                      ...line.modifier_names,
                    ].filter(Boolean).join(' · ') || 'Made as ordered'}
                  </span>
                </div>
                <b>{money(line.line_total_cents)}</b>
              </li>
            ))}
          </ul>
          <div className="dame-pickup-total">
            <span>{order.paidCents ? 'Paid with Square' : 'Subtotal before Square checkout'}</span>
            <strong>{money(order.paidCents ?? order.subtotalCents)}</strong>
          </div>
        </article>

        <aside>
          <p className="dame-kicker">Pickup at</p>
          <h2>{order.locationTitle}</h2>
          <p>{order.locationAddress}</p>
          <p>Ask for <strong>{order.customerName}</strong> or order <strong>#{order.orderNumber}</strong>.</p>
          <div className="dame-actions">
            <Link className="dame-button" href="/#today">Directions & location</Link>
            <Link className="dame-button dame-button-outline" href="/menu">View menu</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
