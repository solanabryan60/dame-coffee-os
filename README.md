# Dame Coffee OS — Phase 3 Rewards

Phase 3 adds real customer accounts and a secure Dame Rewards dashboard while preserving the focused public experience, Square-powered ordering, and private Supabase control center.

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
- Dedicated `/rewards` page where customers can join or sign in
- Private `/rewards/account` dashboard with points, reward progress, reward tiers, and profile controls
- Rewards members are prefilled at pickup checkout
- Square-hosted checkout displays loyalty options when the Square Loyalty program is active
- Dedicated `/catering` page with the approved drink, time, and price estimator
- Clean mission and information section
- Contact details and private admin link in the footer
- Accessible reduced-motion behavior

## Live location control center

Visit `/admin/login` and sign in with one of the approved Dame admin accounts. Phase 3 separates customer accounts from the private admin allowlist, so a rewards member cannot access the control center.

The dashboard controls:

- Large location title
- Address and directions
- Hours
- Open or closed status
- Mobile ordering status
- Wait time
- Google Maps directions link

The public homepage reads those values from Supabase. If Supabase is temporarily unavailable, `app/site-config.ts` supplies a safe public fallback.

## Customer accounts and rewards

Supabase Auth creates and signs in Dame Rewards members. The `customer_profiles` table stores only the member profile fields needed by Dame: first name, phone, optional birthday, and marketing consent. Row-level security limits every member to their own profile.

The rewards dashboard connects to Square using server-only credentials:

- It finds or creates the matching Square customer after the member explicitly connects.
- It enrolls the member in the active Square Loyalty program by mobile number.
- It reads the real Square point balance and reward tiers.
- It never exposes the Square access token to the browser.

Square Loyalty must be activated and configured in the Square Dashboard before real points or reward tiers appear. Until then, customer accounts still work and the dashboard clearly shows that rewards activation is pending.

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

## Phase 3 database migration

Apply `supabase-phase3-rewards.sql` once before publishing Phase 3. It:

- Creates the explicit `admin_users` allowlist and seeds only Dame's four approved admin emails
- Replaces the old broad settings-update policy with an admin-only policy
- Creates `customer_profiles` with row-level security
- Creates the private Auth trigger that prepares a profile for each new rewards member

`supabase-setup.sql` remains the base live-location schema. Never rerun a migration blindly on production.

After applying schema changes, check Supabase Security and Performance Advisors. Phase 3 has no table-policy warnings; the project may separately recommend enabling leaked-password protection in Auth settings.
