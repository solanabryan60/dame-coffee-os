# Dame Coffee OS — Phase 2 Customer Experience

Phase 2 keeps the focused, mobile-first Foundation and adds a Square-powered menu and pickup-ordering experience. The private Supabase control center remains the source of truth for whether the cart is open and accepting orders.

## Public experience

- Focused full-height homepage with a direct “Find Us Today” journey
- Responsive navigation connecting real pages instead of one long homepage
- Live “Us, Today” card powered by the existing admin controls
- Correct open and closed homepage messaging
- Ordering automatically pauses when the shop is closed or mobile ordering is off
- Dedicated `/menu` page synced to the Square Catalog and organized into Basics, Specialty Drinks, Cold Foam Lovers, and Food Items
- Dedicated `/order` page for live pickup ordering
- Square-hosted checkout with item variations, modifiers, taxes, discounts, tips, and pickup fulfillment
- Checkout automatically pauses when the shop is closed or mobile ordering is off
- Order-complete page featuring the Dame Bean
- Dedicated `/rewards` page explaining benefits and collecting launch-list interest
- Dedicated `/catering` page with the approved drink, time, and price estimator
- Clean mission and information section
- Contact details and private admin link in the footer
- Accessible reduced-motion behavior

## Live location control center

Visit `/admin/login` and sign in with a user created in Supabase Authentication. The dashboard controls:

- Large location title
- Address and directions
- Hours
- Open or closed status
- Mobile ordering status
- Wait time
- Google Maps directions link

The public homepage reads those values from Supabase. If Supabase is temporarily unavailable, `app/site-config.ts` supplies a safe public fallback.

## Local development

```bash
npm install
npm run dev
```

Create `.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_LOCATION_ID=your-square-location-id
SQUARE_ENVIRONMENT=sandbox
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit passwords, service-role keys, database passwords, or secret API keys.

## Production deployment

The GitHub `main` branch is connected to the existing Vercel project. A merge into `main` creates a new production deployment automatically.

Keep these variables configured in Vercel for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Keep these Square variables restricted to Production:

- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_ENVIRONMENT=production`
- `NEXT_PUBLIC_SITE_URL=https://www.damecoffeeco.com`

The production access token is server-only and must never use a `NEXT_PUBLIC_` prefix. Preview deployments intentionally stay disconnected from live Square checkout until the branch is approved and merged.

The database schema remains in `supabase-setup.sql`. Phase 2 does not require a database migration.
