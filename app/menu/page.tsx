import type { Metadata } from 'next';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { getSquareCatalog } from '../lib/square';
import MenuExperience from './menu-experience';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Explore Dame Coffee cold brew, matcha, specialty drinks, cold foam favorites, and food.',
};

export default async function MenuPage() {
  const catalog = await getSquareCatalog();

  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <MenuExperience items={catalog.items} syncedWithSquare={catalog.configured} />
      <SiteFooter />
    </main>
  );
}
