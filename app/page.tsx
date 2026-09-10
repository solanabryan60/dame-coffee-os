'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import './pouring-bean-home.css';
import SiteFooter from './components/site-footer';
import GoogleMap from './components/google-map';
import NotificationOptIn from './components/notification-opt-in';
import SiteHeader from './components/site-header';
import UpcomingEvents from './components/upcoming-events';
import {
  readSiteSettings,
  readUpcomingEvents,
  SiteSettings,
  UpcomingEvent,
} from './lib/supabase-rest';
import { liveLocation as fallbackLocation, missionStatement } from './site-config';

export default function Home() {
  const [remoteLocation, setRemoteLocation] = useState<SiteSettings | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    readSiteSettings().then(setRemoteLocation).catch(() => {
      // The public fallback keeps today’s information visible if Supabase is unavailable.
    });
    readUpcomingEvents().then(setEvents).catch(() => {
      // Events stay hidden if they are temporarily unavailable.
    });
  }, []);

  const location = remoteLocation
    ? {
        title: remoteLocation.location_title,
        address: remoteLocation.address,
        directions: remoteLocation.directions,
        hours: remoteLocation.hours,
        isOpen: remoteLocation.is_open,
        mobileOrdering: remoteLocation.mobile_ordering,
        waitMinutes: remoteLocation.wait_minutes,
        mapsUrl: remoteLocation.maps_url,
      }
    : fallbackLocation;

  const orderingAvailable = location.isOpen && location.mobileOrdering;

  return (
    <main className="dame-site dame-bean-home">
      <SiteHeader overlay />

      <section className="dame-bean-hero" aria-labelledby="landing-title">
        <div className="dame-bean-hero-copy">
          <p className="dame-kicker dame-kicker-light">Dame Coffee · Southern California</p>
          <h1 id="landing-title">
            Cold brew,<br />
            matcha <span>&amp; cultura.</span>
          </h1>
          <p className="dame-bean-hero-intro">A little café. A lot of corazón.</p>
          <div className="dame-actions">
            <Link className="dame-button dame-button-light" href="/order">Order pickup <span aria-hidden="true">↗</span></Link>
            <a className="dame-inline-link dame-inline-link-light" href="#today">Find us today <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="dame-bean-hero-art">
          <Image
            src="/assets/bean-states/bean-pouring-open-eyes-red.png"
            alt="Pouring Bean, eyes open, pouring cold brew over ice."
            width={1254}
            height={1254}
            sizes="(max-width: 760px) 95vw, 52vw"
            priority
          />
          <p>He pours. You enjoy.</p>
        </div>
        <div className="dame-bean-hero-bottom" aria-hidden="true">
          <span>Cold brew · Matcha · Más</span>
          <span>Dame Coffee. Dame Vida.</span>
        </div>
      </section>

      <section id="today" className="dame-today" aria-labelledby="today-title">
        <div className="dame-today-heading">
          <p className="dame-kicker">
            <span className={`dame-live-dot ${location.isOpen ? '' : 'is-closed'}`} />
            {location.isOpen ? 'We’re brewing' : 'We’re closed right now'}
          </p>
          <h2 id="today-title">Us, today.</h2>
          <p>
            No guessing. This is our current location, today&apos;s hours, and whether pickup
            ordering is available.
          </p>
        </div>

        <article className="dame-location-card">
          <div className="dame-location-top">
            <div>
              <p>{location.isOpen ? 'Serving today' : 'Our next listed stop'}</p>
              <h3>{location.title}</h3>
            </div>
            <span className={`dame-status ${location.isOpen ? '' : 'is-closed'}`}>
              {location.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          <div className="dame-location-address">
            <strong>{location.address}</strong>
            <span>{location.directions}</span>
          </div>

          <dl className="dame-location-facts">
            <div>
              <dt>Hours</dt>
              <dd>{location.hours}</dd>
            </div>
            <div>
              <dt>Wait</dt>
              <dd>{location.isOpen ? `About ${location.waitMinutes} min` : 'Not available'}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{orderingAvailable ? 'Ordering open' : 'Ordering paused'}</dd>
            </div>
          </dl>

          <div className="dame-actions">
            <a className="dame-button" href={location.mapsUrl} target="_blank" rel="noreferrer">
              Get directions
            </a>
            <Link className="dame-button dame-button-outline" href={orderingAvailable ? '/order' : '/menu'}>
              {orderingAvailable ? 'Order pickup' : 'View menu'}
            </Link>
          </div>
        </article>

        <GoogleMap
          address={location.address}
          title={`Google Map showing ${location.title}`}
          className="dame-home-map"
        />
      </section>

      <UpcomingEvents events={events} />

      <NotificationOptIn />

      <section id="info" className="dame-info" aria-labelledby="info-title">
        <div className="dame-info-photo">
          <Image
            src="/assets/cart-market.jpg"
            alt="The Dame Coffee cart at a community market"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="dame-info-copy">
          <p className="dame-kicker">More than coffee</p>
          <h2 id="info-title">A place to feel at home—wherever we park.</h2>
          <p className="dame-mission">{missionStatement}</p>
          <p className="dame-quote">Good coffee finds good people.</p>
          <div className="dame-info-links">
            <Link href="/menu">See what we make <span>→</span></Link>
            <Link href="/catering">Bring Dame to your event <span>→</span></Link>
            <Link href="/rewards">Join Dame Rewards <span>→</span></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
