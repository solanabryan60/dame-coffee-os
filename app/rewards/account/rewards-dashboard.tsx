'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { SquareRewardsStatus } from '../../lib/square';
import {
  CustomerProfile,
  updateCustomerProfile,
} from '../../lib/supabase-rest';
import {
  clearCustomerSession,
  getCustomerSession,
} from '../../lib/customer-session';

type AccountPayload = {
  user: {
    id: string;
    email: string;
    emailConfirmed: boolean;
  };
  profile: CustomerProfile;
  rewards: SquareRewardsStatus;
};

export default function RewardsDashboard() {
  const [account, setAccount] = useState<AccountPayload | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError('');
    const session = await getCustomerSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setAccessToken(session.access_token);

    try {
      const response = await fetch('/api/rewards/account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const payload = (await response.json()) as AccountPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not load your rewards.');
      setAccount(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your rewards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

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
        accessToken,
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

  async function enroll() {
    if (!accessToken) return;
    setEnrolling(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/rewards/enroll', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json()) as {
        rewards?: SquareRewardsStatus;
        error?: string;
      };
      if (!response.ok || !payload.rewards) {
        throw new Error(payload.error || 'Could not connect your rewards.');
      }
      setAccount((current) =>
        current ? { ...current, rewards: payload.rewards! } : current,
      );
      setMessage('You’re connected. Your Square points will now appear here.');
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : 'Could not connect rewards.');
    } finally {
      setEnrolling(false);
    }
  }

  function signOut() {
    clearCustomerSession();
    window.location.assign('/rewards');
  }

  if (loading) {
    return (
      <section className="dame-account-loading">
        <span className="dame-live-dot" />
        <p>Pouring your rewards dashboard…</p>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="dame-account-empty">
        <p className="dame-kicker">Dame Rewards</p>
        <h1>Let&apos;s get you signed in.</h1>
        <p>{error || 'Your rewards account is waiting for you.'}</p>
        <Link className="dame-button" href="/rewards#join">Join or sign in</Link>
      </section>
    );
  }

  const { rewards, profile, user } = account;
  const nextReward = rewards.nextReward;
  const progress = nextReward
    ? Math.max(0, Math.min(100, Math.round((rewards.points / nextReward.points) * 100)))
    : rewards.enrolled
      ? 100
      : 0;

  return (
    <>
      <section className="dame-account-hero">
        <div>
          <p className="dame-kicker dame-kicker-light">Dame Rewards</p>
          <h1>Welcome back,<br /><em>{profile.first_name || 'friend'}.</em></h1>
          <p>Every visit moves you closer to something good.</p>
        </div>
        <div className="dame-points-card">
          <p>Available balance</p>
          <strong>{rewards.points}</strong>
          <span>{rewards.pointsLabel}</span>
          <div className="dame-points-progress" aria-label={`${progress}% toward next reward`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          {nextReward ? (
            <p>
              <b>{nextReward.pointsAway}</b> {rewards.pointsLabel} until {nextReward.name}
            </p>
          ) : rewards.enrolled ? (
            <p>Your available rewards are ready below.</p>
          ) : (
            <p>Connect your Square rewards to start tracking points.</p>
          )}
        </div>
      </section>

      <section className="dame-account-body">
        <div className="dame-account-main">
          <header>
            <p className="dame-kicker">Your rewards</p>
            <h2>Something good is getting closer.</h2>
          </header>

          {!rewards.squareConfigured || !rewards.programActive ? (
            <article className="dame-rewards-state">
              <span>Phase 3</span>
              <h3>Your Dame account is ready.</h3>
              <p>
                Square points will connect here as soon as the Dame Rewards
                program is activated. Your profile is already saved.
              </p>
            </article>
          ) : !rewards.enrolled ? (
            <article className="dame-rewards-state">
              <span>One last step</span>
              <h3>Connect your points.</h3>
              <p>
                We&apos;ll connect this Dame account to your Square customer
                profile using your confirmed email and mobile number.
              </p>
              <button
                className="dame-button"
                type="button"
                onClick={enroll}
                disabled={enrolling || !user.emailConfirmed}
              >
                {enrolling ? 'Connecting…' : 'Connect Square Rewards'}
              </button>
              {!user.emailConfirmed ? <small>Confirm your email first, then refresh this page.</small> : null}
            </article>
          ) : (
            <div className="dame-reward-tier-grid">
              {rewards.rewardTiers.length ? rewards.rewardTiers.map((tier) => (
                <article key={tier.id} className={rewards.points >= tier.points ? 'is-earned' : ''}>
                  <span>{rewards.points >= tier.points ? 'Ready' : `${tier.points} ${rewards.pointsLabel}`}</span>
                  <h3>{tier.name}</h3>
                  <p>
                    {rewards.points >= tier.points
                      ? 'You have enough points for this reward.'
                      : `${Math.max(0, tier.points - rewards.points)} to go.`}
                  </p>
                </article>
              )) : (
                <article>
                  <span>Connected</span>
                  <h3>{rewards.points} {rewards.pointsLabel}</h3>
                  <p>Your Square balance is connected to Dame.</p>
                </article>
              )}
            </div>
          )}

          {message ? <p className="dame-rewards-success" role="status">{message}</p> : null}
          {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}
        </div>

        <aside className="dame-account-profile">
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
              <span>Send me reward news and special Dame drops.</span>
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
