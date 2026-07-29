'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from './components/site-footer';
import SiteHeader from './components/site-header';
import { readSiteSettings, SiteSettings } from './lib/supabase-rest';
import { liveLocation as fallbackLocation, missionStatement } from './site-config';

export default function Home() {
  const [remoteLocation, setRemoteLocation] = useState<SiteSettings | null>(null);

  useEffect(() => {
    readSiteSettings().then(setRemoteLocation).catch(() => {
      // The public fallback keeps today’s information visible if Supabase is unavailable.
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
    <main className="dame-site">
      <SiteHeader overlay />

      <section className="dame-landing" aria-labelledby="landing-title">
        <Image
          src="/assets/cart-venice.jpg"
          alt="A Dame Coffee drink held in front of the cart at Venice Beach"
          fill
          priority
          sizes="100vw"
          className="dame-landing-image"
        />
        <div className="dame-landing-shade" />

        <div className="dame-landing-copy">
          <p className="dame-kicker dame-kicker-light">Dame Coffee · Dame Vida</p>
          <h1 id="landing-title">
            Coffee that makes
            <span>you want to find us.</span>
          </h1>
          <p>Cold brew and matcha made with intention, culture, unity, and love.</p>
          <div className="dame-actions">
            <a className="dame-button dame-button-light" href="#today">Find us today</a>
            <Link className="dame-inline-link dame-inline-link-light" href="/menu">
              Explore the menu <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <a className="dame-scroll-cue" href="#today">
          Today&apos;s details <span aria-hidden="true">↓</span>
        </a>
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
            <Link className="dame-button dame-button-outline" href="/menu">
              View menu
            </Link>
          </div>
        </article>
      </section>

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
