'use client';

import {
  AuthSession,
  refreshCustomerSession,
} from './supabase-rest';

export const CUSTOMER_SESSION_KEY = 'dame_rewards_session';

export function saveCustomerSession(session: AuthSession) {
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function clearCustomerSession() {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export async function getCustomerSession(): Promise<AuthSession | null> {
  const saved = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!saved) return null;

  try {
    const session = JSON.parse(saved) as AuthSession;
    const expiresAt = session.expires_at ?? 0;
    const shouldRefresh = !expiresAt || expiresAt * 1000 < Date.now() + 60_000;
    if (!shouldRefresh) return session;

    const refreshed = await refreshCustomerSession(session.refresh_token);
    saveCustomerSession(refreshed);
    return refreshed;
  } catch {
    clearCustomerSession();
    return null;
  }
}
