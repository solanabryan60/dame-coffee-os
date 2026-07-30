'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginCustomer,
  signUpCustomer,
} from '../lib/supabase-rest';
import {
  getCustomerSession,
  saveCustomerSession,
} from '../lib/customer-session';

type Mode = 'join' | 'signin';

export default function RewardsSignup() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('join');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCustomerSession().then((session) => {
      if (session) router.replace('/rewards/account');
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const session = await loginCustomer(email, password);
        saveCustomerSession(session);
        router.push('/rewards/account');
        return;
      }

      if (password.length < 8) {
        throw new Error('Choose a password with at least 8 characters.');
      }
      const result = await signUpCustomer({
        firstName,
        email,
        phone,
        birthday,
        password,
        marketingOptIn,
      });

      if (result.access_token && result.refresh_token && result.expires_in) {
        saveCustomerSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          expires_in: result.expires_in,
          expires_at: result.expires_at,
          user: result.user,
        });
        router.push('/rewards/account');
        return;
      }

      setMessage(
        'You’re almost in. Check your email and confirm your Dame account, then come back to sign in.',
      );
      setMode('signin');
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dame-rewards-access">
      <div className="dame-rewards-switch" role="tablist" aria-label="Rewards account">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'join'}
          onClick={() => {
            setMode('join');
            setError('');
            setMessage('');
          }}
        >
          Join
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => {
            setMode('signin');
            setError('');
            setMessage('');
          }}
        >
          Sign in
        </button>
      </div>

      <form className="dame-rewards-form" onSubmit={submit}>
        {mode === 'join' ? (
          <>
            <div>
              <label htmlFor="rewards-name">First name</label>
              <input
                id="rewards-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                placeholder="Your name"
                maxLength={80}
                required
              />
            </div>
            <div>
              <label htmlFor="rewards-phone">Mobile number</label>
              <input
                id="rewards-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(555) 555-5555"
                required
              />
            </div>
            <div>
              <label htmlFor="rewards-birthday">Birthday · optional</label>
              <input
                id="rewards-birthday"
                type="date"
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
                autoComplete="bday"
              />
            </div>
          </>
        ) : null}

        <div>
          <label htmlFor="rewards-email">Email</label>
          <input
            id="rewards-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="rewards-password">Password</label>
          <input
            id="rewards-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'join' ? 'new-password' : 'current-password'}
            placeholder={mode === 'join' ? 'At least 8 characters' : 'Your password'}
            minLength={8}
            required
          />
        </div>

        {mode === 'join' ? (
          <label className="dame-rewards-consent">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
            />
            <span>
              Send me Dame Coffee updates, reward news, and special drops. I can
              unsubscribe anytime.
            </span>
          </label>
        ) : null}

        {message ? <p className="dame-rewards-success" role="status">{message}</p> : null}
        {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}

        <button className="dame-button" type="submit" disabled={submitting}>
          {submitting
            ? 'One moment…'
            : mode === 'join'
              ? 'Create my account'
              : 'Sign in'}
        </button>
        <p>
          {mode === 'join'
            ? 'By joining, you agree to save your contact information for Dame Rewards and Square customer services.'
            : 'Your rewards account is separate from the private Dame Coffee admin.'}
        </p>
        {mode === 'signin' ? (
          <Link href="mailto:info@damecoffeeco.com?subject=Dame%20Rewards%20account%20help">
            Need help signing in?
          </Link>
        ) : null}
      </form>
    </div>
  );
}
