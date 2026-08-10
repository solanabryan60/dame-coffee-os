'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { MenuCategoryId, SquareMenuItem } from '../lib/square';

const categories: Array<{
  id: MenuCategoryId;
  number: string;
  title: string;
  note: string;
}> = [
  {
    id: 'basics',
    number: '01',
    title: 'The Basics',
    note: 'Cold brew and matcha, simple and made your way.',
  },
  {
    id: 'specialty',
    number: '02',
    title: 'Specialty Drinks',
    note: 'House flavors without cold foam.',
  },
  {
    id: 'foam',
    number: '03',
    title: 'Cold Foam Lovers',
    note: 'These drinks already come finished with cold foam.',
  },
  {
    id: 'food',
    number: '04',
    title: 'Food Items',
    note: 'Fresh pairings available while supplies last.',
  },
];

function displayPrice(item: SquareMenuItem) {
  const prices = item.variations.map((variation) => variation.priceAmount);
  const lowest = Math.min(...prices);
  const variation = item.variations.find((entry) => entry.priceAmount === lowest);
  return item.variations.length > 1 ? `from ${variation?.priceLabel}` : variation?.priceLabel;
}

export default function MenuExperience({
  items,
  syncedWithSquare,
}: {
  items: SquareMenuItem[];
  syncedWithSquare: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('basics');
  const category = categories.find((entry) => entry.id === activeCategory) ?? categories[0];
  const visibleItems = items.filter((item) => item.category === activeCategory);

  return (
    <>
      <section className="dame-menu-intro">
        <div>
          <p className="dame-kicker">Cold drinks · Made to order</p>
          <h1>What sounds good?</h1>
          <p>
            Pick a section and take your time. Our menu stays connected to Square, so
            prices and availability can follow the same catalog we use at the cart.
          </p>
        </div>
        <div className="dame-menu-stamp" aria-hidden="true">
          <span>Dame</span>
          <strong>Menu</strong>
        </div>
      </section>

      <section className="dame-menu-browser" aria-labelledby="menu-category-title">
        <div className="dame-menu-tabs" role="tablist" aria-label="Menu sections">
          {categories.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === entry.id}
              aria-controls="dame-menu-panel"
              onClick={() => setActiveCategory(entry.id)}
            >
              <span>{entry.number}</span>
              {entry.title}
            </button>
          ))}
        </div>

        <div
          key={activeCategory}
          id="dame-menu-panel"
          className="dame-menu-panel"
          role="tabpanel"
        >
          <header>
            <div>
              <p className="dame-kicker">{category.number}</p>
              <h2 id="menu-category-title">{category.title}</h2>
            </div>
            <p>{category.note}</p>
          </header>

          {visibleItems.length ? (
            <div className="dame-menu-card-grid">
              {visibleItems.map((item) => (
                <article key={item.id} className={`dame-menu-card ${item.isSoldOut ? 'is-sold-out' : ''} ${item.isFeatured ? 'is-featured' : ''} ${item.imageUrl ? 'has-photo' : ''}`.trim()}>
                  <div
                    className={`dame-menu-card-mark ${item.imageUrl ? 'has-photo' : ''}`.trim()}
                    role={item.imageUrl ? 'img' : undefined}
                    aria-label={item.imageUrl ? `${item.name} photo` : undefined}
                    aria-hidden={item.imageUrl ? undefined : true}
                    style={item.imageUrl ? { backgroundImage: `url(${JSON.stringify(item.imageUrl)})` } : undefined}
                  >
                    {item.imageUrl ? null : <span>DC</span>}
                  </div>
                  <div>
                    {item.isFeatured || item.isSeasonal ? (
                      <div className="dame-menu-card-badges">
                        {item.isFeatured ? <span>Featured</span> : null}
                        {item.isSeasonal ? <span>Seasonal</span> : null}
                      </div>
                    ) : null}
                    <div className="dame-menu-card-title">
                      <h3>{item.name}</h3>
                      <strong>{item.isSoldOut ? 'Sold out today' : displayPrice(item)}</strong>
                    </div>
                    <p>{item.description || 'Made fresh and served cold.'}</p>
                    {item.variations.length > 1 ? (
                      <span className="dame-menu-variations">
                        {item.variations.map((variation) => variation.name).join(' · ')}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dame-menu-empty">
              <p>We&apos;re building this part of the menu.</p>
              <span>Check back for the next Dame addition.</span>
            </div>
          )}

          <footer>
            <span>{syncedWithSquare ? 'Live menu from Square' : 'Preview menu while Square connects'}</span>
            <Link className="dame-button" href="/order">
              Order pickup
            </Link>
          </footer>
        </div>
      </section>

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
    </>
  );
}
