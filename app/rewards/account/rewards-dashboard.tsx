'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type {
  RewardRedemption,
  RewardsAccountPayload,
} from '../../lib/dame-rewards';
import {
  CustomerProfile,
  updateCustomerProfile,
} from '../../lib/supabase-rest';
import {
  clearCustomerSession,
  getCustomerSession,
} from '../../lib/customer-session';
import BeanStateImage, { type DameBeanState } from '../../components/bean-state';
import RewardsSignup from '../../components/rewards-signup';
import RewardsHelp from './rewards-help';

const refreshBeans = [
  { state: 'rewards', message: 'Counting every little something.' },
  { state: 'pouring', message: 'Pouring your newest points into place.' },
  { state: 'celebrating', message: 'Getting your next treat a little closer.' },
  { state: 'walking', message: 'Bringing your Dame moments together.' },
  { state: 'waving', message: 'Checking in with the cart.' },
  { state: 'croissant', message: 'Making room for something sweet.' },
  { state: 'chef', message: 'Freshening up your rewards.' },
  { state: 'binoculars', message: 'Looking for your latest points.' },
] satisfies ReadonlyArray<{ state: DameBeanState; message: string }>;

function randomRefreshBean(previousState: DameBeanState) {
  const choices = refreshBeans.filter(({ state }) => state !== previousState);
  return choices[Math.floor(Math.random() * choices.length)] ?? refreshBeans[0];
}

