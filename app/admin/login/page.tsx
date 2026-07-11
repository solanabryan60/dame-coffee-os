'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '../../lib/supabase-rest';

const TOKEN_KEY = 'dame_admin_access_token';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('info@damecoffeeco.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(TOKEN_KEY)) router.replace('/admin');
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await loginAdmin(email.trim(), password);
      window.localStorage.setItem(TOKEN_KEY, session.access_token);
      router.replace('/admin');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-card login-card">
        <p className="eyebrow">DAME COFFEE OS</p>
        <h1>Admin sign in</h1>
        <p>Update today&apos;s location, ordering status, hours, and wait time.</p>
        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button className="pill solid full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Link href="/" className="admin-back">← Return to website</Link>
      </section>
    </main>
  );
}
