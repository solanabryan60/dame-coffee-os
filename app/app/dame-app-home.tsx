'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BeanStateImage from '../components/bean-state';
import GoogleMap from '../components/google-map';
import NotificationOptIn from '../components/notification-opt-in';
import UpcomingEvents from '../components/upcoming-events';
import type { RewardsAccountPayload } from '../lib/dame-rewards';
import { getCustomerSession } from '../lib/customer-session';
import {
  readSiteSettings,
  readUpcomingEvents,
  type SiteSettings,
  type UpcomingEvent,
} from '../lib/supabase-rest';
import { liveLocation as fallbackLocation } from '../site-config';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandaloneApp() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true;
}

export default function DameAppHome() {
  const [remoteLocation, setRemoteLocation] = useState<SiteSettings | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [rewards, setRewards] = useState<RewardsAccountPayload | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneApp());
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
    };

    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    readSiteSettings().then(setRemoteLocation).catch(() => {
      // The public fallback keeps the app useful if live settings are temporarily unavailable.
    });
    readUpcomingEvents().then(setEvents).catch(() => {
      // The app still works if upcoming events are temporarily unavailable.
    });

    getCustomerSession()
      .then(async (session) => {
        if (!session) return;
        const response = await fetch('/api/rewards/account', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (!response.ok) return;
        setRewards((await response.json()) as RewardsAccountPayload);
      })
      .catch(() => {
        // The app remains usable when a rewards session expires.
      })
      .finally(() => setAccountReady(true));
  }, []);

  const location = remoteLocation
    ? {
        title: remoteLocation.location_title,
        address: remoteLocation.address,
        hours: remoteLocation.hours,
        isOpen: remoteLocation.is_open,
        mobileOrdering: remoteLocation.mobile_ordering,
        waitMinutes: remoteLocation.wait_minutes,
        mapsUrl: remoteLocation.maps_url,
      }
    : fallbackLocation;

  const orderingAvailable = location.isOpen && location.mobileOrdering;

  async function installApp() {
    if (installed) return;
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') setInstallPrompt(null);
      return;
    }
    setShowInstallHelp(true);
  }

  return (
    <main className="dame-app-shell">
      <header className="dame-app-topbar">
        <Link className="dame-app-wordmark" href="/" aria-label="Dame Coffee website">
          <Image
            src="/assets/logo.png"
            alt="Dame Coffee"
            width={500}
            height={500}
            priority
          />
        </Link>
        <div className="dame-app-name">
          <strong>Dame App</strong>
        </div>
        {!installed ? (
          <button type="button" onClick={installApp}>Add to phone</button>
        ) : (
          <span className="dame-app-installed">Installed</span>
        )}
      </header>

      <section className="dame-app-welcome" aria-labelledby="dame-app-title">
        <p className="dame-kicker dame-kicker-light">Dame Coffee · Dame Vida</p>
        <h1 id="dame-app-title">
          Everything Dame,<br />
          <em>right where you need it.</em>
        </h1>
        <p>Find us, order ahead, and keep every reward close.</p>
      </section>

      <section className="dame-app-live" aria-labelledby="dame-app-live-title">
        <header>
          <div>
            <p className="dame-kicker">
              <span className={`dame-live-dot ${location.isOpen ? '' : 'is-closed'}`} />
              {location.isOpen ? 'We’re brewing' : 'We’re closed right now'}
            </p>
            <h2 id="dame-app-live-title">Us, today.</h2>
          </div>
          <span className={`dame-status ${location.isOpen ? '' : 'is-closed'}`}>
            {location.isOpen ? 'Open' : 'Closed'}
          </span>
        </header>
        <h3>{location.title}</h3>
        <p>{location.address}</p>
        <GoogleMap
          address={location.address}
          title={`Google Map showing ${location.title}`}
          className="dame-app-map"
        />
        <dl>
          <div><dt>Hours</dt><dd>{location.hours}</dd></div>
          <div><dt>Wait</dt><dd>{location.isOpen ? `About ${location.waitMinutes} min` : '—'}</dd></div>
        </dl>
        <div className="dame-app-live-actions">
          <Link className="dame-button" href={orderingAvailable ? '/order' : '/menu'}>
            {orderingAvailable ? 'Order pickup' : 'View menu'}
          </Link>
          <a href={location.mapsUrl} target="_blank" rel="noreferrer">Directions <span>↗</span></a>
        </div>
      </section>

      <UpcomingEvents events={events} compact />

      <NotificationOptIn compact />

      <section className="dame-app-rewards" aria-labelledby="dame-app-rewards-title">
        <div>
          <p className="dame-kicker">Dame Rewards</p>
          {rewards ? (
            <>
              <h2 id="dame-app-rewards-title">{rewards.rewards.points.toLocaleString()} <span>points</span></h2>
              <p>
                {rewards.rewards.nextReward
                  ? `${rewards.rewards.nextReward.pointsAway.toLocaleString()} points until ${rewards.rewards.nextReward.name}.`
                  : 'Every Dame reward is within reach.'}
              </p>
            </>
          ) : (
            <>
              <h2 id="dame-app-rewards-title">A little love,<br />every purchase.</h2>
              <p>{accountReady ? 'Sign in to see your points and rewards.' : 'Loading your rewards…'}</p>
            </>
          )}
        </div>
        <BeanStateImage state="croissant" className="dame-app-page-bean" decorative />
        <Link href={rewards ? '/rewards/account' : '/rewards#join'}>
          {rewards ? 'Open my rewards' : 'Join or sign in'} <span>→</span>
        </Link>
      </section>

      <nav className="dame-app-quick-grid" aria-label="Dame app shortcuts">
        <Link href="/menu"><span>01</span><strong>Menu</strong><small>Find your drink</small></Link>
        <Link href="/order"><span>02</span><strong>Order</strong><small>Pickup when open</small></Link>
        <Link href="/catering"><span>03</span><strong>Catering</strong><small>Bring Dame to you</small></Link>
        <Link href="/rewards/account"><span>04</span><strong>Rewards</strong><small>Points & free items</small></Link>
      </nav>

      {!installed ? (
        <section className="dame-app-install" aria-labelledby="install-dame-title">
          <div>
            <p className="dame-kicker">Keep Dame close</p>
            <h2 id="install-dame-title">Put us on your home screen.</h2>
            <p>No app store yet. Add Dame straight to your phone for a faster, full-screen experience.</p>
          </div>
          <button className="dame-button dame-button-light" type="button" onClick={installApp}>
            Add Dame to my phone
          </button>
        </section>
      ) : null}

      <footer className="dame-app-footer">
        <BeanStateImage state="croissant" decorative />
        <div>
          <p>More flavor. More life. <b>Más Dame.</b></p>
          <Link href="/">Visit full website</Link>
        </div>
      </footer>

      {showInstallHelp ? (
        <div className="dame-install-dialog-backdrop" role="presentation" onClick={() => setShowInstallHelp(false)}>
          <section
            className="dame-install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dame-install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" aria-label="Close install instructions" onClick={() => setShowInstallHelp(false)}>×</button>
            <Image src="/dame-icon" alt="" width={72} height={72} unoptimized />
            <p className="dame-kicker">Dame App</p>
            <h2 id="dame-install-help-title">Add Dame to your home screen.</h2>
            {isIos ? (
              <ol>
                <li>Tap the <b>Share</b> button in Safari.</li>
                <li>Scroll and tap <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b>. Dame will appear with your apps.</li>
              </ol>
            ) : (
              <ol>
                <li>Open your browser menu.</li>
                <li>Tap <b>Install app</b> or <b>Add to Home Screen</b>.</li>
                <li>Confirm, then open Dame from your home screen.</li>
              </ol>
            )}
            <p className="dame-install-note">Use Safari on iPhone or Chrome on Android for the smoothest setup.</p>
          </section>
        </div>
      ) : null}

      <nav className="dame-app-bottom-nav" aria-label="App navigation">
        <Link className="is-active" href="/app"><span>⌂</span>Today</Link>
        <Link href="/menu"><span>☕</span>Menu</Link>
        <Link href="/order"><span>＋</span>Order</Link>
        <Link href="/rewards/account"><span>♥</span>Rewards</Link>
      </nav>
    </main>
  );
}
