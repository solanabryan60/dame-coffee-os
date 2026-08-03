'use client';

import {
  type AuthSession,
  readAuthUser,
  refreshCustomerSession,
} from './supabase-rest';

const ADMIN_SESSION_KEY = 'dame_admin_session';
const LEGACY_ACCESS_TOKEN_KEY = 'dame_admin_access_token';

let refreshPromise: Promise<AuthSession | null> | null = null;

export function saveAdminSession(session: AuthSession) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

async function refreshAdminSession(session: AuthSession) {
  if (!refreshPromise) {
    refreshPromise = refreshCustomerSession(session.refresh_token)
      .then((refreshed) => {
        saveAdminSession(refreshed);
        return refreshed;
      })
      .catch(() => {
        clearAdminSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function getAdminAccessToken(): Promise<string | null> {
  const saved = window.localStorage.getItem(ADMIN_SESSION_KEY);

  if (saved) {
    try {
      const session = JSON.parse(saved) as AuthSession;
      if (!session.access_token || !session.refresh_token) {
        throw new Error('Incomplete admin session.');
      }

      const expiresAt = session.expires_at ?? 0;
      const shouldRefresh = !expiresAt || expiresAt * 1000 < Date.now() + 60_000;
      if (!shouldRefresh) return session.access_token;

      return (await refreshAdminSession(session))?.access_token ?? null;
    } catch {
      clearAdminSession();
      return null;
    }
  }

  // Keep older logins working until their access token expires. The next sign-in
  // stores the complete refreshable session.
  const legacyToken = window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  if (!legacyToken) return null;

  try {
    await readAuthUser(legacyToken);
    return legacyToken;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function isAdminSessionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /jwt|token|unauthorized|sign in again|session has expired/i.test(message);
}
