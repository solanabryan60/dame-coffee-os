'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
import {
  createInventoryItemForAdmin,
  deleteInventoryItemForAdmin,
  listInventoryItemsForAdmin,
  updateInventoryItemForAdmin,
  type InventoryCategory,
  type InventoryItem,
} from '../../lib/supabase-rest';

const CATEGORIES: Array<{ value: InventoryCategory; label: string }> = [
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'milk', label: 'Milk' },
  { value: 'packaging', label: 'Cups & packaging' },
  { value: 'food', label: 'Food' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'other', label: 'Other' },
];

type StockFilter = 'all' | 'attention' | 'out';
type ItemDraft = Pick<InventoryItem, 'quantity' | 'low_stock_at' | 'notes'>;

function numeric(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusFor(item: InventoryItem) {
  const quantity = numeric(item.quantity);
  if (quantity <= 0) return 'out';
  if (quantity <= numeric(item.low_stock_at)) return 'low';
  return 'ready';
}

function categoryLabel(category: InventoryCategory) {
  return CATEGORIES.find((option) => option.value === category)?.label ?? 'Other';
}

function formatQuantity(value: number | string) {
  const amount = numeric(value);
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('ingredients');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('units');
  const [lowStockAt, setLowStockAt] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const rows = await listInventoryItemsForAdmin(token);
        if (!active) return;
        setItems(rows);
        setDrafts(Object.fromEntries(rows.map((item) => [item.id, {
          quantity: numeric(item.quantity),
          low_stock_at: numeric(item.low_stock_at),
          notes: item.notes,
        }])));
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load inventory.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  const summary = useMemo(() => ({
    out: items.filter((item) => statusFor(item) === 'out').length,
    low: items.filter((item) => statusFor(item) === 'low').length,
    ready: items.filter((item) => statusFor(item) === 'ready').length,
  }), [items]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const status = statusFor(item);
      const matchesFilter = filter === 'all'
        || (filter === 'attention' && (status === 'out' || status === 'low'))
        || (filter === 'out' && status === 'out');
      const matchesSearch = !query
        || item.name.toLowerCase().includes(query)
        || item.category.toLowerCase().includes(query)
        || item.notes.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, items, search]);

  function replaceItem(updated: InventoryItem) {
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    setDrafts((current) => ({
      ...current,
      [updated.id]: {
        quantity: numeric(updated.quantity),
        low_stock_at: numeric(updated.low_stock_at),
        notes: updated.notes,
      },
    }));
  }

  function updateDraft(item: InventoryItem, patch: Partial<ItemDraft>) {
    setDrafts((current) => ({
      ...current,
      [item.id]: {
        quantity: numeric(current[item.id]?.quantity ?? item.quantity),
        low_stock_at: numeric(current[item.id]?.low_stock_at ?? item.low_stock_at),
        notes: current[item.id]?.notes ?? item.notes,
        ...patch,
      },
    }));
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setAdding(true); setMessage(''); setError('');
    try {
      const created = await createInventoryItemForAdmin(token, {
        name: name.trim(),
        category,
        quantity: Math.max(0, numeric(quantity)),
        unit: unit.trim(),
        low_stock_at: Math.max(0, numeric(lowStockAt)),
        notes: notes.trim(),
      });
      setItems((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setDrafts((current) => ({ ...current, [created.id]: {
        quantity: numeric(created.quantity), low_stock_at: numeric(created.low_stock_at), notes: created.notes,
      } }));
      setName(''); setCategory('ingredients'); setQuantity('0'); setUnit('units'); setLowStockAt('0'); setNotes('');
      setMessage(`${created.name} is now being tracked.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession(); router.replace('/admin/login'); return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not add that inventory item.');
    } finally {
      setAdding(false);
    }
  }

  async function saveItem(item: InventoryItem, overrideQuantity?: number) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    const draft = drafts[item.id] ?? item;
    const nextQuantity = Math.max(0, overrideQuantity ?? numeric(draft.quantity));
    setSavingId(item.id); setMessage(''); setError('');
    try {
      const updated = await updateInventoryItemForAdmin(token, item.id, {
        quantity: nextQuantity,
        low_stock_at: Math.max(0, numeric(draft.low_stock_at)),
        notes: draft.notes.trim(),
      });
      replaceItem(updated);
      setMessage(`${updated.name} updated to ${formatQuantity(updated.quantity)} ${updated.unit}.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession(); router.replace('/admin/login'); return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not update that inventory item.');
    } finally {
      setSavingId(null);
    }
  }

  async function removeItem(item: InventoryItem) {
    if (!window.confirm(`Stop tracking ${item.name}? This removes its saved count.`)) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSavingId(item.id); setMessage(''); setError('');
    try {
      await deleteInventoryItemForAdmin(token, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(`${item.name} removed from inventory.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not remove that inventory item.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="admin-shell admin-inventory-shell">
      <AdminHeader title="Inventory" />

      <section className="admin-card admin-inventory-hero">
        <div className="admin-section-heading">
          <div><p className="eyebrow">DAME STOCKROOM</p><h2>Know what needs attention before service.</h2></div>
          <p>Track ingredients, milk, cups, food, and merchandise here. Your Square menu and sold-out controls stay separate.</p>
        </div>
        <div className="admin-inventory-summary" aria-label="Inventory summary">
          <button type="button" className={filter === 'out' ? 'is-active is-out' : 'is-out'} onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}>
            <strong>{summary.out}</strong><span>Out</span>
          </button>
          <button type="button" className={filter === 'attention' ? 'is-active is-low' : 'is-low'} onClick={() => setFilter(filter === 'attention' ? 'all' : 'attention')}>
            <strong>{summary.low}</strong><span>Low</span>
          </button>
          <button type="button" onClick={() => setFilter('all')}>
            <strong>{summary.ready}</strong><span>Ready</span>
          </button>
        </div>
        {message ? <p className="admin-success" role="status">{message}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
      </section>

      <section className="admin-card admin-inventory-add">
        <div className="admin-section-heading">
          <div><p className="eyebrow">ADD A SUPPLY</p><h2>Start tracking something.</h2></div>
          <p>Examples: matcha powder, oat milk, 16 oz cups, croissants, or Dame shirts.</p>
        </div>
        <form className="admin-form admin-grid" onSubmit={addItem}>
          <label className="admin-wide">Item name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Oat milk" maxLength={100} required /></label>
          <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as InventoryCategory)}>{CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label>Unit<input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="cartons" maxLength={30} required /></label>
          <label>Current amount<input type="number" min="0" step="0.01" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label>Warn me at<input type="number" min="0" step="0.01" inputMode="decimal" value={lowStockAt} onChange={(event) => setLowStockAt(event.target.value)} required /></label>
          <label className="admin-wide">Notes<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Brand, size, supplier, or restock reminder" maxLength={500} /></label>
          <button className="pill solid admin-wide" type="submit" disabled={adding}>{adding ? 'Adding…' : 'Track this item'}</button>
        </form>
      </section>

      <section className="admin-card admin-inventory-list">
        <div className="admin-inventory-tools">
          <div><p className="eyebrow">CURRENT STOCK</p><h2>{filter === 'all' ? 'Everything you track.' : filter === 'out' ? 'Out of stock.' : 'Needs attention.'}</h2></div>
          <label><span className="sr-only">Search inventory</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stock…" /></label>
        </div>

        {loading ? <p className="admin-empty-state">Loading the stockroom…</p> : null}
        {!loading && !items.length ? <p className="admin-empty-state">Nothing is being tracked yet. Add your first supply above.</p> : null}
        {!loading && items.length && !visibleItems.length ? <p className="admin-empty-state">Nothing matches this view.</p> : null}

        <div className="admin-inventory-grid">
          {visibleItems.map((item) => {
            const status = statusFor(item);
            const draft = drafts[item.id] ?? item;
            const busy = savingId === item.id;
            return (
              <article className={`admin-inventory-item is-${status}`} key={item.id}>
                <header>
                  <div><span>{status === 'out' ? 'Out of stock' : status === 'low' ? 'Running low' : 'Stocked'}</span><h3>{item.name}</h3><p>{categoryLabel(item.category)}</p></div>
                  <strong>{formatQuantity(draft.quantity)} <small>{item.unit}</small></strong>
                </header>
                <div className="admin-stock-stepper" aria-label={`Change ${item.name} quantity`}>
                  <button type="button" disabled={busy || numeric(draft.quantity) <= 0} onClick={() => void saveItem(item, Math.max(0, numeric(draft.quantity) - 1))} aria-label={`Remove one ${item.unit} of ${item.name}`}>−</button>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={draft.quantity} onChange={(event) => updateDraft(item, { quantity: numeric(event.target.value) })} aria-label={`${item.name} current quantity`} />
                  <button type="button" disabled={busy} onClick={() => void saveItem(item, numeric(draft.quantity) + 1)} aria-label={`Add one ${item.unit} of ${item.name}`}>+</button>
                </div>
                <div className="admin-inventory-details">
                  <label>Low-stock warning<input type="number" min="0" step="0.01" inputMode="decimal" value={draft.low_stock_at} onChange={(event) => updateDraft(item, { low_stock_at: numeric(event.target.value) })} /><span>{item.unit}</span></label>
                  <label>Notes<textarea rows={2} maxLength={500} value={draft.notes} onChange={(event) => updateDraft(item, { notes: event.target.value })} placeholder="Supplier or restock note" /></label>
                </div>
                <footer>
                  <button className="pill solid" type="button" disabled={busy} onClick={() => void saveItem(item)}>{busy ? 'Saving…' : 'Save changes'}</button>
                  <button className="admin-text-button" type="button" disabled={busy} onClick={() => void removeItem(item)}>Remove</button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
