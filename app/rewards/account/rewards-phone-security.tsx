'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import BeanStateImage from '../../components/bean-state';
import {
  getCustomerSession,
  saveCustomerSession,
} from '../../lib/customer-session';
import { normalizeUsPhone, type AuthSession } from '../../lib/supabase-rest';

type SecurityState = 'checking' | 'enroll' | 'challenge' | 'code' | 'verified';

function customerAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Dame Rewards security is not configured yet.');

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function maskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 4 ? `••• ••• ${digits.slice(-4)}` : 'your mobile number';
}

function friendlyMfaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/phone.*mfa.*disabled|unsupported.*factor|factor type.*phone/i.test(message)) {
    return 'Phone security is not active yet. Dame needs to finish connecting its text-message provider.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Too many codes were requested. Please wait a few minutes and try again.';
  }
  if (/invalid.*code|code.*invalid|expired/i.test(message)) {
    return 'That code is incorrect or expired. Check the newest text and try again.';
  }
  return message || 'We could not verify your phone. Please try again.';
}

export default function RewardsPhoneSecurity({
  initialPhone,
  onStatusChange,
}: {
  initialPhone: string;
  onStatusChange: (verified: boolean) => void;
}) {
  const clientRef = useRef<SupabaseClient | null>(null);
  const factorIdRef = useRef('');
  const [state, setState] = useState<SecurityState>('checking');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [working, setWorking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => setPhone((current) => current || initialPhone), [initialPhone]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const prepare = useCallback(async () => {
    setState('checking');
    setError('');
    try {
      const session = await getCustomerSession();
      if (!session) throw new Error('Your session expired. Sign in again to continue.');
      const client = customerAuthClient();
      clientRef.current = client;
      const sessionResult = await client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (sessionResult.error) throw sessionResult.error;
      if (sessionResult.data.session) {
        saveCustomerSession(sessionResult.data.session as AuthSession);
      }

      const [levels, factors] = await Promise.all([
        client.auth.mfa.getAuthenticatorAssuranceLevel(),
        client.auth.mfa.listFactors(),
      ]);
      if (levels.error) throw levels.error;
      if (factors.error) throw factors.error;

      if (levels.data.currentLevel === 'aal2') {
        setState('verified');
        onStatusChange(true);
        return;
      }

      const phoneFactor = factors.data.phone[0];
      if (phoneFactor) {
        factorIdRef.current = phoneFactor.id;
        setState('challenge');
      } else {
        setState('enroll');
      }
      onStatusChange(false);
    } catch (prepareError) {
      setError(friendlyMfaError(prepareError));
      setState('enroll');
      onStatusChange(false);
    }
  }, [onStatusChange]);

  useEffect(() => { void prepare(); }, [prepare]);

  async function sendCode() {
    setWorking(true);
    setError('');
    setMessage('');
    try {
      const client = clientRef.current;
      if (!client) throw new Error('Your session expired. Refresh this page and sign in again.');

      let factorId = factorIdRef.current;
      if (!factorId) {
        const normalizedPhone = normalizeUsPhone(phone);
        const factors = await client.auth.mfa.listFactors();
        if (factors.error) throw factors.error;
        for (const factor of factors.data.all) {
          if (factor.factor_type === 'phone' && factor.status === 'unverified') {
            await client.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
        const enrollment = await client.auth.mfa.enroll({
          factorType: 'phone',
          friendlyName: 'Dame Rewards phone',
          phone: normalizedPhone,
        });
        if (enrollment.error) throw enrollment.error;
        factorId = enrollment.data.id;
        factorIdRef.current = factorId;
        setPhone(normalizedPhone);
      }

      const challenge = await client.auth.mfa.challenge({
        factorId,
        channel: 'sms',
      });
      if (challenge.error) throw challenge.error;
      window.sessionStorage.setItem('dame_rewards_mfa_challenge', challenge.data.id);
      setState('code');
      setCooldown(60);
      setMessage(`We sent a six-digit code to ${maskedPhone(phone)}.`);
    } catch (sendError) {
      setError(friendlyMfaError(sendError));
    } finally {
      setWorking(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError('');
    setMessage('');
    try {
      const client = clientRef.current;
      const factorId = factorIdRef.current;
      const challengeId = window.sessionStorage.getItem('dame_rewards_mfa_challenge') ?? '';
      if (!client || !factorId || !challengeId) {
        throw new Error('Request a new code before continuing.');
      }
      if (!/^\d{6,10}$/.test(code)) throw new Error('Enter the complete code from your text.');

      const verification = await client.auth.mfa.verify({ factorId, challengeId, code });
      if (verification.error) throw verification.error;
      saveCustomerSession({
        ...verification.data,
        expires_at: Math.floor(Date.now() / 1000) + verification.data.expires_in,
      } as AuthSession);
      window.sessionStorage.removeItem('dame_rewards_mfa_challenge');
      setState('verified');
      setMessage('Your phone is verified and your rewards are protected.');
      onStatusChange(true);
    } catch (verifyError) {
      setError(friendlyMfaError(verifyError));
    } finally {
      setWorking(false);
    }
  }

  if (state === 'checking') {
    return (
      <section className="dame-phone-security is-checking" aria-live="polite">
        <p>Checking your rewards security…</p>
      </section>
    );
  }

  if (state === 'verified') {
    return (
      <section className="dame-phone-security is-verified" aria-label="Rewards phone security">
        <div>
          <span aria-hidden="true">✓</span>
          <p><strong>Phone verified</strong>Your rewards account is protected with two-step verification.</p>
        </div>
        {message ? <small role="status">{message}</small> : null}
      </section>
    );
  }

  return (
    <section className="dame-phone-security" aria-labelledby="dame-phone-security-title">
      <div className="dame-phone-security-copy">
        <p className="dame-kicker">Protect your points</p>
        <h2 id="dame-phone-security-title">
          {state === 'code' ? 'Check your messages.' : 'One quick security step.'}
        </h2>
        <p>
          {state === 'code'
            ? `Enter the code sent to ${maskedPhone(phone)}.`
            : state === 'challenge'
              ? `We’ll text ${maskedPhone(phone)} to make sure it’s you.`
              : 'Verify one mobile number to claim receipts and use rewards. This helps keep every member’s points safe.'}
        </p>
      </div>
      <BeanStateImage state="rewards" className="dame-phone-security-bean" decorative />
      <div className="dame-phone-security-action">
        {state === 'enroll' ? (
          <label>
            <span>Mobile number</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-5555"
            />
          </label>
        ) : null}

        {state === 'code' ? (
          <form onSubmit={verifyCode}>
            <label>
              <span>Verification code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                required
              />
            </label>
            <button className="dame-button" type="submit" disabled={working}>
              {working ? 'Verifying…' : 'Verify my phone'}
            </button>
          </form>
        ) : (
          <button className="dame-button" type="button" onClick={() => void sendCode()} disabled={working || cooldown > 0}>
            {working ? 'Sending…' : 'Text me a code'}
          </button>
        )}

        {state === 'code' ? (
          <button className="dame-phone-resend" type="button" onClick={() => void sendCode()} disabled={working || cooldown > 0}>
            {cooldown ? `Send another code in ${cooldown}s` : 'Send another code'}
          </button>
        ) : null}
        {message ? <p className="dame-rewards-success" role="status">{message}</p> : null}
        {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}
      </div>
    </section>
  );
}
