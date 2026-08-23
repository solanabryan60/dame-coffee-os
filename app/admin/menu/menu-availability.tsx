'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import type { SquareMenuItem } from '../../lib/square';
import {
  listMenuAvailabilityForAdmin,
  listMenuPresentationForAdmin,
  setMenuItemPresentation,
  setMenuItemSoldOut,
  uploadMenuPhoto,
  type MenuItemAvailability,
  type MenuItemPresentation,
} from '../../lib/supabase-rest';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
import AdminHeader from '../admin-header';

const CATEGORY_ORDER: Record<SquareMenuItem['category'], number> = {
  foam: 0,
  specialty: 1,
  basics: 2,
  food: 3,
};

type PresentationDraft = {
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  isSeasonal: boolean;
  isHidden: boolean;
};

function baseDraft(item: SquareMenuItem): PresentationDraft {
  return {
    description: item.description,
    imageUrl: item.imageUrl ?? '',
    isFeatured: false,
    isSeasonal: false,
    isHidden: false,
  };
}

function draftFromPresentation(
  item: SquareMenuItem,
  presentation?: MenuItemPresentation,
): PresentationDraft {
  return {
    description: presentation?.description ?? item.description,
    imageUrl: presentation?.image_url ?? item.imageUrl ?? '',
    isFeatured: presentation?.is_featured ?? false,
    isSeasonal: presentation?.is_seasonal ?? false,
    isHidden: presentation?.is_hidden ?? false,
  };
}

function validateImageUrl(value: string) {
  if (!value.trim()) return;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Enter a complete photo link beginning with https://.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Photo links must start with https:// or http://.');
  }
}

