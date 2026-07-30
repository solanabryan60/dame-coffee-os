'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  readSiteSettings,
  SiteSettings,
  updateSiteSettings,
} from '../lib/supabase-rest';
import {
  AdminRewardLookup,
  createRewardPromotion,
  listRewardPromotions,
  lookupDameReward,
  redeemDameReward,
  RewardPromotion,
  setRewardPromotionActive,
} from '../lib/dame-rewards';

const TOKEN_KEY = 'dame_admin_access_token';

export default function AdminDashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rewardCode, setRewardCode] = useState('');
  const [reward, setReward] = useState<AdminRewardLookup | null>(null);
  const [rewardMessage, setRewardMessage] = useState('');
  const [rewardError, setRewardError] = useState('');
  const [checkingReward, setCheckingReward] = useState(false);
  const [promotions, setPromotions] = useState<RewardPromotion[]>([]);
  const [promotionName, setPromotionName] = useState('');
  const [promotionStartsAt, setPromotionStartsAt] = useState('');
  const [promotionEndsAt, setPromotionEndsAt] = useState('');
  const [promotionScope, setPromotionScope] =
    useState<RewardPromotion['scope']>('all');
  const [promotionCategories, setPromotionCategories] = useState<
    RewardPromotion['eligible_categories']
  >([]);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [promotionError, setPromotionError] = useState('');
  const [savingPromotion, setSavingPromotion] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    Promise.all([
      readSiteSettings(),
      listRewardPromotions(token),
    ])
      .then(([siteSettings, rewardPromotions]) => {
        setSettings(siteSettings);
        setPromotions(rewardPromotions);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Could not load settings.');
      });
  }, [router]);

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    router.replace('/admin/login');
  }

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      await updateSiteSettings(settings, token);
      setMessage('Saved. The public site will show the new information when refreshed.');
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : 'Could not save changes.';
      setError(text);
      if (/jwt|token|unauthorized/i.test(text)) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } finally {
      setSaving(false);
    }
  }

  async function checkReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setCheckingReward(true);
    setReward(null);
    setRewardMessage('');
    setRewardError('');
    try {
      const found = await lookupDameReward(token, rewardCode);
      setReward(found);
    } catch (lookupError) {
      setRewardError(
        lookupError instanceof Error ? lookupError.message : 'Could not check that reward code.',
      );
    } finally {
      setCheckingReward(false);
    }
  }

  async function markRewardUsed() {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token || !reward) {
      router.replace('/admin/login');
      return;
    }

    setCheckingReward(true);
    setRewardMessage('');
    setRewardError('');
    try {
      const result = await redeemDameReward(token, reward.code);
      setReward((current) => (current ? { ...current, status: 'redeemed' } : current));
      setRewardMessage(`${result.reward_name} marked used for ${result.first_name}.`);
    } catch (redeemError) {
      setRewardError(
        redeemError instanceof Error ? redeemError.message : 'Could not redeem that code.',
      );
    } finally {
      setCheckingReward(false);
    }
  }

  function togglePromotionCategory(
    category: RewardPromotion['eligible_categories'][number],
  ) {
    setPromotionCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  async function addPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setPromotionMessage('');
    setPromotionError('');
    setSavingPromotion(true);
    try {
      if (
        promotionScope === 'menu_categories' &&
        promotionCategories.length === 0
      ) {
        throw new Error('Choose at least one menu category for this campaign.');
      }
      const startsAt = new Date(promotionStartsAt);
      const endsAt = new Date(promotionEndsAt);
      if (
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(endsAt.getTime()) ||
        endsAt <= startsAt
      ) {
        throw new Error('Choose an ending time after the campaign begins.');
      }

      const promotion = await createRewardPromotion(token, {
        name: promotionName.trim(),
        scope: promotionScope,
        eligible_categories:
          promotionScope === 'all' ? [] : promotionCategories,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });
      setPromotions((current) => [promotion, ...current]);
      setPromotionName('');
      setPromotionStartsAt('');
      setPromotionEndsAt('');
      setPromotionScope('all');
      setPromotionCategories([]);
      setPromotionMessage('Your 2× points campaign is scheduled.');
    } catch (promotionFailure) {
      setPromotionError(
        promotionFailure instanceof Error
          ? promotionFailure.message
          : 'Could not schedule that campaign.',
      );
    } finally {
      setSavingPromotion(false);
    }
  }

  async function togglePromotion(promotion: RewardPromotion) {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setPromotionMessage('');
    setPromotionError('');
    setSavingPromotion(true);
    try {
      const updated = await setRewardPromotionActive(
        token,
        promotion.id,
        !promotion.active,
      );
      setPromotions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setPromotionMessage(
        updated.active
          ? `${updated.name} is active.`
          : `${updated.name} is paused.`,
      );
    } catch (promotionFailure) {
      setPromotionError(
        promotionFailure instanceof Error
          ? promotionFailure.message
          : 'Could not update that campaign.',
      );
    } finally {
      setSavingPromotion(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">DAME COFFEE OS</p>
          <h1>Live location</h1>
        </div>
        <div className="admin-top-actions">
          <Link className="pill ghost" href="/" target="_blank">View website</Link>
          <button className="pill ghost" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="admin-card">
        {!settings && !error ? <p>Loading your settings…</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}

        {settings ? (
          <form onSubmit={save} className="admin-form admin-grid">
            <label className="admin-wide">
              Big location title
              <input
                value={settings.location_title}
                onChange={(event) => update('location_title', event.target.value)}
                placeholder="VENICE BEACH"
                required
              />
            </label>

            <label className="admin-wide">
              Exact address
              <input
                value={settings.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Ocean Front Walk near The Waterfront, Venice, CA"
                required
              />
            </label>

            <label className="admin-wide">
              Details to help customers find you
              <textarea
                value={settings.directions}
                onChange={(event) => update('directions', event.target.value)}
                rows={4}
                placeholder="Look for the white Dame Coffee cart…"
                required
              />
            </label>

            <label>
              Hours shown on site
              <input
                value={settings.hours}
                onChange={(event) => update('hours', event.target.value)}
                placeholder="6:00 AM–4:00 PM"
                required
              />
            </label>

            <label>
              Wait time in minutes
              <input
                type="number"
                min="0"
                max="180"
                step="1"
                value={settings.wait_minutes}
                onChange={(event) => update('wait_minutes', Number(event.target.value))}
                required
              />
            </label>

            <label className="admin-wide">
              Google Maps directions link
              <input
                type="url"
                value={settings.maps_url}
                onChange={(event) => update('maps_url', event.target.value)}
                placeholder="https://www.google.com/maps/..."
                required
              />
            </label>

            <div className="toggle-panel">
              <div>
                <strong>Business status</strong>
                <span>{settings.is_open ? 'Open' : 'Closed'}</span>
              </div>
              <button
                type="button"
                className={`toggle ${settings.is_open ? 'on' : ''}`}
                onClick={() => update('is_open', !settings.is_open)}
                aria-pressed={settings.is_open}
              ><i /></button>
            </div>

            <div className="toggle-panel">
              <div>
                <strong>Mobile ordering</strong>
                <span>{settings.mobile_ordering ? 'On' : 'Off'}</span>
              </div>
              <button
                type="button"
                className={`toggle ${settings.mobile_ordering ? 'on' : ''}`}
                onClick={() => update('mobile_ordering', !settings.mobile_ordering)}
                aria-pressed={settings.mobile_ordering}
              ><i /></button>
            </div>

            {message ? <p className="admin-success admin-wide">{message}</p> : null}
            {error ? <p className="admin-error admin-wide">{error}</p> : null}

            <button className="pill solid admin-wide" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save live location'}
            </button>
          </form>
        ) : null}
      </section>

      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Dame Rewards</p>
            <h2>Redeem a customer code</h2>
          </div>
          <p>Ask the customer for the eight-character code shown in their account.</p>
        </div>

        <form className="admin-reward-lookup" onSubmit={checkReward}>
          <label>
            Reward code
            <input
              value={rewardCode}
              onChange={(event) => setRewardCode(event.target.value.toUpperCase())}
              placeholder="AB12CD34"
              maxLength={8}
              autoCapitalize="characters"
              required
            />
          </label>
          <button className="pill solid" type="submit" disabled={checkingReward}>
            {checkingReward ? 'Checking…' : 'Check code'}
          </button>
        </form>

        {reward ? (
          <article className={`admin-reward-result is-${reward.status}`}>
            <div>
              <span>{reward.status}</span>
              <h3>{reward.reward_name}</h3>
              <p>{reward.first_name} · {reward.email}</p>
              <small>Code {reward.code} · {reward.points_spent} points</small>
            </div>
            <button
              className="pill solid"
              type="button"
              onClick={markRewardUsed}
              disabled={checkingReward || reward.status !== 'pending'}
            >
              {reward.status === 'pending' ? 'Mark reward used' : 'Already handled'}
            </button>
          </article>
        ) : null}

        {rewardMessage ? <p className="admin-success">{rewardMessage}</p> : null}
        {rewardError ? <p className="admin-error">{rewardError}</p> : null}
      </section>

      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Points campaigns</p>
            <h2>Schedule a 2× moment</h2>
          </div>
          <p>
            Choose a date and whether every purchase or selected menu
            categories earn double points. Overlapping campaigns never stack.
          </p>
        </div>

        <form className="admin-form admin-grid" onSubmit={addPromotion}>
          <label className="admin-wide">
            Campaign name
            <input
              value={promotionName}
              onChange={(event) => setPromotionName(event.target.value)}
              placeholder="Double Points Saturday"
              maxLength={80}
              required
            />
          </label>
          <label>
            Begins
            <input
              type="datetime-local"
              value={promotionStartsAt}
              onChange={(event) => setPromotionStartsAt(event.target.value)}
              required
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              value={promotionEndsAt}
              onChange={(event) => setPromotionEndsAt(event.target.value)}
              required
            />
          </label>
          <label className="admin-wide">
            Eligible purchases
            <select
              value={promotionScope}
              onChange={(event) =>
                setPromotionScope(event.target.value as RewardPromotion['scope'])
              }
            >
              <option value="all">Every eligible purchase</option>
              <option value="menu_categories">Selected menu categories</option>
            </select>
          </label>

          {promotionScope === 'menu_categories' ? (
            <fieldset className="admin-category-options admin-wide">
              <legend>Choose the categories</legend>
              {[
                ['basics', 'The Basics'],
                ['specialty', 'Specialty Drinks'],
                ['foam', 'Cold Foam Lovers'],
                ['food', 'Food Items'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={promotionCategories.includes(
                      value as RewardPromotion['eligible_categories'][number],
                    )}
                    onChange={() =>
                      togglePromotionCategory(
                        value as RewardPromotion['eligible_categories'][number],
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          <button
            className="pill solid admin-wide"
            type="submit"
            disabled={savingPromotion}
          >
            {savingPromotion ? 'Scheduling…' : 'Schedule 2× points'}
          </button>
        </form>

        {promotions.length ? (
          <div className="admin-promotion-list">
            {promotions.map((promotion) => (
              <article key={promotion.id}>
                <div>
                  <span>{promotion.multiplier}× points</span>
                  <h3>{promotion.name}</h3>
                  <p>
                    {new Date(promotion.starts_at).toLocaleString()} –{' '}
                    {new Date(promotion.ends_at).toLocaleString()}
                  </p>
                  <small>
                    {promotion.scope === 'all'
                      ? 'Every eligible purchase'
                      : promotion.eligible_categories.join(', ')}
                  </small>
                </div>
                <button
                  className={`toggle ${promotion.active ? 'on' : ''}`}
                  type="button"
                  aria-label={`${promotion.active ? 'Pause' : 'Activate'} ${promotion.name}`}
                  aria-pressed={promotion.active}
                  disabled={savingPromotion}
                  onClick={() => togglePromotion(promotion)}
                >
                  <i />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty-state">No 2× campaigns scheduled yet.</p>
        )}

        {promotionMessage ? (
          <p className="admin-success">{promotionMessage}</p>
        ) : null}
        {promotionError ? <p className="admin-error">{promotionError}</p> : null}
      </section>
    </main>
  );
}
