import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Explore Dame Coffee cold brew, matcha, specialty drinks, cold foam favorites, and food.',
};

const categories = [
  {
    number: '01',
    id: 'basics',
    title: 'The Basics',
    note: 'Simple, cold, and easy to make your own.',
    items: [
      { name: 'Cold Brew', description: 'Our smooth house cold brew, steeped for 16 hours.', price: '$7' },
      { name: 'Matcha Latte', description: 'Matcha, simple syrup, and your choice of milk.', price: '$7' },
    ],
  },
  {
    number: '02',
    id: 'specialty',
    title: 'Specialty Drinks',
    note: 'House flavors without cold foam.',
    items: [
      { name: 'Mexicano', description: 'Cinnamon and sugar cane syrup with matcha or cold brew.', price: '$7' },
      { name: 'Brown Bear', description: 'Brown sugar honey syrup with matcha or cold brew.', price: '$7' },
      { name: 'Sugar Free Bear', description: 'Sugar-free vanilla cinnamon with matcha or cold brew.', price: '$7' },
    ],
  },
  {
    number: '03',
    id: 'foam',
    title: 'Cold Foam Lovers',
    note: 'These drinks already come finished with cold foam.',
    items: [
      { name: 'Mello Marsh', description: 'Marshmallow fluff, vanilla, milk, and cold foam with matcha or cold brew.', price: '$8' },
    ],
  },
  {
    number: '04',
    id: 'food',
    title: 'Food Items',
    note: 'Fresh pairings available while supplies last.',
    items: [
      { name: 'Croissants', description: 'Ask us what flavors are available today.', price: 'Today' },
    ],
  },
];

export default function MenuPage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />

      <section className="dame-page-hero dame-menu-hero">
        <div>
          <p className="dame-kicker">Cold drinks only—for now</p>
          <h1>Choose what sounds good.</h1>
          <p>
            Start with cold brew or matcha, choose a specialty flavor, or go straight
            for cold foam. Every drink is made to order.
          </p>
        </div>
        <Image src="/assets/bean.png" alt="The Dame Bean enjoying a drink" width={632} height={922} priority />
      </section>

      <nav className="dame-category-nav" aria-label="Menu categories">
        {categories.map((category) => (
          <a key={category.id} href={`#${category.id}`}>
            <span>{category.number}</span>{category.title}
          </a>
        ))}
      </nav>

      <div className="dame-menu-sections">
        {categories.map((category) => (
          <section id={category.id} key={category.id} className="dame-menu-section">
            <div className="dame-menu-section-heading">
              <span>{category.number}</span>
              <div>
                <h2>{category.title}</h2>
                <p>{category.note}</p>
              </div>
            </div>

            <div className="dame-menu-list">
              {category.items.map((item) => (
                <article key={item.name}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <strong>{item.price}</strong>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="dame-customize">
        <div>
          <p className="dame-kicker">Make it yours</p>
          <h2>Simple choices. No surprises.</h2>
        </div>
        <dl>
          <div><dt>Whole milk</dt><dd>Included</dd></div>
          <div><dt>Oat milk</dt><dd>+$1</dd></div>
          <div><dt>Almond milk</dt><dd>+$1</dd></div>
          <div><dt>Add cold foam</dt><dd>+$1</dd></div>
        </dl>
      </section>

      <section className="dame-page-cta">
        <p>Ready for one?</p>
        <h2>See where we&apos;re serving today.</h2>
        <Link className="dame-button dame-button-light" href="/#today">Find Dame today</Link>
      </section>

      <SiteFooter />
    </main>
  );
}
