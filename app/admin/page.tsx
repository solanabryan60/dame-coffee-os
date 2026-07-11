'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  readSiteSettings,
  SiteSettings,
  updateSiteSettings,
} from '../lib/supabase-rest';

const TOKEN_KEY = 'dame_admin_access_token';

export default function AdminDashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    readSiteSettings()
      .then(setSettings)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Could not load settings.');
      });
  }, [router]);

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    router.replace('/admin/login');
  }

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      await updateSiteSettings(settings, token);
      setMessage('Saved. The public site will show the new information when refreshed.');
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'Could not save changes.';
      setError(text);
      if (/jwt|token|unauthorized/i.test(text)) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">DAME COFFEE OS</p>
          <h1>Live location</h1>
        </div>
        <div className="admin-top-actions">
          <Link className="pill ghost" href="/" target="_blank">View website</Link>
          <button className="pill ghost" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="admin-card">
        {!settings && !error ? <p>Loading your settings…</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {settings ? (
          <form onSubmit={save} className="admin-form admin-grid">
            <label className="admin-wide">
              Big location title
              <input
                value={settings.location_title}
                onChange={(event) => update('location_title', event.target.value)}
                placeholder="VENICE BEACH"
                required
              />
            </label>

            <label className="admin-wide">
              Exact address
              <input
                value={settings.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Ocean Front Walk near The Waterfront, Venice, CA"
                required
              />
            </label>

            <label className="admin-wide">
              Details to help customers find you
              <textarea
                value={settings.directions}
                onChange={(event) => update('directions', event.target.value)}
                rows={4}
                placeholder="Look for the white Dame Coffee cart…"
                required
              />
            </label>

            <label>
              Hours shown on site
              <input
                value={settings.hours}
                onChange={(event) => update('hours', event.target.value)}
                placeholder="6:00 AM–4:00 PM"
                required
              />
            </label>

            <label>
              Wait time in minutes
              <input
                type="number"
                min="0"
                max="180"
                step="1"
                value={settings.wait_minutes}
                onChange={(event) => update('wait_minutes', Number(event.target.value))}
                required
              />
            </label>

            <label className="admin-wide">
              Google Maps directions link
              <input
                type="url"
                value={settings.maps_url}
                onChange={(event) => update('maps_url', event.target.value)}
                placeholder="https://www.google.com/maps/..."
                required
              />
            </label>

            <div className="toggle-panel">
              <div>
                <strong>Business status</strong>
                <span>{settings.is_open ? 'Open' : 'Closed'}</span>
              </div>
              <button
                type="button"
                className={`toggle ${settings.is_open ? 'on' : ''}`}
                onClick={() => update('is_open', !settings.is_open)}
                aria-pressed={settings.is_open}
              ><i /></button>
            </div>

            <div className="toggle-panel">
              <div>
                <strong>Mobile ordering</strong>
                <span>{settings.mobile_ordering ? 'On' : 'Off'}</span>
              </div>
              <button
                type="button"
                className={`toggle ${settings.mobile_ordering ? 'on' : ''}`}
                onClick={() => update('mobile_ordering', !settings.mobile_ordering)}
                aria-pressed={settings.mobile_ordering}
              ><i /></button>
            </div>

            {message ? <p className="admin-success admin-wide">{message}</p> : null}
            {error ? <p className="admin-error admin-wide">{error}</p> : null}

            <button className="pill solid admin-wide" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save live location'}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
