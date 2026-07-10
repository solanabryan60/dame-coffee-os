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
