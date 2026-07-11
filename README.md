# Dame Coffee OS — v0.2

This version adds the first editable live-location control center.

## Change the live location

Open `app/site-config.ts` and edit:

- `title`: large location title
- `address`: exact public address
- `directions`: instructions for finding the cart
- `hours`: displayed operating hours
- `isOpen`: `true` or `false`
- `mobileOrdering`: `true` or `false`
- `waitMinutes`: current estimated wait
- `mapsUrl`: Google Maps directions link

Commit the edit in GitHub. Vercel will redeploy the site automatically.

## Mission statement

The complete mission statement is also stored in `app/site-config.ts`.

## Next phase

Replace this file-based control center with a private, phone-friendly admin dashboard and database.

## Private live-location dashboard

1. Run `supabase-setup.sql` in the Supabase SQL Editor.
2. In Supabase, go to Authentication -> Users -> Add user.
3. Create the admin user `info@damecoffeeco.com` with a strong password.
4. In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Redeploy, then visit `/admin/login`.

Never commit passwords, service-role keys, or secret API keys to GitHub.
