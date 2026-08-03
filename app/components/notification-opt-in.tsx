'use client';

import { useEffect, useState } from 'react';

type NotificationState = 'loading' | 'ready' | 'subscribed' | 'unsupported' | 'denied';

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function NotificationOptIn({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<NotificationState>('loading');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? 'subscribed' : 'ready'))
      .catch(() => setState('unsupported'));
  }, [publicKey]);

  async function enableNotifications() {
    if (!publicKey) return;
    setWorking(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'ready');
        setMessage('Notifications stay off until you choose Allow.');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not turn on notifications.');
      setState('subscribed');
      setMessage('You’re in. We’ll only send meaningful Dame updates.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not turn on notifications.');
    } finally {
      setWorking(false);
    }
  }

  async function disableNotifications() {
    setWorking(true);
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState('ready');
      setMessage('Notifications are off on this device.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not turn off notifications.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className={`dame-notification-opt-in ${compact ? 'is-compact' : ''}`} aria-labelledby={`dame-notify-title-${compact ? 'app' : 'site'}`}>
      <div>
        <p className="dame-kicker">Stay close to Dame</p>
        <h2 id={`dame-notify-title-${compact ? 'app' : 'site'}`}>
          The good stuff,<br />right on time.
        </h2>
        <p>
          Allow notifications for upcoming events, new drinks, special rewards, and where Dame is brewing.
        </p>
      </div>
      <div className="dame-notification-action">
        {state === 'subscribed' ? (
          <button type="button" className="dame-button dame-button-light" onClick={disableNotifications} disabled={working}>
            {working ? 'Updating…' : 'Notifications on'}
          </button>
        ) : state === 'unsupported' ? (
          <p>Add Dame to your phone&apos;s Home Screen to receive app notifications.</p>
        ) : state === 'denied' ? (
          <p>Notifications are blocked in this browser&apos;s settings.</p>
        ) : (
          <button type="button" className="dame-button dame-button-light" onClick={enableNotifications} disabled={working || state === 'loading'}>
            {working ? 'Turning on…' : state === 'loading' ? 'Checking…' : 'Let Dame notify me'}
          </button>
        )}
        {message ? <small role="status">{message}</small> : null}
        <small>Optional. You can turn them off anytime.</small>
      </div>
    </section>
  );
}
