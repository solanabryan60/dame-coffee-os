'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readAuthUser } from '../lib/supabase-rest';
import { saveCustomerSession } from '../lib/customer-session';

// Supabase's email link returns an implicit session in the URL fragment.
// Never log it, and remove it before making any further requests.
export default function CustomerAuthReturn() {
  const router = useRouter();
  const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken && !params.has('error_description')) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!accessToken || !refreshToken) {
      setError('This email link has expired or was already used. Sign in or request a fresh confirmation email.');
      return;
    }
    void readAuthUser(accessToken).then((user) => {
      saveCustomerSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Number(params.get('expires_in')) || 3600,
        user,
      });
      window.dispatchEvent(new Event('dame-auth-ready'));
      router.replace(params.get('type') === 'recovery' ? '/rewards/reset' : '/rewards/account');
    }).catch(() => setError('We could not verify this email link. Please sign in or request a new link.'));
  }, [router]);
  return error ? <aside className="dame-auth-return-error" role="alert">{error} <a href="/rewards/account">Go to sign in</a><button type="button" onClick={() => setError('')} aria-label="Dismiss email link message">×</button></aside> : null;
}
