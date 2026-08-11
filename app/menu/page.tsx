import type { Metadata } from 'next';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { getSquareCatalog } from '../lib/square';
import { applyMenuPresentation } from '../lib/menu-presentation';
import { readMenuAvailability, readMenuPresentation } from '../lib/supabase-rest';
import MenuExperience from './menu-experience';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Explore Dame Coffee cold brew, matcha, specialty drinks, cold foam favorites, and food.',
};

export default async function MenuPage() {
  const [catalog, availability, presentation] = await Promise.all([
    getSquareCatalog(),
    readMenuAvailability().catch(() => []),
    readMenuPresentation().catch(() => []),
  ]);
  const soldOutItemIds = new Set(
    availability.filter((item) => item.is_sold_out).map((item) => item.square_item_id),
  );
  const items = applyMenuPresentation(catalog.items, presentation).map((item) => ({
    ...item,
    isSoldOut: soldOutItemIds.has(item.id),
  }));

  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <MenuExperience items={items} />
      <SiteFooter />
    </main>
  );
}