const accountTabs = [
  ['overview', '01', 'My account'],
  ['rewards', '02', 'Claim rewards'],
  ['activity', '03', 'Orders & favorites'],
  ['help', '04', 'How it works & FAQ'],
] as const;

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function expiryTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function RewardsDashboard() {
  const [account, setAccount] = useState<RewardsAccountPayload | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingReward, setWorkingReward] = useState('');
  const [workingFavorite, setWorkingFavorite] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [tab, setTab] = useState<'overview' | 'rewards' | 'activity' | 'help'>('overview');
  const [refreshBean, setRefreshBean] = useState(refreshBeans[0]);

  const loadAccount = useCallback(async () => {
    setRefreshBean((current) => randomRefreshBean(current.state));
    setLoading(true);
    setError('');
    const session = await getCustomerSession();
    if (!session) {
      setAccessToken('');
      setAccount(null);
      setLoading(false);
      return;
    }
    setAccessToken(session.access_token);

    try {
      const response = await fetch('/api/rewards/account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const payload = (await response.json()) as RewardsAccountPayload & { error?: string };
      if (response.status === 401) { clearCustomerSession(); setAccessToken(''); setAccount(null); }
      if (!response.ok) throw new Error(payload.error || 'Could not load your rewards.');
      setAccount(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccount();
    const refresh = () => { void loadAccount(); };
    window.addEventListener('dame-auth-ready', refresh);
    return () => window.removeEventListener('dame-auth-ready', refresh);
  }, [loadAccount]);

  async function currentToken() {
    const session = await getCustomerSession();
    if (!session) throw new Error('Your session has expired. Sign in again to continue.');
    return session.access_token;
  }

  function updateProfile<K extends keyof CustomerProfile>(
    key: K,
    value: CustomerProfile[K],
  ) {
    setAccount((current) =>
      current
        ? { ...current, profile: { ...current.profile, [key]: value } }
        : current,
    );
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !accessToken) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const profile = await updateCustomerProfile(
        await currentToken(),
        account.user.id,
        account.profile,
      );
      setAccount({ ...account, profile });
      setMessage('Your Dame profile is saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  async function redeemReward(rewardId: string) {
    if (!accessToken) return;
    setWorkingReward(rewardId);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await currentToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      });
      const payload = (await response.json()) as {
        redemption?: RewardRedemption;
        error?: string;
      };
      if (!response.ok || !payload.redemption) {
        throw new Error(payload.error || 'Could not prepare that reward.');
      }
      setMessage(`Your ${payload.redemption.reward_name} code is ready.`);
      await loadAccount();
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : 'Could not prepare that reward.');
    } finally {
      setWorkingReward('');
    }
  }

  async function cancelReward(redemptionId: string) {
    if (!accessToken) return;
    setWorkingReward(redemptionId);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/rewards/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await currentToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redemptionId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not cancel that reward.');
      setMessage('Reward cancelled. Your points are back.');
      await loadAccount();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel that reward.');
    } finally {
      setWorkingReward('');
    }
  }

  function signOut() {
    clearCustomerSession();
    window.location.assign('/rewards');
  }

  async function shareReferral() {
    if (!account?.profile.referral_code) return;
    const referralUrl = `${window.location.origin}/rewards?ref=${account.profile.referral_code}#join`;
    const shareData = {
      title: 'Join Dame Rewards',
      text: 'Join me at Dame Coffee. Your first eligible purchase brings us both closer to something special.',
      url: referralUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setReferralMessage('Referral link shared.');
        return;
      }
      await navigator.clipboard.writeText(referralUrl);
      setReferralMessage('Referral link copied.');
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      setReferralMessage('Copy the code below and send it to your friend.');
    }
  }

  async function toggleFavorite(squareItemId: string) {
    if (!account || !accessToken) return;
    const selected = !account.favorites.includes(squareItemId);
    setWorkingFavorite(squareItemId);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/rewards/favorites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await currentToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ squareItemId, selected }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not update that favorite.');
      setAccount((current) => current ? {
        ...current,
        favorites: selected
          ? [...current.favorites, squareItemId]
          : current.favorites.filter((itemId) => itemId !== squareItemId),
      } : current);
      setMessage(selected ? 'Added to your Dame favorites.' : 'Removed from your favorites.');
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : 'Could not update that favorite.');
    } finally {
      setWorkingFavorite('');
    }
  }

  if (loading) {
    return (
      <section className="dame-account-loading" aria-live="polite" aria-busy="true">
        <div className="dame-account-loading-stage">
          <BeanStateImage state={refreshBean.state} className="dame-account-loading-bean" decorative priority />
        </div>
        <p className="dame-kicker">Refreshing your points</p>
        <h1>One Dame moment.</h1>
        <span>{refreshBean.message}</span>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="dame-account-empty">
        <BeanStateImage state="rewards" className="dame-account-empty-bean" decorative priority />
        <p className="dame-kicker">Dame Rewards</p>
        <h1>{accessToken ? 'Your account is still here.' : 'Your next reward starts here.'}</h1>
        {error ? <p role="alert">{error}</p> : <p>Sign in to see your points. New here? Choose Join to create your account.</p>}
        {accessToken ? <div className="dame-actions"><button type="button" className="dame-button" onClick={() => void loadAccount()}>Try loading again</button><button type="button" onClick={signOut}>Sign out</button></div> : <RewardsSignup initialMode="signin" onAuthenticated={loadAccount} />}
      </section>
    );
  }

  const { rewards, profile, user } = account;
  const nextReward = rewards.nextReward;
  const progress = nextReward
    ? Math.max(0, Math.min(100, Math.round((rewards.points / nextReward.points) * 100)))
    : 100;

  return (
    <>
      <section className="dame-account-hero">
        <div>
          <p className="dame-kicker dame-kicker-light">Dame Rewards</p>
          <h1>Welcome back,<br /><em>{profile.first_name || 'friend'}.</em></h1>
          <p>Every purchase deserves a little love.</p>
          <Link className="dame-inline-link dame-inline-link-light" href="/rewards/claim">
            Save an in-person receipt <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="dame-points-card">
          <BeanStateImage state="birthday" className="dame-points-bean" decorative />
          <p>Available balance</p>
          <strong>{rewards.points.toLocaleString()}</strong>
          <span>points</span>
          <div className="dame-points-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progress toward your next reward">
            <i style={{ width: `${progress}%` }} />
          </div>
          {nextReward ? (
            <p>You&apos;re only <b>{nextReward.pointsAway}</b> points away from {nextReward.name}.</p>
          ) : (
            <p>Every Dame reward is within reach.</p>
          )}
        </div>
      </section>

      <nav className="dame-account-tabs" aria-label="Your rewards account sections">
        {accountTabs.map(([value, number, label]) => (
          <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
            <span aria-hidden="true">{number}</span>
            <strong>{label}</strong>
          </button>
        ))}
        <button className="dame-account-refresh" type="button" onClick={() => void loadAccount()}>
          <span aria-hidden="true">↻</span>
          <strong>Refresh points</strong>
        </button>
      </nav>

      {rewards.activePromotions.length ? (
        <section className="dame-promotion-banner" aria-label="Current points promotion">
          <span>{rewards.activePromotions[0].multiplier}× points</span>
          <div>
            <strong>{rewards.activePromotions[0].name}</strong>
            <p>
              {rewards.activePromotions[0].scope === 'all'
                ? 'Every eligible Dame purchase is earning extra love right now.'
                : 'Selected Dame favorites are earning extra love right now.'}
            </p>
          </div>
        </section>
      ) : null}

      <section className={`dame-account-body ${tab !== 'overview' ? 'dame-account-single' : ''}`}>
        <div className="dame-account-main">
          {message ? <p className="dame-rewards-success" role="status">{message}</p> : null}
          {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}
          {tab === 'help' ? <RewardsHelp /> : null}
          {rewards.pendingRedemptions.length ? (
            <section hidden={tab !== 'overview' && tab !== 'rewards'} className="dame-pending-rewards" aria-labelledby="ready-rewards">
              <header>
                <p className="dame-kicker">Ready at the cart</p>
                <h2 id="ready-rewards">Show us this code.</h2>
              </header>
              <div className="dame-pending-grid">
                {rewards.pendingRedemptions.map((redemption) => (
                  <article key={redemption.id}>
                    <p>{redemption.reward_name}</p>
                    <strong>{redemption.code}</strong>
                    <span>Valid until {expiryTime(redemption.expires_at)}</span>
                    <button
                      type="button"
                      onClick={() => cancelReward(redemption.id)}
                      disabled={workingReward === redemption.id}
                    >
                      {workingReward === redemption.id ? 'Cancelling…' : 'Cancel and return points'}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section hidden={tab !== 'overview'} className="dame-referral-card" aria-labelledby="dame-referral-title">
            <div>
              <p className="dame-kicker">Share the Dame love</p>
              <h2 id="dame-referral-title">A little love for both of you.</h2>
              <p>
                Your friend earns 250 points after their first eligible $5
                purchase. You earn 500 points—up to ten successful referrals
                each month.
              </p>
            </div>
            <div className="dame-referral-code">
              <span>Your referral code</span>
              <strong>{profile.referral_code}</strong>
              <button className="dame-button" type="button" onClick={shareReferral}>
                Share my link
              </button>
              <small>{rewards.qualifiedReferrals} successful referral{rewards.qualifiedReferrals === 1 ? '' : 's'}</small>
              {referralMessage ? <p role="status">{referralMessage}</p> : null}
            </div>
          </section>

          <section hidden={tab !== 'activity'} className="dame-account-favorites" aria-labelledby="favorite-drinks-title">
            <header>
              <p className="dame-kicker">Favorite drinks</p>
              <h2 id="favorite-drinks-title">Keep your usual close.</h2>
              <p>Tap the heart beside any current Dame item. Your favorites stay here even as the menu grows.</p>
            </header>
            <div className="dame-favorite-grid">
              {account.menu.map((item) => {
                const favorite = account.favorites.includes(item.id);
                return (
                  <article className={favorite ? 'is-favorite' : ''} key={item.id}>
                    {item.imageUrl ? <div className="dame-favorite-photo" style={{ backgroundImage: `url(${JSON.stringify(item.imageUrl)})` }} aria-hidden="true" /> : null}
                    <div><span>{item.categoryLabel}</span><h3>{item.name}</h3><p>{item.description}</p></div>
                    <button type="button" aria-pressed={favorite} disabled={workingFavorite === item.id} onClick={() => void toggleFavorite(item.id)}>
                      {workingFavorite === item.id ? 'Saving…' : favorite ? '♥ Saved' : '♡ Add favorite'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section hidden={tab !== 'activity'} className="dame-account-orders" aria-labelledby="order-history-title">
            <header><p className="dame-kicker">Order history</p><h2 id="order-history-title">Made for you before.</h2></header>
            {account.orders.length ? (
              <div className="dame-account-list">
                {account.orders.slice(0, 12).map((order) => (
                  <article key={order.id}>
                    <div><strong>{shortDate(order.created_at)}</strong><span>{order.status.replaceAll('_', ' ')}</span></div>
                    <p>{order.line_items.map((item) => `${item.quantity} ${item.item_name}`).join(' · ')}</p>
                    <b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((order.paid_cents ?? order.subtotal_cents) / 100)}</b>
                  </article>
                ))}
              </div>
            ) : <p className="dame-reward-empty">Signed-in mobile orders will appear here.</p>}
          </section>

          <section hidden={tab !== 'activity'} className="dame-account-bookings" aria-labelledby="catering-bookings-title">
            <header><p className="dame-kicker">Catering</p><h2 id="catering-bookings-title">Your upcoming Dame dates.</h2></header>
            {account.bookings.length ? (
              <div className="dame-account-list">
                {account.bookings.map((booking) => (
                  <article key={booking.id}>
                    <div><strong>{shortDate(`${booking.event_date}T12:00:00`)}</strong><span>{booking.status.replaceAll('_', ' ')}</span></div>
                    <p>{booking.address} · {booking.drinks} drinks · {booking.service_hours} hours</p>
                    <b>{booking.deposit_paid_at ? '$200 deposit paid' : 'Deposit pending'}</b>
                  </article>
                ))}
              </div>
            ) : <p className="dame-reward-empty">Catering booked while signed in will stay connected to your account.</p>}
          </section>

          <section hidden={tab !== 'rewards'} className="dame-account-rewards" aria-labelledby="your-rewards">
            <header>
              <p className="dame-kicker">Your rewards</p>
              <h2 id="your-rewards">Choose your little something.</h2>
              <p>Redeem points, then show the one-time code at the Dame cart within 24 hours.</p>
            </header>

            <div className="dame-reward-tier-grid">
              {rewards.rewardTiers.map((tier) => {
                const ready = rewards.points >= tier.points_cost;
                return (
                  <article key={tier.id} className={ready ? 'is-earned' : ''}>
                    <span>{tier.points_cost.toLocaleString()} points</span>
                    <h3>{tier.name}</h3>
                    <p>{tier.description}</p>
                    <button
                      className="dame-button"
                      type="button"
                      onClick={() => redeemReward(tier.id)}
                      disabled={!ready || Boolean(workingReward)}
                    >
                      {workingReward === tier.id
                        ? 'Preparing…'
                        : ready
                          ? 'Use my points'
                          : `${tier.points_cost - rewards.points} to go`}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section hidden={tab !== 'overview' && tab !== 'activity'} className="dame-reward-history" aria-labelledby="reward-history">
            <header>
              <p className="dame-kicker">Recent activity</p>
              <h2 id="reward-history">Your Dame moments.</h2>
            </header>
            {rewards.activity.length ? (
              <div>
                {rewards.activity.map((entry) => (
                  <article key={entry.id}>
                    <span className={entry.points_delta > 0 ? 'is-positive' : ''}>
                      {entry.points_delta > 0 ? '+' : ''}{entry.points_delta}
                    </span>
                    <p>{entry.description}</p>
                    <time dateTime={entry.created_at}>{shortDate(entry.created_at)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <p className="dame-reward-empty">
                Your first eligible purchase will begin your rewards story.
              </p>
            )}
          </section>

        </div>

        <aside hidden={tab !== 'overview'} className="dame-account-profile">
          <div className="dame-account-profile-heading">
            <div>
              <p>Your profile</p>
              <h2>{user.email}</h2>
            </div>
            <button type="button" onClick={signOut}>Sign out</button>
          </div>

          <form onSubmit={saveProfile}>
            <label>
              <span>First name</span>
              <input
                value={profile.first_name}
                onChange={(event) => updateProfile('first_name', event.target.value)}
                autoComplete="given-name"
                maxLength={80}
                required
              />
            </label>
            <label>
              <span>Mobile number</span>
              <input
                value={profile.phone ?? ''}
                onChange={(event) => updateProfile('phone', event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                required
              />
              <small>Reserved for important account or order-related contact.</small>
            </label>
            <label>
              <span>Birthday · optional</span>
              <input
                type="date"
                value={profile.birthday ?? ''}
                onChange={(event) => updateProfile('birthday', event.target.value || null)}
                autoComplete="bday"
              />
            </label>
            <label className="dame-rewards-consent">
              <input
                type="checkbox"
                checked={profile.marketing_opt_in}
                onChange={(event) => updateProfile('marketing_opt_in', event.target.checked)}
              />
              <span>Email me reward news and special Dame drops.</span>
            </label>
            <button className="dame-button dame-button-outline" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </aside>
      </section>
    </>
  );
}
