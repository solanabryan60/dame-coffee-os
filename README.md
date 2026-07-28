# Dame Coffee OS 1.0 — Foundation

The Foundation release gives Dame Coffee a focused, mobile-first public homepage while preserving the private Supabase control center.

## Public experience

- Cinematic, full-height hero using current Dame photography
- Responsive desktop and mobile navigation
- Live “Find Dame Today” card
- Correct open and closed homepage messaging
- Ordering automatically pauses when the shop is closed or mobile ordering is off
- Editorial product and mission sections
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
```

Never commit passwords, service-role keys, database passwords, or secret API keys.

## Production deployment

The GitHub `main` branch is connected to the existing Vercel project. A merge into `main` creates a new production deployment automatically.

Keep these variables configured in Vercel for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The database schema remains in `supabase-setup.sql`. Dame Coffee OS 1.0 Foundation does not require a database migration.
