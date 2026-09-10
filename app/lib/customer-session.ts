'use client';

import {
  AuthSession,
  refreshCustomerSession,
} from './supabase-rest';

export const CUSTOMER_SESSION_KEY = 'dame_rewards_session';

export function saveCustomerSession(session: AuthSession) {
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({
    ...session,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in,
  }));
}

export function clearCustomerSession() {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

let refreshInFlight: Promise<AuthSession | null> | null = null;

export async function getCustomerSession(): Promise<AuthSession | null> {
  const saved = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!saved) return null;

  let session: AuthSession;
  try {
    session = JSON.parse(saved) as AuthSession;
  } catch {
    clearCustomerSession();
    return null;
  }

  try {
    const expiresAt = session.expires_at ?? 0;
    const shouldRefresh = !expiresAt || expiresAt * 1000 < Date.now() + 60_000;
    if (!shouldRefresh) return session;

    if (!refreshInFlight) {
      refreshInFlight = refreshCustomerSession(session.refresh_token)
        .then((refreshed) => { saveCustomerSession(refreshed); return refreshed; })
        .catch((error) => {
          // A network outage must not erase a customer's saved account session.
          if (/refresh token|invalid grant|session.*expired/i.test(String(error))) clearCustomerSession();
          throw error;
        })
        .finally(() => { refreshInFlight = null; });
    }
    return await refreshInFlight;
  } catch {
    return null;
  }
}
