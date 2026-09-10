'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import SiteHeader from '../../components/site-header';
import SiteFooter from '../../components/site-footer';
import { getCustomerSession } from '../../lib/customer-session';
import { updateCustomerPassword } from '../../lib/supabase-rest';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const check = () => { void getCustomerSession().then((session) => setReady(Boolean(session))); };
    check();
    window.addEventListener('dame-auth-ready', check);
    return () => window.removeEventListener('dame-auth-ready', check);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (password.length < 8 || password !== confirm) { setError('Use at least 8 characters and make sure both passwords match.'); return; }
    setBusy(true);
    try {
      const session = await getCustomerSession();
      if (!session) throw new Error('Request a new password reset email from the sign-in page.');
      await updateCustomerPassword(session.access_token, password);
      setPassword(''); setConfirm(''); setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="dame-site dame-inner-page"><SiteHeader /><section className="dame-account-empty">
    <p className="dame-kicker">Dame Rewards</p><h1>{done ? 'Password updated.' : 'A fresh start.'}</h1>
    {done ? <Link className="dame-button" href="/rewards/account">Open my account</Link> : ready ? <form className="dame-rewards-form" onSubmit={submit}>
      <label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <label>Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
      {error ? <p role="alert">{error}</p> : null}<button className="dame-button" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
    </form> : <p>Open the newest reset link in your email, or <Link href="/rewards/account">request a new one from sign in</Link>.</p>}
  </section><SiteFooter beanState="waving" /></main>;
}
