'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from './admin-header';
import AdminInsights from './admin-insights';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../lib/admin-session';
import { listRewardPromotions } from '../lib/dame-rewards';
import {
  listCateringRequestsForAdmin,
  listInventoryItemsForAdmin,
  listMenuAvailabilityForAdmin,
  listPrepTasksForAdmin,
  listPickupOrdersForAdmin,
  listUpcomingEventsForAdmin,
  readSiteSettings,
} from '../lib/supabase-rest';

type Overview = {
  location: string;
  open: boolean;
  ordering: boolean;
  activeOrders: number;
  soldOut: number;
  inventoryOut: number;
  inventoryLow: number;
  prepDone: number;
  prepTotal: number;
  newCatering: number;
  upcomingCatering: number;
  activePromotions: number;
  publishedEvents: number;
  subscribers: number;
};

function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const [settings, orders, availability, inventory, prepTasks, catering, promotions, events, notifications] = await Promise.all([
          readSiteSettings(),
          listPickupOrdersForAdmin(token),
          listMenuAvailabilityForAdmin(token),
          listInventoryItemsForAdmin(token),
          listPrepTasksForAdmin(token),
          listCateringRequestsForAdmin(token),
          listRewardPromotions(token),
          listUpcomingEventsForAdmin(token),
          fetch('/api/admin/notifications', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }).then(async (response) => {
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Could not load notifications.');
            return payload as { subscribers: number };
          }),
        ]);
        if (!active) return;
        const today = localDateKey();
        const now = Date.now();
        setOverview({
          location: settings.location_title,
          open: settings.is_open,
          ordering: settings.is_open && settings.mobile_ordering,
          activeOrders: orders.filter((order) => ['paid', 'preparing', 'ready', 'refund_pending'].includes(order.status)).length,
          soldOut: availability.filter((item) => item.is_sold_out).length,
          inventoryOut: inventory.filter((item) => Number(item.quantity) <= 0).length,
          inventoryLow: inventory.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.low_stock_at)).length,
          prepDone: prepTasks.filter((task) => task.last_completed_on === today).length,
          prepTotal: prepTasks.length,
          newCatering: catering.filter((request) => request.status === 'deposit_paid').length,
          upcomingCatering: catering.filter((request) => request.event_date >= today && !['cancelled', 'refunded'].includes(request.status)).length,
          activePromotions: promotions.filter((promotion) => promotion.active && new Date(promotion.starts_at).getTime() <= now && new Date(promotion.ends_at).getTime() >= now).length,
          publishedEvents: events.filter((event) => event.is_published && event.event_date >= today).length,
          subscribers: notifications.subscribers,
        });
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load the operations center.');
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const cards = overview ? [
    {
      href: '/admin/location',
      eyebrow: overview.open ? 'Open now' : 'Closed now',
      title: overview.location,
      detail: overview.ordering ? 'Mobile ordering is accepting orders.' : 'Mobile ordering is currently off.',
      action: 'Manage live location',
    },
    {
      href: '/mobileorder',
      eyebrow: 'Mobile orders',
      title: `${overview.activeOrders} active ${overview.activeOrders === 1 ? 'mobile order' : 'mobile orders'}`,
      detail: 'See every paid, preparing, ready, and refund-needed mobile order in one place.',
      action: 'Open mobile orders',
    },
    {
      href: '/admin/menu',
      eyebrow: 'Today’s menu',
      title: `${overview.soldOut} sold out`,
      detail: overview.soldOut ? 'Customers cannot order those items online.' : 'Every synced menu item is available online.',
      action: 'Manage availability',
    },
    {
      href: '/admin/inventory',
      eyebrow: 'Stockroom',
      title: overview.inventoryOut
        ? `${overview.inventoryOut} out of stock`
        : `${overview.inventoryLow} running low`,
      detail: overview.inventoryOut
        ? `${overview.inventoryLow} more ${overview.inventoryLow === 1 ? 'item is' : 'items are'} running low.`
        : overview.inventoryLow
          ? 'Restock these supplies before service.'
          : 'Every tracked supply is above its low-stock level.',
      action: 'Check inventory',
    },
    {
      href: '/admin/prep',
      eyebrow: 'Daily prep',
      title: `${overview.prepDone} of ${overview.prepTotal} complete`,
      detail: overview.prepTotal && overview.prepDone === overview.prepTotal
        ? 'The full checklist is finished for today.'
        : 'Opening, service, and closing tasks stay together here.',
      action: 'Open today’s checklist',
    },
    {
      href: '/admin/team',
      eyebrow: 'Team workspace',
      title: 'Schedule, clock, and train',
      detail: 'Today’s events, team shifts, hours, recipes, and training stay together.',
      action: 'Open team workspace',
    },
    {
      href: '/admin/catering',
      eyebrow: 'Catering center',
      title: `${overview.newCatering} new ${overview.newCatering === 1 ? 'deposit' : 'deposits'}`,
      detail: `${overview.upcomingCatering} upcoming ${overview.upcomingCatering === 1 ? 'event needs' : 'events need'} attention.`,
      action: 'Review catering',
    },
    {
      href: '/admin/rewards',
      eyebrow: 'Dame Rewards',
      title: `${overview.activePromotions} live ${overview.activePromotions === 1 ? 'campaign' : 'campaigns'}`,
      detail: 'Look up one-time reward codes and schedule 2× points moments.',
      action: 'Open rewards',
    },
    {
      href: '/admin/events',
      eyebrow: 'Upcoming events',
      title: `${overview.publishedEvents} published`,
      detail: 'Keep the website and Dame App schedule current.',
      action: 'Manage events',
    },
    {
      href: '/admin/notifications',
      eyebrow: 'Dame updates',
      title: `${overview.subscribers} opted in`,
      detail: 'Send a thoughtful update to customers who chose notifications.',
      action: 'Send an update',
    },
  ] : [];

  return (
    <main className="admin-shell">
      <AdminHeader title="Operations" />

      <AdminInsights />

      {error ? <section className="admin-card admin-rewards-card"><p className="admin-error">{error}</p></section> : null}
      {!overview && !error ? <section className="admin-card admin-rewards-card"><p>Loading today’s operations…</p></section> : null}

      {overview ? (
        <section className="admin-overview-grid" aria-label="Dame Coffee operations">
          {cards.map((card) => (
            <Link className="admin-overview-link" href={card.href} key={card.href}>
              <span>{card.eyebrow}</span>
              <div>
                <strong>{card.title}</strong>
                <p>{card.detail}</p>
              </div>
              <b>{card.action} →</b>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
