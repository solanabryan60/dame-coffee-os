'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginCustomer,
  signUpCustomer,
  sendCustomerEmail,
} from '../lib/supabase-rest';
import {
  getCustomerSession,
  saveCustomerSession,
} from '../lib/customer-session';

type Mode = 'join' | 'signin';

export default function RewardsSignup({
  initialReferralCode = '',
  returnTo = '/rewards/account',
  initialMode = 'join',
  onAuthenticated,
}: {
  initialReferralCode?: string;
  returnTo?: string;
  initialMode?: Mode;
  onAuthenticated?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailWorking, setEmailWorking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendEmail(type: 'confirmation' | 'recovery') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter your email address above first.');
      document.getElementById('rewards-email')?.focus();
      return;
    }
    setEmailWorking(true);
    setError('');
    setMessage('');
    try {
      await sendCustomerEmail(email, type);
      setMessage(type === 'confirmation'
        ? 'If this email has an unconfirmed account, a new confirmation link has been requested. Check your inbox and spam folder, and use the newest link.'
        : 'If an account exists for this email, a password reset link has been requested. Check your inbox and spam folder.');
      setCooldown(60);
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : 'Could not send the email.');
      setCooldown(60);
    } finally { setEmailWorking(false); }
  }

  useEffect(() => {
    getCustomerSession().then((session) => {
      if (session && !onAuthenticated) router.replace(returnTo);
    });
  }, [router, returnTo, onAuthenticated]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const session = await loginCustomer(email, password);
        saveCustomerSession(session);
        if (onAuthenticated) onAuthenticated();
        else router.push(returnTo);
        return;
      }

      if (password.length < 8) {
        throw new Error('Choose a password with at least 8 characters.');
      }
      if (referralCode && !/^[A-Z0-9]{8}$/.test(referralCode)) {
        throw new Error('Enter the complete eight-character referral code.');
      }
      const result = await signUpCustomer({
        firstName,
        email,
        phone,
        birthday,
        password,
        marketingOptIn,
        referralCode,
      });

      if (result.access_token && result.refresh_token && result.expires_in) {
        saveCustomerSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          expires_in: result.expires_in,
          expires_at: result.expires_at,
          user: result.user,
        });
        if (onAuthenticated) onAuthenticated();
        else router.push(returnTo);
        return;
      }

      setMessage(
        'You’re almost in. Check your email and confirm your Dame account, then come back to sign in.',
      );
      setMode('signin');
      setCooldown(60);
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
            <div>
              <label htmlFor="rewards-referral">Referral code · optional</label>
              <input
                id="rewards-referral"
                value={referralCode}
                onChange={(event) =>
                  setReferralCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 8),
                  )
                }
                placeholder="Eight-character code"
                autoCapitalize="characters"
                maxLength={8}
              />
              {initialReferralCode ? (
                <small>Your friend&apos;s Dame referral is applied.</small>
              ) : null}
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
        <div className="dame-auth-help">
          <p>Missing your email? Check spam, confirm the address above, then request a new link.</p>
          <button type="button" className="dame-button dame-button-outline" disabled={emailWorking || submitting || cooldown > 0} onClick={() => void sendEmail('confirmation')}>
            {emailWorking ? 'Requesting email…' : cooldown ? `Resend available in ${cooldown}s` : 'Resend confirmation email'}
          </button>
          {mode === 'signin' ? <button type="button" disabled={emailWorking || submitting || cooldown > 0} onClick={() => void sendEmail('recovery')}>Forgot your password?</button> : null}
        </div>
        <p>
          {mode === 'join'
            ? 'By joining, you agree to save your contact information for Dame Rewards.'
            : 'Sign in to see your points, rewards, and saved favorites.'}
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
