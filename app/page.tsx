'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import GoogleMap from './components/google-map';
import BeanStateImage from './components/bean-state';
import SiteFooter from './components/site-footer';
import SiteHeader from './components/site-header';
import { readSiteSettings, SiteSettings } from './lib/supabase-rest';
import { liveLocation as fallbackLocation } from './site-config';

const menuCollections = [
  {
    number: '01',
    name: 'Cold Foam Lovers',
    detail: 'Layered drinks finished with cold foam—already included.',
  },
  {
    number: '02',
    name: 'Specialty Drinks',
    detail: 'Dame flavors served with cold brew or matcha, made without cold foam.',
  },
  {
    number: '03',
    name: 'The Basics',
    detail: 'Cold brew and matcha, simple and made your way.',
  },
];

export default function Home() {
  const [remoteLocation, setRemoteLocation] = useState<SiteSettings | null>(null);

  useEffect(() => {
    readSiteSettings().then(setRemoteLocation).catch(() => {
      // Today’s location remains visible through the public fallback.
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
    <main className="dame-site dame-home-v3">
      <SiteHeader overlay />

      <section className="dame-home-v3-hero" aria-labelledby="home-hero-title">
        <Image
          src="/assets/cart-venice.jpg"
          alt="A Dame Coffee drink held in front of the mobile cart in Venice"
          fill
          priority
          sizes="100vw"
          className="dame-home-v3-hero-image"
        />
        <div className="dame-home-v3-hero-shade" />
        <div className="dame-home-v3-hero-copy">
          <p className="dame-kicker dame-kicker-light">Mobile coffee · Southern California</p>
          <h1 id="home-hero-title">Made to move.<br /><em>Rooted in home.</em></h1>
          <p>
            Cold brew and matcha served with care, culture, and a little more vida.
          </p>
          <div className="dame-actions">
            <a className="dame-button dame-button-light" href="#today">Find Dame today</a>
            <Link className="dame-inline-link dame-inline-link-light" href="/menu">
              View the menu <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <p className="dame-home-v3-signature" aria-hidden="true">Dame Coffee · Dame Vida</p>
      </section>

      <section id="today" className="dame-home-v3-today" aria-labelledby="today-title">
        <header>
          <p className="dame-kicker">
            <span className={`dame-live-dot ${location.isOpen ? '' : 'is-closed'}`} />
            {location.isOpen ? 'Live location' : 'Next location'}
          </p>
          <h2 id="today-title">Find us today.</h2>
          <p>Our cart moves. This page always tells you where to meet us.</p>
        </header>

        <div className="dame-home-v3-location-layout">
          <article className={`dame-home-v3-location-card ${location.title.length > 28 ? 'has-long-title' : ''}`}>
            <div className="dame-home-v3-location-status">
              <span className={`dame-status ${location.isOpen ? '' : 'is-closed'}`}>
                {location.isOpen ? 'Open now' : 'Closed'}
              </span>
              <span>{location.hours}</span>
            </div>
            <BeanStateImage state="walking" className="dame-home-page-bean" decorative />
            <h3>{location.title}</h3>
            <p className="dame-home-v3-address">{location.address}</p>
            <p className="dame-home-v3-directions">{location.directions}</p>

            <dl>
              <div><dt>Wait</dt><dd>{location.isOpen ? `About ${location.waitMinutes} min` : '—'}</dd></div>
              <div><dt>Pickup</dt><dd>{orderingAvailable ? 'Open' : 'Paused'}</dd></div>
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
            className="dame-home-v3-map"
          />
        </div>
      </section>

      <section className="dame-home-v3-menu" aria-labelledby="home-menu-title">
        <div className="dame-home-v3-menu-photo">
          <Image
            src="/assets/cart-market.jpg"
            alt="Dame Coffee serving at a community market"
            fill
            sizes="(max-width: 820px) 100vw, 48vw"
          />
        </div>
        <div className="dame-home-v3-menu-copy">
          <p className="dame-kicker">What we make</p>
          <h2 id="home-menu-title">Cold drinks.<br /><em>Full character.</em></h2>
          <div className="dame-home-v3-collections">
            {menuCollections.map((collection) => (
              <article key={collection.name}>
                <span>{collection.number}</span>
                <div>
                  <h3>{collection.name}</h3>
                  <p>{collection.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <Link className="dame-button" href="/menu">Explore the full menu</Link>
        </div>
      </section>

      <section className="dame-home-v3-story-link" aria-label="Dame Coffee story">
        <p>Rooted in culture. Made to make you feel at home.</p>
        <Link href="/about">Our story <span aria-hidden="true">↗</span></Link>
      </section>

      <SiteFooter />
    </main>
  );
}
