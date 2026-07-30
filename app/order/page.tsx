import type { Metadata } from 'next';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { getSquareCatalog } from '../lib/square';
import { readSiteSettings } from '../lib/supabase-rest';
import { liveLocation as fallbackLocation } from '../site-config';
import OrderExperience from './order-experience';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Pickup',
  description: 'Order Dame Coffee cold brew and matcha for pickup at today’s live location.',
};

export default async function OrderPage() {
  const [catalog, remoteSettings] = await Promise.all([
    getSquareCatalog(),
    readSiteSettings().catch(() => null),
  ]);

  const location = remoteSettings
    ? {
        title: remoteSettings.location_title,
        address: remoteSettings.address,
        hours: remoteSettings.hours,
        isOpen: remoteSettings.is_open,
        mobileOrdering: remoteSettings.mobile_ordering,
        waitMinutes: remoteSettings.wait_minutes,
        mapsUrl: remoteSettings.maps_url,
      }
    : {
        title: fallbackLocation.title,
        address: fallbackLocation.address,
        hours: fallbackLocation.hours,
        isOpen: fallbackLocation.isOpen,
        mobileOrdering: fallbackLocation.mobileOrdering,
        waitMinutes: fallbackLocation.waitMinutes,
        mapsUrl: fallbackLocation.mapsUrl,
      };

  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <OrderExperience
        items={catalog.items}
        squareConfigured={catalog.configured}
        location={location}
      />
      <SiteFooter />
    </main>
  );
}
