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
    detail: 'Finished with cold foam.',
  },
  {
    number: '02',
    name: 'Specialty Drinks',
    detail: 'House flavors with cold brew or matcha.',
  },
  {
    number: '03',
    name: 'The Basics',
    detail: 'Cold brew and matcha, your way.',
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
          <p className="dame-kicker dame-kicker-light">Cold brew · Matcha · Southern California</p>
          <h1 id="home-hero-title">Cold brew, matcha<br /><em>& cultura.</em></h1>
          <p>Mexican roots. Cold drinks. Made for everyone.</p>
          <p lang="es">Raíces mexicanas. Bebidas frías. Para todos.</p>
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
          <p>Encuéntranos hoy.</p>
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
          <p className="dame-kicker">The menu · El menú</p>
          <h2 id="home-menu-title">Made cold.<br /><em>Hecho con cariño.</em></h2>
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
        <p>Our roots are in every cup. Nuestras raíces, en cada taza.</p>
        <Link href="/about">Our story <span aria-hidden="true">↗</span></Link>
      </section>

      <SiteFooter />
    </main>
  );
}
