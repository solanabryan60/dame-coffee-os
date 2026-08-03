'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Catering', href: '/catering' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'App', href: '/app' },
  { label: 'Info', href: '/#info' },
];

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dame-menu-open', menuOpen);
    return () => document.body.classList.remove('dame-menu-open');
  }, [menuOpen]);

  return (
    <header className={`dame-header ${overlay ? 'dame-header-overlay' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <Link className="dame-logo" href="/" aria-label="Dame Coffee home" onClick={() => setMenuOpen(false)}>
        <Image src="/assets/dame-logo-red.jpg" alt="Dame Coffee" width={954} height={843} priority />
      </Link>

      <nav className="dame-desktop-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <Link key={item.label} href={item.href}>{item.label}</Link>
        ))}
      </nav>

      <Link className="dame-header-action" href="/order">Order pickup</Link>

      <button
        className="dame-menu-button"
        type="button"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="dame-mobile-navigation"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
      </button>

      <nav
        id="dame-mobile-navigation"
        className={`dame-mobile-nav ${menuOpen ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
        hidden={!menuOpen}
      >
        <p>Where would you like to go?</p>
        {navigation.map((item) => (
          <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link className="dame-mobile-primary" href="/order" onClick={() => setMenuOpen(false)}>
          Order pickup
        </Link>
        <div>
          <a href="tel:+19094519307">(909) 451-9307</a>
          <a href="mailto:info@damecoffeeco.com">info@damecoffeeco.com</a>
        </div>
      </nav>
    </header>
  );
}
