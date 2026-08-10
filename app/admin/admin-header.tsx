'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { clearAdminSession } from '../lib/admin-session';

const sections = [
  { href: '/admin', label: 'Overview' },
  { href: '/mobileorder', label: 'Mobile Orders' },
  { href: '/admin/location', label: 'Location' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/prep', label: 'Daily Prep' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/catering', label: 'Catering' },
  { href: '/admin/rewards', label: 'Rewards' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/notifications', label: 'Notify' },
];

export default function AdminHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearAdminSession();
    router.replace('/admin/login');
  }

  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">DAME COFFEE OS</p>
          <h1>{title}</h1>
        </div>
        <div className="admin-top-actions">
          {children}
          <Link className="pill ghost" href="/" target="_blank">View website</Link>
          <button className="pill ghost" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>
      <nav className="admin-section-nav" aria-label="Dame Coffee operations">
        {sections.map((section) => {
          const active = section.href === '/admin'
            ? pathname === section.href
            : pathname.startsWith(section.href)
              || (section.href === '/mobileorder' && pathname.startsWith('/admin/orders'));
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={active ? 'is-active' : ''}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
