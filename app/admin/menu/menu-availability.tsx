'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SquareMenuItem } from '../../lib/square';
import {
  listMenuAvailabilityForAdmin,
  setMenuItemSoldOut,
  type MenuItemAvailability,
} from '../../lib/supabase-rest';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
const CATEGORY_ORDER: Record<SquareMenuItem['category'], number> = {
  foam: 0,
  specialty: 1,
  basics: 2,
  food: 3,
};

export default function AdminMenuAvailability({ items }: { items: SquareMenuItem[] }) {
  const router = useRouter();
  const [availability, setAvailability] = useState<MenuItemAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const soldOutItemIds = useMemo(() => {
    const currentItemIds = new Set(items.map((item) => item.id));
    return new Set(
      availability
        .filter((entry) => entry.is_sold_out && currentItemIds.has(entry.square_item_id))
        .map((entry) => entry.square_item_id),
    );
  }, [availability, items]);
  const groups = useMemo(() => {
    return items.reduce<Array<{ id: SquareMenuItem['category']; label: string; items: SquareMenuItem[] }>>(
      (result, item) => {
        const existing = result.find((group) => group.id === item.category);
        if (existing) existing.items.push(item);
        else result.push({ id: item.category, label: item.categoryLabel, items: [item] });
        return result;
      },
      [],
    ).sort((a, b) => CATEGORY_ORDER[a.id] - CATEGORY_ORDER[b.id]);
  }, [items]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const rows = await listMenuAvailabilityForAdmin(token);
        if (active) {
          setAvailability(rows);
          setError('');
        }
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load menu availability.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function toggleItem(item: SquareMenuItem) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    const nextSoldOut = !soldOutItemIds.has(item.id);
    setSavingId(item.id);
    setMessage('');
    setError('');
    try {
      const updated = await setMenuItemSoldOut(token, item.id, nextSoldOut);
      setAvailability((current) => [
        updated,
        ...current.filter((entry) => entry.square_item_id !== item.id),
      ]);
      setMessage(`${item.name} is now ${nextSoldOut ? 'sold out' : 'available'} everywhere.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not update that item.');
    } finally {
      setSavingId(null);
    }
  }

  function logout() {
    clearAdminSession();
    router.replace('/admin/login');
  }

  return (
    <main className="admin-shell admin-menu-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">DAME COFFEE OS</p>
          <h1>Menu availability</h1>
        </div>
        <div className="admin-top-actions">
          <Link className="pill solid" href="/admin/orders">Pickup orders</Link>
          <Link className="pill ghost" href="/admin">Control center</Link>
          <Link className="pill ghost" href="/order" target="_blank">View ordering</Link>
          <button className="pill ghost" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="admin-card admin-menu-overview">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Today&apos;s menu</p>
            <h2>One tap. Updated everywhere.</h2>
          </div>
          <p>Mark an item sold out here and customers will see it immediately on both the menu and pickup-ordering pages.</p>
        </div>
        <div className="admin-catering-summary" aria-label="Menu availability summary">
          <article><strong>{items.length - soldOutItemIds.size}</strong><span>Available</span></article>
          <article><strong>{soldOutItemIds.size}</strong><span>Sold out</span></article>
        </div>
        {message ? <p className="admin-success" role="status">{message}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
      </section>

      {loading ? (
        <section className="admin-card"><p>Loading today&apos;s menu…</p></section>
      ) : groups.map((group) => (
        <section className="admin-card admin-menu-group" key={group.id}>
          <header>
            <p className="eyebrow">Menu group</p>
            <h2>{group.label}</h2>
          </header>
          <div className="admin-menu-grid">
            {group.items.map((item) => {
              const isSoldOut = soldOutItemIds.has(item.id);
              return (
                <article className={isSoldOut ? 'is-sold-out' : ''} key={item.id}>
                  <div>
                    <span>{isSoldOut ? 'Sold out' : 'Available'}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description || 'Made fresh and served cold.'}</p>
                  </div>
                  <button
                    type="button"
                    className={isSoldOut ? 'pill solid' : 'pill ghost'}
                    disabled={savingId === item.id}
                    onClick={() => toggleItem(item)}
                  >
                    {savingId === item.id
                      ? 'Updating…'
                      : isSoldOut
                        ? 'Make available'
                        : 'Mark sold out'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
