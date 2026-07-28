'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readSiteSettings, SiteSettings } from './lib/supabase-rest';
import { liveLocation as fallbackLocation, missionStatement } from './site-config';

const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Menu', href: '#menu' },
  { label: 'Locations', href: '#find-us' },
  { label: 'Catering', href: '#catering' },
  { label: 'Rewards', href: '#rewards' },
  { label: 'About', href: '#story' },
  { label: 'Contact', href: '#contact' },
];

export default function Home() {
  const [remoteLocation, setRemoteLocation] = useState<SiteSettings | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    readSiteSettings().then(setRemoteLocation).catch(() => {
      // Keep the built-in fallback visible if Supabase is temporarily unavailable.
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-is-open', menuOpen);
    return () => document.body.classList.remove('menu-is-open');
  }, [menuOpen]);

  const liveLocation = remoteLocation
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

  const orderingAvailable = liveLocation.isOpen && liveLocation.mobileOrdering;
  const liveMessage = liveLocation.isOpen ? "We’re brewing." : "We’ll be back soon.";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main id="home" className="site-shell">
      <header className="site-header">
        <a className="brand-link" href="#home" aria-label="Dame Coffee home" onClick={closeMenu}>
          <Image src="/assets/logo.png" alt="" width={500} height={500} priority />
        </a>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.label} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <a
          className={`button button-small header-order ${orderingAvailable ? '' : 'button-muted'}`}
          href={orderingAvailable ? '#menu' : '#find-us'}
          aria-disabled={!orderingAvailable}
        >
          {orderingAvailable ? 'Order' : 'View today'}
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
        </button>

        <nav
          id="mobile-navigation"
          className={`mobile-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Mobile navigation"
        >
          <p>Dame Coffee</p>
          {navigation.map((item) => (
            <a key={item.label} href={item.href} onClick={closeMenu}>{item.label}</a>
          ))}
          <div className="mobile-nav-contact">
            <a href="tel:+19094519307">(909) 451-9307</a>
            <a href="mailto:info@damecoffeeco.com">info@damecoffeeco.com</a>
          </div>
        </nav>
      </header>

      <section className="home-hero" aria-labelledby="hero-title">
        <Image
          src="/assets/cart-venice.jpg"
          alt="A Dame Coffee drink held in front of the mobile cart at Venice Beach"
          fill
          priority
          sizes="100vw"
          className="home-hero-image"
        />
        <div className="home-hero-wash" />
        <div className="home-hero-copy">
          <p className="kicker kicker-light">Dame Coffee · Dame Vida</p>
          <h1 id="hero-title">
            Crafted with heart.
            <span>Rooted in Mexican culture.</span>
          </h1>
          <p className="hero-support">Coffee made with intention, culture, unity, and love.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#find-us">Find us today</a>
            <a className="text-link text-link-light" href="#menu">
              Explore the menu <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <a className="hero-scroll" href="#find-us">
          Today&apos;s location
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section id="find-us" className="find-section section-pad" aria-labelledby="find-heading">
        <div className="find-intro">
          <p className="kicker">
            <span className={`live-dot ${liveLocation.isOpen ? '' : 'is-closed'}`} />
            {liveMessage}
          </p>
          <h2 id="find-heading">Find Dame today.</h2>
          <p>
            We bring a beautiful coffee experience to where people already are.
            Check today&apos;s details before heading over.
          </p>
        </div>

        <article className="live-card">
          <div className="live-card-top">
            <div>
              <p className="live-card-label">{liveLocation.isOpen ? 'Serving today' : 'Current location'}</p>
              <h3>{liveLocation.title}</h3>
            </div>
            <span className={`open-badge ${liveLocation.isOpen ? '' : 'is-closed'}`}>
              {liveLocation.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          <div className="location-copy">
            <p className="address">{liveLocation.address}</p>
            <p>{liveLocation.directions}</p>
          </div>

          <dl className="live-facts">
            <div>
              <dt>Hours</dt>
              <dd>{liveLocation.hours}</dd>
            </div>
            <div>
              <dt>Wait</dt>
              <dd>{liveLocation.isOpen ? `About ${liveLocation.waitMinutes} min` : 'Not available'}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{orderingAvailable ? 'Ordering open' : 'Ordering paused'}</dd>
            </div>
          </dl>

          <div className="live-actions">
            <a className="button" href={liveLocation.mapsUrl} target="_blank" rel="noreferrer">
              Get directions
            </a>
            <a
              className={`button button-outline ${orderingAvailable ? '' : 'button-disabled'}`}
              href={orderingAvailable ? '#menu' : '#find-us'}
              aria-disabled={!orderingAvailable}
              onClick={(event) => {
                if (!orderingAvailable) event.preventDefault();
              }}
            >
              {orderingAvailable ? 'Order pickup' : 'Ordering unavailable'}
            </a>
          </div>
        </article>
      </section>

      <section id="menu" className="product-section" aria-labelledby="product-heading">
        <div className="product-image product-image-main">
          <Image
            src="/assets/cart-market.jpg"
            alt="The white Dame Coffee cart at a community market"
            fill
            sizes="(max-width: 760px) 100vw, 55vw"
          />
        </div>
        <div className="product-story">
          <p className="kicker">Cold brew · Matcha · Food</p>
          <h2 id="product-heading">Made to make you stop for a sip.</h2>
          <p>
            Start simple or try one of our specialty flavors. Everything is served cold,
            thoughtfully made, and ready to meet you where you are.
          </p>
          <a className="text-link" href="#contact">
            Full menu coming next <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="product-image product-image-secondary">
          <Image
            src="/assets/cart-team.jpg"
            alt="The Dame Coffee team serving customers from the cart"
            fill
            sizes="(max-width: 760px) 100vw, 30vw"
          />
        </div>
      </section>

      <section id="story" className="mission-section section-pad" aria-labelledby="mission-heading">
        <div className="mission-mark" aria-hidden="true">
          <span>D</span>
          <span>C</span>
        </div>
        <div className="mission-copy">
          <p className="kicker">Our mission</p>
          <h2 id="mission-heading">{missionStatement}</h2>
          <p>Dame vida. Good coffee finds good people.</p>
        </div>
      </section>

      <section className="next-chapters section-pad" aria-labelledby="chapters-heading">
        <div>
          <p className="kicker">More Dame</p>
          <h2 id="chapters-heading">One clear place for every part of the experience.</h2>
        </div>
        <div className="chapter-grid">
          <a id="catering" href="mailto:info@damecoffeeco.com?subject=Dame%20Coffee%20Catering">
            <span>01</span>
            <strong>Catering</strong>
            <p>Bring cold brew and matcha to your next event.</p>
          </a>
          <a id="rewards" href="mailto:info@damecoffeeco.com?subject=Dame%20Rewards">
            <span>02</span>
            <strong>Rewards</strong>
            <p>Points and free items are on the way.</p>
          </a>
          <a href="#story">
            <span>03</span>
            <strong>Our story</strong>
            <p>Culture, community, and coffee with intention.</p>
          </a>
        </div>
      </section>

      <footer id="contact" className="site-footer">
        <div className="footer-brand">
          <Image src="/assets/logo.png" alt="Dame Coffee" width={500} height={500} />
          <p>Coffee made with culture, unity, and love.</p>
        </div>

        <div className="footer-nav">
          <p>Explore</p>
          {navigation.slice(0, 6).map((item) => (
            <a key={item.label} href={item.href}>{item.label}</a>
          ))}
        </div>

        <div className="footer-contact">
          <p>Talk to us</p>
          <a href="tel:+19094519307">(909) 451-9307</a>
          <a href="mailto:info@damecoffeeco.com">info@damecoffeeco.com</a>
          <a href="https://instagram.com/_dame.coffee_" target="_blank" rel="noreferrer">
            @_dame.coffee_
          </a>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Dame Coffee Co.</span>
          <span>Santa Ana · Walnut / Diamond Bar · Venice</span>
          <Link href="/admin/login">Private admin</Link>
        </div>
      </footer>
    </main>
  );
}
