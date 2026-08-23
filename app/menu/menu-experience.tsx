'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BeanStateImage from '../components/bean-state';
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
}: {
  items: SquareMenuItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('basics');
  const [selectedItem, setSelectedItem] = useState<SquareMenuItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const category = categories.find((entry) => entry.id === activeCategory) ?? categories[0];
  const visibleItems = items.filter((item) => item.category === activeCategory);

  useEffect(() => {
    if (!selectedItem) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedItem(null);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [selectedItem]);

  return (
    <>
      <section className="dame-menu-intro">
        <div>
          <p className="dame-kicker">Our menu · Nuestro menú</p>
          <h1>What sounds good?</h1>
          <p>20-hour cold brew, smooth matcha, and flavors inspired by home.</p>
          <p lang="es">Cold brew de 20 horas, matcha suave y sabores de casa.</p>
        </div>
        <div className="dame-menu-editorial" role="img" aria-label="Iced matcha and cold brew presented in warm sunlight">
          <div>
            <span>Dame</span>
            <strong>Menu</strong>
          </div>
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
                    className="dame-menu-card-trigger"
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${item.name} details`}
                    onClick={() => setSelectedItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedItem(item);
                      }
                    }}
                  >
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
                      <span className="dame-menu-card-view">View details <span aria-hidden="true">↗</span></span>
                    </div>
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
            <span>Made cold. Served with intention.</span>
            <Link className="dame-button" href="/order">
              Make it yours
            </Link>
          </footer>
        </div>
      </section>

      <section className="dame-customize">
        <div>
          <p className="dame-kicker">Make it yours</p>
          <h2>Simple choices. No surprises.</h2>
          <BeanStateImage state="pouring" className="dame-menu-page-bean" decorative />
        </div>
        <dl>
          <div><dt>Whole milk</dt><dd>Included</dd></div>
          <div><dt>Oat milk</dt><dd>+$1</dd></div>
          <div><dt>Almond milk</dt><dd>+$1</dd></div>
          <div><dt>Add cold foam</dt><dd>+$1</dd></div>
        </dl>
      </section>

      {selectedItem ? (
        <div
          className="dame-menu-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
          <section
            className={`dame-menu-detail ${selectedItem.imageUrl ? 'has-photo' : ''}`.trim()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dame-menu-detail-title"
            aria-describedby="dame-menu-detail-description"
          >
            <button
              ref={closeButtonRef}
              className="dame-menu-detail-close"
              type="button"
              aria-label="Close drink details"
              onClick={() => setSelectedItem(null)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>

            <div
              className="dame-menu-detail-photo"
              role={selectedItem.imageUrl ? 'img' : undefined}
              aria-label={selectedItem.imageUrl ? `${selectedItem.name} photo` : undefined}
              aria-hidden={selectedItem.imageUrl ? undefined : true}
              style={selectedItem.imageUrl
                ? { backgroundImage: `url(${JSON.stringify(selectedItem.imageUrl)})` }
                : undefined}
            >
              {selectedItem.imageUrl ? null : <span>DC</span>}
            </div>

            <div className="dame-menu-detail-copy">
              <p className="dame-kicker">{selectedItem.categoryLabel}</p>
              {selectedItem.isFeatured || selectedItem.isSeasonal ? (
                <div className="dame-menu-card-badges">
                  {selectedItem.isFeatured ? <span>Featured</span> : null}
                  {selectedItem.isSeasonal ? <span>Seasonal</span> : null}
                </div>
              ) : null}
              <h2 id="dame-menu-detail-title">{selectedItem.name}</h2>
              <strong className={selectedItem.isSoldOut ? 'is-sold-out' : ''}>
                {selectedItem.isSoldOut ? 'Sold out today' : displayPrice(selectedItem)}
              </strong>
              <p id="dame-menu-detail-description">
                {selectedItem.description || 'Made fresh and served cold.'}
              </p>
              {selectedItem.isSoldOut ? (
                <aside className="dame-menu-sold-out-note">
                  <BeanStateImage state="sold-out" decorative />
                  <p><strong>We brewed every last drop today.</strong><br />See what else the Bean recommends.</p>
                </aside>
              ) : null}
              {selectedItem.variations.length > 1 ? (
                <span className="dame-menu-variations">
                  Available as {selectedItem.variations.map((variation) => variation.name).join(' · ')}
                </span>
              ) : null}
              <div className="dame-menu-detail-actions">
                {selectedItem.isSoldOut ? null : <Link className="dame-button" href="/order">Order now</Link>}
                <button type="button" onClick={() => setSelectedItem(null)}>
                  Keep browsing
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
