import { NextResponse } from 'next/server';
import { applyMenuPresentation } from '../../../lib/menu-presentation';
import { getSquareCatalog } from '../../../lib/square';
import {
  readMenuAvailability,
  readMenuPresentation,
  readSiteSettings,
  readUpcomingEvents,
} from '../../../lib/supabase-rest';
import { liveLocation as fallbackLocation } from '../../../site-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [catalog, settings, availability, presentation, events] = await Promise.all([
    getSquareCatalog(),
    readSiteSettings().catch(() => null),
    readMenuAvailability().catch(() => []),
    readMenuPresentation().catch(() => []),
    readUpcomingEvents().catch(() => []),
  ]);

  const soldOutIds = new Set(
    availability.filter((item) => item.is_sold_out).map((item) => item.square_item_id),
  );
  const menu = applyMenuPresentation(catalog.items, presentation).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    categoryLabel: item.categoryLabel,
    imageUrl: item.imageUrl,
    priceLabel: item.variations[0]?.priceLabel ?? '',
    isSoldOut: soldOutIds.has(item.id),
    isFeatured: Boolean(item.isFeatured),
    isSeasonal: Boolean(item.isSeasonal),
  }));

  const location = settings
    ? {
        title: settings.location_title,
        address: settings.address,
        hours: settings.hours,
        isOpen: settings.is_open,
        mobileOrdering: settings.mobile_ordering,
        waitMinutes: settings.wait_minutes,
        mapsUrl: settings.maps_url,
      }
    : fallbackLocation;

  return NextResponse.json(
    {
      location,
      menu,
      events,
      refreshedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    },
  );
}
