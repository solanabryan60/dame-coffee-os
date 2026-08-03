'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
import {
  readSiteSettings,
  type SiteSettings,
  updateSiteSettings,
} from '../../lib/supabase-rest';

export default function AdminLocationPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const value = await readSiteSettings();
        if (active) setSettings(value);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load the live location.');
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await updateSiteSettings(settings, token);
      setMessage('Saved. The website and Dame App now have your latest location.');
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-shell">
      <AdminHeader title="Live location" />
      <section className="admin-card">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">US, TODAY</p>
            <h2>Tell everyone where to find Dame.</h2>
          </div>
          <p>One save updates the website and the Dame App.</p>
        </div>

        {!settings && !error ? <p className="admin-empty-state">Loading your location…</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
        {settings ? (
          <form onSubmit={save} className="admin-form admin-grid">
            <label className="admin-wide">
              Big location title
              <input value={settings.location_title} onChange={(event) => update('location_title', event.target.value)} placeholder="VENICE BEACH" required />
            </label>
            <label className="admin-wide">
              Exact address
              <input value={settings.address} onChange={(event) => update('address', event.target.value)} placeholder="Ocean Front Walk near The Waterfront, Venice, CA" required />
            </label>
            <label className="admin-wide">
              Details to help customers find you
              <textarea value={settings.directions} onChange={(event) => update('directions', event.target.value)} rows={4} placeholder="Look for the white Dame Coffee cart…" required />
            </label>
            <label>
              Hours shown on site
              <input value={settings.hours} onChange={(event) => update('hours', event.target.value)} placeholder="6:00 AM–4:00 PM" required />
            </label>
            <label>
              Wait time in minutes
              <input type="number" min="0" max="180" step="1" value={settings.wait_minutes} onChange={(event) => update('wait_minutes', Number(event.target.value))} required />
            </label>
            <label className="admin-wide">
              Google Maps directions link
              <input type="url" value={settings.maps_url} onChange={(event) => update('maps_url', event.target.value)} placeholder="https://www.google.com/maps/..." required />
            </label>
            <div className="toggle-panel">
              <div><strong>Business status</strong><span>{settings.is_open ? 'Open' : 'Closed'}</span></div>
              <button type="button" className={`toggle ${settings.is_open ? 'on' : ''}`} onClick={() => update('is_open', !settings.is_open)} aria-pressed={settings.is_open}><i /></button>
            </div>
            <div className="toggle-panel">
              <div><strong>Mobile ordering</strong><span>{settings.mobile_ordering ? 'On' : 'Off'}</span></div>
              <button type="button" className={`toggle ${settings.mobile_ordering ? 'on' : ''}`} onClick={() => update('mobile_ordering', !settings.mobile_ordering)} aria-pressed={settings.mobile_ordering}><i /></button>
            </div>
            {message ? <p className="admin-success admin-wide">{message}</p> : null}
            <button className="pill solid admin-wide" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save live location'}</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
