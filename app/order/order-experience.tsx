'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BeanStateImage from '../components/bean-state';
import type { SquareMenuItem, SquareMenuModifierGroup } from '../lib/square';
import { getCustomerSession } from '../lib/customer-session';
import {
  isExclusiveModifierGroup,
  orderingModifierGroups,
  requiredSelectionsForOrdering,
} from '../lib/order-modifiers';
import { readCustomerProfile } from '../lib/supabase-rest';

type CartLine = {
  id: string;
  itemId: string;
  itemName: string;
  variationId: string;
  variationName: string;
  unitAmount: number;
  quantity: number;
  modifierIds: string[];
  modifierNames: string[];
};

type Location = {
  title: string;
  address: string;
  hours: string;
  isOpen: boolean;
  mobileOrdering: boolean;
  waitMinutes: number;
  mapsUrl: string;
};

function money(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}

function ItemOrderCard({
  item,
  disabled,
  editingLine,
  onAdd,
  onUpdate,
  onCancelEdit,
}: {
  item: SquareMenuItem;
  disabled: boolean;
  editingLine?: CartLine;
  onAdd: (line: Omit<CartLine, 'id' | 'quantity'>) => void;
  onUpdate: (id: string, line: Omit<CartLine, 'id' | 'quantity'>) => void;
  onCancelEdit: () => void;
}) {
  const [customizing, setCustomizing] = useState(false);
  const [variationId, setVariationId] = useState(item.variations[0]?.id ?? '');
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const variation = item.variations.find((entry) => entry.id === variationId) ?? item.variations[0];
  const modifierGroups = orderingModifierGroups(item);

  useEffect(() => {
    if (!editingLine) return;

    const restoredSelections = orderingModifierGroups(item).reduce<Record<string, string[]>>(
      (groups, group) => {
        const optionIds = new Set(group.options.map((option) => option.id));
        groups[group.id] = editingLine.modifierIds.filter((id) => optionIds.has(id));
        return groups;
      },
      {},
    );

    setVariationId(editingLine.variationId);
    setSelections(restoredSelections);
    setCustomizing(true);
  }, [editingLine, item]);

  const selectedModifiers = modifierGroups.flatMap((group) => {
    const selectedIds = selections[group.id] ?? [];
    return group.options.filter((option) => selectedIds.includes(option.id));
  });
  const requiredChoicesComplete = modifierGroups.every(
    (group) =>
      (selections[group.id]?.length ?? 0) >=
      requiredSelectionsForOrdering(group),
  );
  const unitAmount =
    (variation?.priceAmount ?? 0) +
    selectedModifiers.reduce((total, modifier) => total + modifier.priceAmount, 0);

  function toggleModifier(group: SquareMenuModifierGroup, modifierId: string) {
    setSelections((current) => {
      const selected = current[group.id] ?? [];
      if (isExclusiveModifierGroup(group)) {
        return { ...current, [group.id]: selected.includes(modifierId) ? [] : [modifierId] };
      }
      if (selected.includes(modifierId)) {
        return { ...current, [group.id]: selected.filter((id) => id !== modifierId) };
      }
      return { ...current, [group.id]: [...selected, modifierId] };
    });
  }

  return (
    <article id={`order-item-${item.id}`} className={`dame-order-item ${customizing ? 'is-customizing' : ''} ${item.isSoldOut ? 'is-sold-out' : ''}`}>
      <div className="dame-order-item-heading">
        <div>
          <p>{item.categoryLabel}</p>
          <h3>{item.name}</h3>
        </div>
        <strong>{item.isSoldOut ? 'Sold out' : money(unitAmount)}</strong>
      </div>
      <p className="dame-order-description">{item.description || 'Made fresh and served cold.'}</p>

      <button
        className="dame-order-customize-toggle"
        type="button"
        aria-expanded={customizing}
        aria-controls={`customize-${item.id}`}
        onClick={() => {
          if (customizing && editingLine) onCancelEdit();
          setCustomizing((current) => !current);
        }}
      >
        <span>{customizing ? 'Hide options' : 'Customize'}</span>
        <span aria-hidden="true">{customizing ? '−' : '+'}</span>
      </button>

      {customizing ? (
        <div id={`customize-${item.id}`} className="dame-order-customizer">
          {item.variations.length > 1 ? (
            <label className="dame-order-select">
              <span>Choose one</span>
              <select value={variationId} onChange={(event) => setVariationId(event.target.value)}>
                {item.variations.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · {entry.priceLabel}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {modifierGroups.map((group) => (
            <fieldset key={group.id} className="dame-order-modifiers">
              <legend>
                {group.name}
                {isExclusiveModifierGroup(group) ? (
                  <span>Required · pick one</span>
                ) : (
                  <span>Optional · pick any</span>
                )}
              </legend>
              <div>
                {group.options.map((option) => {
                  const checked = (selections[group.id] ?? []).includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`${checked ? 'is-selected' : ''} ${isExclusiveModifierGroup(group) ? 'is-exclusive' : ''}`.trim()}
                    >
                      <input
                        type="checkbox"
                        name={`${item.id}-${group.id}`}
                        checked={checked}
                        onChange={() => toggleModifier(group, option.id)}
                      />
                      <span>{option.name}</span>
                      <small>{option.priceLabel}</small>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <button
            className="dame-button"
            type="button"
            disabled={disabled || item.isSoldOut || !variation || !requiredChoicesComplete}
            onClick={() => {
              if (!variation) return;
              const nextLine = {
                itemId: item.id,
                itemName: item.name,
                variationId: variation.id,
                variationName: variation.name,
                unitAmount,
                modifierIds: selectedModifiers.map((modifier) => modifier.id),
                modifierNames: selectedModifiers.map((modifier) => modifier.name),
              };
              if (editingLine) {
                onUpdate(editingLine.id, nextLine);
              } else {
                onAdd(nextLine);
              }
              setCustomizing(false);
            }}
          >
            {item.isSoldOut
              ? 'Sold out today'
              : disabled
              ? 'Ordering paused'
              : requiredChoicesComplete
                ? `${editingLine ? 'Save changes' : 'Add to order'} · ${money(unitAmount)}`
                : 'Finish choices'}
          </button>
          {editingLine ? (
            <button
              className="dame-order-cancel-edit"
              type="button"
              onClick={() => {
                onCancelEdit();
                setCustomizing(false);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function OrderExperience({
  items,
  squareConfigured,
  location,
}: {
  items: SquareMenuItem[];
  squareConfigured: boolean;
  location: Location;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SquareMenuItem['category']>('foam');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [rewardsAccessToken, setRewardsAccessToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const orderingEnabled = location.isOpen && location.mobileOrdering && squareConfigured;
  const total = cart.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
  const groupOrder: Record<SquareMenuItem['category'], number> = {
    foam: 0,
    specialty: 1,
    basics: 2,
    food: 3,
  };
  const itemGroups = items.reduce<Array<{ id: SquareMenuItem['category']; label: string; items: SquareMenuItem[] }>>(
    (groups, item) => {
      const label = item.categoryLabel || 'More from Dame';
      const existingGroup = groups.find((group) => group.id === item.category);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ id: item.category, label, items: [item] });
      }
      return groups;
    },
    [],
  ).sort((a, b) => groupOrder[a.id] - groupOrder[b.id]);
  const activeGroup = itemGroups.find((group) => group.id === activeCategory) ?? itemGroups[0];

  useEffect(() => {
    getCustomerSession().then(async (session) => {
      if (!session) return;
      setRewardsAccessToken(session.access_token);
      setEmail(session.user.email ?? '');
      try {
        const profile = await readCustomerProfile(session.access_token, session.user.id);
        setName(profile.first_name);
        setPhone(profile.phone ?? '');
      } catch {
        // Ordering remains available even if a saved rewards profile cannot load.
      }
    });
  }, []);

  function addLine(line: Omit<CartLine, 'id' | 'quantity'>) {
    setCart((current) => [
      ...current,
      {
        ...line,
        id: crypto.randomUUID(),
        quantity: 1,
      },
    ]);
  }

  function updateLine(id: string, line: Omit<CartLine, 'id' | 'quantity'>) {
    setCart((current) =>
      current.map((existing) =>
        existing.id === id
          ? { ...line, id: existing.id, quantity: existing.quantity }
          : existing,
      ),
    );
    setEditingLineId(null);
  }

  function editLine(line: CartLine) {
    const item = items.find((entry) => entry.id === line.itemId);
    if (item) setActiveCategory(item.category);
    setEditingLineId(line.id);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(`order-item-${line.itemId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    });
  }

  function changeQuantity(id: string, change: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.id === id ? { ...line, quantity: Math.min(12, line.quantity + change) } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function checkout() {
    setError('');
    if (!cart.length) {
      setError('Add something good before checking out.');
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Add your name, email, and phone number so we know who is picking up.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/square/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(rewardsAccessToken
            ? { Authorization: `Bearer ${rewardsAccessToken}` }
            : {}),
        },
        body: JSON.stringify({
          lines: cart.map((line) => ({
            variationId: line.variationId,
            quantity: line.quantity,
            modifierIds: line.modifierIds,
          })),
          customer: { name, email, phone, note },
        }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'Checkout is temporarily unavailable.');
      }
      window.location.assign(payload.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout is temporarily unavailable.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="dame-order-hero">
        <div>
          <p className="dame-kicker">Pickup · Today only</p>
          <h1>Order where we&apos;re brewing.</h1>
          <p>
            Choose your favorite, make it yours, and we&apos;ll have it waiting at
            today&apos;s Dame location.
          </p>
        </div>
        <aside>
          <div>
            <span className={`dame-live-dot ${location.isOpen ? '' : 'is-closed'}`} />
            {location.isOpen ? 'Open today' : 'Closed right now'}
          </div>
          <h2>{location.title}</h2>
          <p>{location.address}</p>
          <dl>
            <div><dt>Hours</dt><dd>{location.hours}</dd></div>
            <div><dt>Wait</dt><dd>{location.isOpen ? `About ${location.waitMinutes} min` : 'Unavailable'}</dd></div>
          </dl>
          <a href={location.mapsUrl} target="_blank" rel="noreferrer">Get directions ↗</a>
        </aside>
      </section>

      {!squareConfigured ? (
        <section className="dame-order-notice">
          <strong>Online pickup is almost ready.</strong>
          <p>Explore what sounds good today. We&apos;ll open checkout as soon as the ordering bar is ready.</p>
        </section>
      ) : !location.isOpen || !location.mobileOrdering ? (
        <section className="dame-order-notice dame-order-closed-notice">
          <BeanStateImage state="sleeping" className="dame-order-closed-bean" />
          <div>
            <strong>We&apos;re resting right now.</strong>
            <p>We&apos;ll see you when the cart is brewing again. You can still plan what sounds good.</p>
          </div>
        </section>
      ) : null}

      <section className="dame-order-layout">
        <div className="dame-order-menu">
          <header>
            <p className="dame-kicker">Build your order</p>
            <h2>Made how you like it.</h2>
          </header>
          <div className="dame-menu-tabs dame-order-category-tabs" role="tablist" aria-label="Order menu sections">
            {itemGroups.map((group, index) => (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={activeGroup?.id === group.id}
                aria-controls="dame-order-category-panel"
                onClick={() => {
                  setEditingLineId(null);
                  setActiveCategory(group.id);
                }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {group.label}
              </button>
            ))}
          </div>
          <div className="dame-order-groups">
            {activeGroup ? (
              <section
                key={activeGroup.id}
                id="dame-order-category-panel"
                className="dame-order-group dame-order-category-panel"
                role="tabpanel"
                aria-labelledby={`order-group-${activeGroup.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
              >
                <header>
                  <p>Choose your Dame</p>
                  <h3 id={`order-group-${activeGroup.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}>{activeGroup.label}</h3>
                </header>
                <div className="dame-order-grid">
                  {activeGroup.items.map((item) => (
                    <ItemOrderCard
                      key={item.id}
                      item={item}
                      disabled={!orderingEnabled}
                      editingLine={cart.find((line) => line.id === editingLineId && line.itemId === item.id)}
                      onAdd={addLine}
                      onUpdate={updateLine}
                      onCancelEdit={() => setEditingLineId(null)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <aside className="dame-cart">
          <div className="dame-cart-heading">
            <div>
              <p>Your pickup</p>
              <h2>{cart.length ? `${cart.length} item${cart.length === 1 ? '' : 's'}` : 'Start here'}</h2>
            </div>
            <strong>{money(total)}</strong>
          </div>

          {cart.length ? (
            <div className="dame-cart-lines">
              {cart.map((line) => (
                <article key={line.id}>
                  <div>
                    <h3>{line.itemName}</h3>
                    {line.variationName !== 'Regular' ? <p>{line.variationName}</p> : null}
                    {line.modifierNames.length ? <p>{line.modifierNames.join(' · ')}</p> : null}
                    <button className="dame-cart-edit" type="button" onClick={() => editLine(line)}>
                      Edit
                    </button>
                  </div>
                  <div className="dame-quantity">
                    <button type="button" onClick={() => changeQuantity(line.id, -1)} aria-label={`Remove one ${line.itemName}`}>−</button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(line.id, 1)} aria-label={`Add one ${line.itemName}`}>+</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="dame-cart-empty">Choose a drink and it&apos;ll show up here.</p>
          )}

          <div className="dame-pickup-fields">
            <label>
              <span>Pickup name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              <span>Mobile number</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" placeholder="(555) 555-5555" />
            </label>
            <label>
              <span>Order note · optional</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Anything we should know?" />
            </label>
          </div>

          {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}

          <button
            className="dame-button dame-checkout-button"
            type="button"
            disabled={!orderingEnabled || submitting}
            onClick={checkout}
          >
            {submitting ? 'Preparing checkout…' : `Checkout securely · ${money(total)}`}
          </button>
          <p className="dame-square-note">
            Final tax appears at secure checkout. Dame never receives or stores your card details.
          </p>
          <p className="dame-square-note">
            {rewardsAccessToken ? (
              <>This eligible purchase earns 10 Dame points per $1.</>
            ) : (
              <>Ordering without an account? Keep your receipt and <Link href="/rewards/claim">save your points afterward.</Link></>
            )}
          </p>
          <Link href="/menu">Just browsing? View the menu →</Link>
        </aside>
      </section>
    </>
  );
}
