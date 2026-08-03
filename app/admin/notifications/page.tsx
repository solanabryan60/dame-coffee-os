'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import { clearAdminSession, getAdminAccessToken, isAdminSessionError } from '../../lib/admin-session';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Dame Coffee is brewing');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/app');
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
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
        const response = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not load notifications.');
        if (active) setSubscriberCount(payload.subscribers);
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSending(true); setStatus(''); setError('');
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, url }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not send that notification.');
      setSubscriberCount(payload.subscribers);
      setMessage('');
      setStatus(`Sent to ${payload.sent} ${payload.sent === 1 ? 'device' : 'devices'}.`);
    } catch (sendError) {
      if (isAdminSessionError(sendError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(sendError instanceof Error ? sendError.message : 'Could not send that notification.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="admin-shell">
      <AdminHeader title="Notifications" />
      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading">
          <div><p className="eyebrow">DAME UPDATES</p><h2>Say something worth opening.</h2></div>
          <p>{subscriberCount === null ? 'Loading opted-in devices…' : `${subscriberCount} ${subscriberCount === 1 ? 'device has' : 'devices have'} opted in.`}</p>
        </div>
        <form className="admin-form admin-grid" onSubmit={sendNotification}>
          <label className="admin-wide">Notification title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required /></label>
          <label className="admin-wide">Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="We’re brewing in Walnut until 2 PM. Come say hi." maxLength={180} rows={3} required /></label>
          <label className="admin-wide">Opens this page<select value={url} onChange={(event) => setUrl(event.target.value)}><option value="/app">Dame App</option><option value="/">Home</option><option value="/menu">Menu</option><option value="/order">Order pickup</option><option value="/rewards">Rewards</option><option value="/catering">Catering</option></select></label>
          <button className="pill solid admin-wide" type="submit" disabled={sending || subscriberCount === 0}>{sending ? 'Sending…' : subscriberCount === 0 ? 'Waiting for opt-ins' : 'Send notification'}</button>
        </form>
        {status ? <p className="admin-success">{status}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </section>
      <section className="admin-card admin-rewards-card admin-notification-note">
        <p className="eyebrow">A DAME RULE</p>
        <h2>Useful, warm, never noisy.</h2>
        <p>Send updates when Dame is somewhere special, ordering opens, or something customers genuinely care about is happening.</p>
      </section>
    </main>
  );
}
