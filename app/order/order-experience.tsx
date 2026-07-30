'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SquareMenuItem, SquareMenuModifierGroup } from '../lib/square';
import { getCustomerSession } from '../lib/customer-session';
import { readCustomerProfile } from '../lib/supabase-rest';

type CartLine = {
  id: string;
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
  onAdd,
}: {
  item: SquareMenuItem;
  disabled: boolean;
  onAdd: (line: Omit<CartLine, 'id' | 'quantity'>) => void;
}) {
  const [variationId, setVariationId] = useState(item.variations[0]?.id ?? '');
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const variation = item.variations.find((entry) => entry.id === variationId) ?? item.variations[0];

  const selectedModifiers = item.modifierGroups.flatMap((group) => {
    const selectedIds = selections[group.id] ?? [];
    return group.options.filter((option) => selectedIds.includes(option.id));
  });
  const requiredChoicesComplete = item.modifierGroups.every(
    (group) => (selections[group.id]?.length ?? 0) >= group.minSelected,
  );
  const unitAmount =
    (variation?.priceAmount ?? 0) +
    selectedModifiers.reduce((total, modifier) => total + modifier.priceAmount, 0);

  function toggleModifier(group: SquareMenuModifierGroup, modifierId: string) {
    setSelections((current) => {
      const selected = current[group.id] ?? [];
      if (group.selectionType === 'SINGLE') {
        return { ...current, [group.id]: selected.includes(modifierId) ? [] : [modifierId] };
      }
      if (selected.includes(modifierId)) {
        return { ...current, [group.id]: selected.filter((id) => id !== modifierId) };
      }
      if (group.maxSelected && selected.length >= group.maxSelected) return current;
      return { ...current, [group.id]: [...selected, modifierId] };
    });
  }

  return (
    <article className="dame-order-item">
      <div className="dame-order-item-heading">
        <div>
          <p>{item.categoryLabel}</p>
          <h3>{item.name}</h3>
        </div>
        <strong>{money(unitAmount)}</strong>
      </div>
      <p className="dame-order-description">{item.description || 'Made fresh and served cold.'}</p>

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

      {item.modifierGroups.map((group) => (
        <fieldset key={group.id} className="dame-order-modifiers">
          <legend>
            {group.name}
            {group.minSelected > 0 ? <span>Choose {group.minSelected}</span> : <span>Optional</span>}
          </legend>
          <div>
            {group.options.map((option) => {
              const checked = (selections[group.id] ?? []).includes(option.id);
              return (
                <label key={option.id}>
                  <input
                    type={group.selectionType === 'SINGLE' ? 'radio' : 'checkbox'}
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
        disabled={disabled || !variation || !requiredChoicesComplete}
        onClick={() => {
          if (!variation) return;
          onAdd({
            itemName: item.name,
            variationId: variation.id,
            variationName: variation.name,
            unitAmount,
            modifierIds: selectedModifiers.map((modifier) => modifier.id),
            modifierNames: selectedModifiers.map((modifier) => modifier.name),
          });
        }}
      >
        {disabled ? 'Ordering paused' : requiredChoicesComplete ? 'Add to order' : 'Finish choices'}
      </button>
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const orderingEnabled = location.isOpen && location.mobileOrdering && squareConfigured;
  const total = cart.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);

  useEffect(() => {
    getCustomerSession().then(async (session) => {
      if (!session) return;
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
        headers: { 'Content-Type': 'application/json' },
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
            Customize your drinks here, pay securely with Square, and pick everything
            up at today&apos;s live location.
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
          <strong>Square is being connected.</strong>
          <p>The menu is ready to preview, but checkout stays safely off until the private Square connection is complete.</p>
        </section>
      ) : !location.isOpen || !location.mobileOrdering ? (
        <section className="dame-order-notice">
          <strong>Pickup ordering is paused.</strong>
          <p>You can still plan what sounds good. Ordering will open from the Dame dashboard when the cart is ready.</p>
        </section>
      ) : null}

      <section className="dame-order-layout">
        <div className="dame-order-menu">
          <header>
            <p className="dame-kicker">Build your order</p>
            <h2>Made how you like it.</h2>
          </header>
          <div className="dame-order-grid">
            {items.map((item) => (
              <ItemOrderCard
                key={item.id}
                item={item}
                disabled={!orderingEnabled}
                onAdd={addLine}
              />
            ))}
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
            {submitting ? 'Opening Square…' : `Checkout securely · ${money(total)}`}
          </button>
          <p className="dame-square-note">
            Final tax and total are calculated by Square. Payment details stay with Square.
          </p>
          <Link href="/menu">Just browsing? View the menu →</Link>
        </aside>
      </section>
    </>
  );
}