export default function AdminMenuAvailability({ items }: { items: SquareMenuItem[] }) {
  const router = useRouter();
  const [availability, setAvailability] = useState<MenuItemAvailability[]>([]);
  const [presentation, setPresentation] = useState<MenuItemPresentation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PresentationDraft>>(
    Object.fromEntries(items.map((item) => [item.id, baseDraft(item)])),
  );
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  const hiddenItemIds = useMemo(
    () => new Set(presentation.filter((entry) => entry.is_hidden).map((entry) => entry.square_item_id)),
    [presentation],
  );

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
        const [availabilityRows, presentationRows] = await Promise.all([
          listMenuAvailabilityForAdmin(token),
          listMenuPresentationForAdmin(token).catch(() => []),
        ]);
        if (active) {
          const presentationById = new Map(
            presentationRows.map((entry) => [entry.square_item_id, entry]),
          );
          setAvailability(availabilityRows);
          setPresentation(presentationRows);
          setDrafts(Object.fromEntries(items.map((item) => [
            item.id,
            draftFromPresentation(item, presentationById.get(item.id)),
          ])));
          setError('');
        }
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the menu studio.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [items, router]);

  function updateDraft(item: SquareMenuItem, patch: Partial<PresentationDraft>) {
    setDrafts((current) => ({
      ...current,
      [item.id]: { ...(current[item.id] ?? baseDraft(item)), ...patch },
    }));
  }

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

  async function savePresentation(event: FormEvent<HTMLFormElement>, item: SquareMenuItem) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    const draft = drafts[item.id] ?? baseDraft(item);
    setSavingId(item.id);
    setMessage('');
    setError('');
    try {
      validateImageUrl(draft.imageUrl);
      const updated = await setMenuItemPresentation(token, {
        square_item_id: item.id,
        description: draft.description,
        image_url: draft.imageUrl,
        is_featured: draft.isFeatured,
        is_seasonal: draft.isSeasonal,
        is_hidden: draft.isHidden,
      });
      setPresentation((current) => [
        updated,
        ...current.filter((entry) => entry.square_item_id !== item.id),
      ]);
      setDrafts((current) => ({
        ...current,
        [item.id]: draftFromPresentation(item, updated),
      }));
      setMessage(`${item.name}'s website details are updated.`);
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

  async function uploadPhoto(item: SquareMenuItem, file?: File) {
    if (!file) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    const draft = drafts[item.id] ?? baseDraft(item);
    setSavingId(item.id);
    setDraggingId(null);
    setMessage('');
    setError('');
    try {
      const imageUrl = await uploadMenuPhoto(token, item.id, file);
      const updated = await setMenuItemPresentation(token, {
        square_item_id: item.id,
        description: draft.description,
        image_url: imageUrl,
        is_featured: draft.isFeatured,
        is_seasonal: draft.isSeasonal,
        is_hidden: draft.isHidden,
      });
      setPresentation((current) => [
        updated,
        ...current.filter((entry) => entry.square_item_id !== item.id),
      ]);
      setDrafts((current) => ({
        ...current,
        [item.id]: draftFromPresentation(item, updated),
      }));
      setMessage(`${item.name}'s photo is uploaded and live in the Menu Studio.`);
    } catch (uploadError) {
      if (isAdminSessionError(uploadError)) {
        clearAdminSession();
        router.replace('/admin/login');
        return;
      }
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload that photo.');
    } finally {
      setSavingId(null);
    }
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>, item: SquareMenuItem) {
    void uploadPhoto(item, event.target.files?.[0]);
    event.target.value = '';
  }

  function dropPhoto(event: DragEvent<HTMLLabelElement>, item: SquareMenuItem) {
    event.preventDefault();
    void uploadPhoto(item, event.dataTransfer.files?.[0]);
  }

  return (
    <main className="admin-shell admin-menu-shell">
      <AdminHeader title="Menu studio">
        <Link className="pill solid" href="/menu" target="_blank">View menu</Link>
      </AdminHeader>

      <section className="admin-card admin-menu-overview">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Square menu + Dame presentation</p>
            <h2>Sell in Square. Style it here.</h2>
          </div>
          <p>Square safely controls products, prices, options, and checkout. Dame controls the website photo, story, badges, visibility, and today&apos;s sold-out status.</p>
        </div>
        <div className="admin-catering-summary" aria-label="Menu summary">
          <article><strong>{items.length - soldOutItemIds.size}</strong><span>Available</span></article>
          <article><strong>{soldOutItemIds.size}</strong><span>Sold out</span></article>
          <article><strong>{hiddenItemIds.size}</strong><span>Hidden online</span></article>
        </div>
        <div className="admin-menu-actions">
          <a className="pill ghost" href="https://app.squareup.com/dashboard/items/library" target="_blank" rel="noreferrer">Add items or edit prices in Square</a>
          <Link className="pill ghost" href="/order" target="_blank">View pickup ordering</Link>
        </div>
        {message ? <p className="admin-success" role="status">{message}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
      </section>

      {loading ? (
        <section className="admin-card"><p>Loading the menu studio…</p></section>
      ) : groups.map((group) => (
        <section className="admin-card admin-menu-group" key={group.id}>
          <header>
            <p className="eyebrow">Menu group</p>
            <h2>{group.label}</h2>
          </header>
          <div className="admin-menu-grid">
            {group.items.map((item) => {
              const isSoldOut = soldOutItemIds.has(item.id);
              const draft = drafts[item.id] ?? baseDraft(item);
              const busy = savingId === item.id;
              const price = item.variations[0]?.priceLabel ?? 'Square price';
              return (
                <article className={`${isSoldOut ? 'is-sold-out ' : ''}${draft.isHidden ? 'is-hidden' : ''}`.trim()} key={item.id}>
                  <header className="admin-menu-item-heading">
                    <div>
                      <span>{draft.isHidden ? 'Hidden online' : isSoldOut ? 'Sold out' : 'Available'}</span>
                      <h3>{item.name}</h3>
                      <p>{price} · Price and options managed in Square</p>
                    </div>
                    {draft.imageUrl ? (
                      <div
                        className="admin-menu-photo"
                        role="img"
                        aria-label={`${item.name} menu photo`}
                        style={{ backgroundImage: `url(${JSON.stringify(draft.imageUrl)})` }}
                      />
                    ) : null}
                  </header>

                  <form className="admin-menu-presentation-form" onSubmit={(event) => void savePresentation(event, item)}>
                    <label
                      className={`admin-menu-photo-drop${draggingId === item.id ? ' is-dragging' : ''}`}
                      onDragEnter={(event) => { event.preventDefault(); setDraggingId(item.id); }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingId(null);
                      }}
                      onDrop={(event) => dropPhoto(event, item)}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        onChange={(event) => choosePhoto(event, item)}
                      />
                      <strong>{busy ? 'Uploading photo…' : 'Drop a drink photo here'}</strong>
                      <span>or tap to choose a JPG, PNG, or WebP · 5 MB maximum</span>
                    </label>
                    <label>
                      Website description
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={draft.description}
                        onChange={(event) => updateDraft(item, { description: event.target.value })}
                        placeholder="Tell customers what makes this item special."
                      />
                    </label>
                    <label className="admin-menu-photo-link">
                      Or paste a photo link
                      <input
                        type="url"
                        maxLength={2048}
                        value={draft.imageUrl}
                        onChange={(event) => updateDraft(item, { imageUrl: event.target.value })}
                        placeholder="https://…"
                      />
                    </label>
                    <div className="admin-menu-badges" aria-label={`${item.name} website settings`}>
                      <label><input type="checkbox" checked={draft.isFeatured} onChange={(event) => updateDraft(item, { isFeatured: event.target.checked })} /><span>Featured</span></label>
                      <label><input type="checkbox" checked={draft.isSeasonal} onChange={(event) => updateDraft(item, { isSeasonal: event.target.checked })} /><span>Seasonal</span></label>
                      <label><input type="checkbox" checked={draft.isHidden} onChange={(event) => updateDraft(item, { isHidden: event.target.checked })} /><span>Hide online</span></label>
                    </div>
                    <button className="pill solid" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save website details'}</button>
                  </form>

                  <button
                    type="button"
                    className={isSoldOut ? 'pill solid' : 'pill ghost'}
                    disabled={busy}
                    onClick={() => void toggleItem(item)}
                  >
                    {busy ? 'Updating…' : isSoldOut ? 'Make available today' : 'Mark sold out today'}
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
