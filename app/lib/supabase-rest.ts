export type SiteSettings = {
  id: number;
  location_title: string;
  address: string;
  directions: string;
  hours: string;
  is_open: boolean;
  mobile_ordering: boolean;
  wait_minutes: number;
  maps_url: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing in Vercel.');
  }
  return { supabaseUrl, supabaseKey };
}

export async function readSiteSettings(): Promise<SiteSettings> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/site_settings?id=eq.1&select=*`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${config.supabaseKey}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not load site settings.');
  }

  const rows = (await response.json()) as SiteSettings[];
  if (!rows[0]) throw new Error('The site_settings row has not been created.');
  return rows[0];
}

export async function loginAdmin(email: string, password: string) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.msg || 'Login failed.');
  }
  return payload as { access_token: string; refresh_token: string; expires_in: number };
}

export async function updateSiteSettings(
  settings: SiteSettings,
  accessToken: string,
): Promise<void> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/site_settings?id=eq.1`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        location_title: settings.location_title,
        address: settings.address,
        directions: settings.directions,
        hours: settings.hours,
        is_open: settings.is_open,
        mobile_ordering: settings.mobile_ordering,
        wait_minutes: settings.wait_minutes,
        maps_url: settings.maps_url,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not save changes.');
  }
}
