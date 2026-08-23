'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import { clearAdminSession, getAdminAccessToken, isAdminSessionError } from '../../lib/admin-session';
import {
  type CateringRequest,
  type CateringRequestStatus,
  listCateringRequestsForAdmin,
  updateCateringRequestForAdmin,
} from '../../lib/supabase-rest';

const STATUS_OPTIONS: Array<{ value: CateringRequestStatus; label: string }> = [
  { value: 'awaiting_payment', label: 'Awaiting deposit' },
  { value: 'deposit_paid', label: 'Deposit paid' },
  { value: 'contacted', label: 'Customer contacted' },
  { value: 'confirmed', label: 'Event confirmed' },
  { value: 'alternate_proposed', label: 'Alternative proposed' },
  { value: 'refund_pending', label: 'Refund needed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

function eventDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export default function AdminCateringPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const rows = await listCateringRequestsForAdmin(token);
        if (active) setRequests(rows);
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load catering requests.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  function edit(requestId: string, changes: Partial<Pick<CateringRequest, 'status' | 'internal_notes'>>) {
    setRequests((current) => current.map((request) => request.id === requestId ? { ...request, ...changes } : request));
  }

  async function save(request: CateringRequest) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSavingId(request.id);
    setMessage('');
    setError('');
    try {
      const updated = await updateCateringRequestForAdmin(token, request.id, { status: request.status, internal_notes: request.internal_notes });
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${request.name}'s catering request is updated.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not update that request.');
    } finally {
      setSavingId(null);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="admin-shell">
      <AdminHeader title="Catering">
        <a className="pill solid" href="https://app.squareup.com/dashboard/sales/transactions" target="_blank" rel="noreferrer">Square transactions</a>
      </AdminHeader>
      <section className="admin-card admin-catering-center">
        <div className="admin-section-heading">
          <div><p className="eyebrow">EVENT REQUESTS</p><h2>Every event, in one place.</h2></div>
          <p>Review deposits, call customers, confirm dates, and keep private notes.</p>
        </div>
        <div className="admin-catering-summary" aria-label="Catering request summary">
          <article><strong>{requests.filter((request) => request.status === 'deposit_paid').length}</strong><span>New deposits</span></article>
          <article><strong>{requests.filter((request) => request.status === 'confirmed').length}</strong><span>Confirmed</span></article>
          <article><strong>{requests.filter((request) => request.status === 'refund_pending').length}</strong><span>Refunds needed</span></article>
          <article><strong>{requests.filter((request) => request.event_date >= today && !['cancelled', 'refunded'].includes(request.status)).length}</strong><span>Upcoming</span></article>
        </div>
        {message ? <p className="admin-success">{message}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </section>

      {loading ? <section className="admin-card admin-rewards-card"><p>Loading catering requests…</p></section> : requests.length ? (
        <section className="admin-catering-list admin-standalone-list">
          {requests.map((request) => (
            <article className={`admin-catering-request is-${request.status}`} key={request.id}>
              <header>
                <div><span>{STATUS_OPTIONS.find((option) => option.value === request.status)?.label}</span><h3>{request.name}</h3><p>{eventDate(request.event_date)} · {request.start_time.slice(0, 5)}</p></div>
                <div className="admin-catering-price"><strong>{money(request.estimate_cents)}</strong><small>estimated + tax</small></div>
              </header>
              <div className="admin-catering-details">
                <div><small>Customer</small><strong>{request.company || 'Personal event'}</strong><a href={`tel:${request.phone}`}>{request.phone}</a><a href={`mailto:${request.email}`}>{request.email}</a></div>
                <div><small>Package</small><strong>{request.drinks} drinks · {request.service_hours} hours</strong><span>{request.deposit_paid_at ? '$200 deposit received' : '$200 deposit not completed'}</span></div>
                <div className="admin-catering-address"><small>Event address</small><span>{request.address}</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.address)}`} target="_blank" rel="noreferrer">Open map ↗</a></div>
                <div><small>Event details</small><strong>{request.guest_count ? `${request.guest_count} guests` : 'Guest count not provided'}</strong><span>{request.event_setting === 'both' ? 'Indoor + outdoor' : request.event_setting}</span><span>{request.budget_cents != null ? `${money(request.budget_cents)} stated budget` : 'Budget not provided'}</span></div>
                <div className="admin-catering-customer-notes"><small>Customer notes</small><span>{request.customer_notes || 'No additional notes.'}</span></div>
              </div>
              <div className="admin-catering-workflow">
                <label>Request status<select value={request.status} onChange={(event) => edit(request.id, { status: event.target.value as CateringRequestStatus })}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label>Private notes<textarea value={request.internal_notes} onChange={(event) => edit(request.id, { internal_notes: event.target.value })} placeholder="Menu choices, travel details, call notes, staffing, or balance due." maxLength={2000} rows={3} /></label>
                {request.status === 'refund_pending' ? <div className="admin-refund-reminder"><strong>Refund this $200 deposit in Square.</strong><p>Once Square confirms the full refund, Dame Coffee OS will mark this request refunded automatically.</p><a href="https://app.squareup.com/dashboard/sales/transactions" target="_blank" rel="noreferrer">Open Square transactions ↗</a></div> : null}
                <button className="pill solid" type="button" onClick={() => save(request)} disabled={savingId === request.id}>{savingId === request.id ? 'Saving…' : 'Save request'}</button>
              </div>
            </article>
          ))}
        </section>
      ) : <section className="admin-card admin-rewards-card"><p className="admin-empty-state">New paid catering requests will appear here automatically.</p></section>}
    </main>
  );
}
