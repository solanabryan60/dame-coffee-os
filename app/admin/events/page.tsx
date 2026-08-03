'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import { clearAdminSession, getAdminAccessToken, isAdminSessionError } from '../../lib/admin-session';
import {
  createUpcomingEvent,
  deleteUpcomingEvent,
  listUpcomingEventsForAdmin,
  setUpcomingEventPublished,
  type UpcomingEvent,
} from '../../lib/supabase-rest';

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const rows = await listUpcomingEventsForAdmin(token);
        if (active) setEvents(rows);
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load upcoming events.');
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const created = await createUpcomingEvent(token, {
        title: title.trim(), event_date: date, start_time: startTime || null, end_time: endTime || null,
        address: address.trim(), details: details.trim(), maps_url: mapsUrl.trim(), is_published: published,
      });
      setEvents((current) => [...current, created].sort((a, b) => `${a.event_date}${a.start_time || ''}`.localeCompare(`${b.event_date}${b.start_time || ''}`)));
      setTitle(''); setDate(''); setStartTime(''); setEndTime(''); setAddress(''); setDetails(''); setMapsUrl(''); setPublished(true);
      setMessage(created.is_published ? 'Event published.' : 'Event saved as hidden.');
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not add that event.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleEvent(item: UpcomingEvent) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSaving(true); setMessage(''); setError('');
    try {
      const updated = await setUpcomingEventPublished(token, item.id, !item.is_published);
      setEvents((current) => current.map((event) => event.id === updated.id ? updated : event));
      setMessage(updated.is_published ? `${updated.title} is live.` : `${updated.title} is hidden.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update that event.');
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(item: UpcomingEvent) {
    if (!window.confirm(`Remove ${item.title}?`)) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSaving(true); setMessage(''); setError('');
    try {
      await deleteUpcomingEvent(token, item.id);
      setEvents((current) => current.filter((event) => event.id !== item.id));
      setMessage('Event removed.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not remove that event.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-shell">
      <AdminHeader title="Upcoming events" />
      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading">
          <div><p className="eyebrow">WHERE DAME IS HEADED</p><h2>Give customers a reason to meet you there.</h2></div>
          <p>Published events appear automatically on the website and in the Dame App.</p>
        </div>
        <form className="admin-form admin-grid" onSubmit={addEvent}>
          <label className="admin-wide">Event name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Walnut Family Festival" maxLength={120} required /></label>
          <label>Date<input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required /></label>
          <label>Starts<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
          <label>Ends<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
          <label className="admin-wide">Address<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Full event address" maxLength={300} required /></label>
          <label className="admin-wide">Google Maps link<input type="url" value={mapsUrl} onChange={(event) => setMapsUrl(event.target.value)} placeholder="https://maps.google.com/..." /></label>
          <label className="admin-wide">Helpful details<textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Where to find the cart, event notes, or what makes this stop special." maxLength={800} rows={3} /></label>
          <div className="toggle-panel admin-wide"><div><strong>Publish this event</strong><span>{published ? 'Visible to everyone' : 'Save it hidden'}</span></div><button type="button" className={`toggle ${published ? 'on' : ''}`} onClick={() => setPublished((current) => !current)} aria-pressed={published}><i /></button></div>
          <button className="pill solid admin-wide" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add upcoming event'}</button>
        </form>
        {message ? <p className="admin-success">{message}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </section>

      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading"><div><p className="eyebrow">SCHEDULE</p><h2>What customers can see.</h2></div></div>
        {events.length ? <div className="admin-promotion-list">{events.map((item) => (
          <article key={item.id}>
            <div><span>{item.is_published ? 'Published' : 'Hidden'}</span><h3>{item.title}</h3><p>{item.event_date}{item.start_time ? ` · ${item.start_time.slice(0, 5)}` : ''} · {item.address}</p>{item.details ? <small>{item.details}</small> : null}</div>
            <div className="admin-event-actions"><button className={`toggle ${item.is_published ? 'on' : ''}`} type="button" aria-label={`${item.is_published ? 'Hide' : 'Publish'} ${item.title}`} aria-pressed={item.is_published} disabled={saving} onClick={() => toggleEvent(item)}><i /></button><button className="admin-text-button" type="button" disabled={saving} onClick={() => removeEvent(item)}>Remove</button></div>
          </article>
        ))}</div> : <p className="admin-empty-state">No upcoming events yet.</p>}
      </section>
    </main>
  );
}
