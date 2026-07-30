# Dame Coffee OS — Phase 4B Rewards Growth

Dame Coffee OS is the public website, pickup-ordering experience, rewards program, and private control center for Dame Coffee.

Phase 4B expands the Dame-owned rewards ledger with merchandise rewards, qualified friend referrals, and scheduled 2× points campaigns. Square still handles the catalog, orders, pickup fulfillment, and secure payments.

## What customers can do

- See where Dame is serving today
- Browse a live menu synced from the Square Catalog
- Place pickup orders through Square-hosted checkout
- Create a Dame Rewards account
- Earn 10 Dame points per eligible $1 on signed-in purchases
- View points and recent activity
- Exchange points for one-time reward codes
- Cancel an unused code and return the points to their balance
- Share a personal referral link
- Earn 500 points after a referred friend makes a first eligible $5 purchase
- Receive 250 welcome points when joining through a friend and completing that purchase
- Earn extra points during active Dame 2× campaigns

The rewards are:

- 200 points — free drink add-on
- 500 points — free food item
- 700 points — free Dame drink
- 2,500 points — Dame T-shirt
- 5,000 points — Dame hoodie
- 12,500 points — 1 lb bag of Dame beans
- 25,000 points — 5 lb bag of Dame beans

## What Dame staff can do

The private `/admin` dashboard keeps all existing live-location controls and adds reward-code redemption plus promotion scheduling.

Staff can:

- Update the current location, directions, hours, wait time, and open/closed status
- Turn mobile ordering on or off
- Enter an eight-character customer reward code
- See the reward and customer attached to that code
- Mark the code used after applying the matching free item in Square POS
- Schedule a named 2× points campaign for any date and time
- Apply a campaign to every eligible purchase or selected menu categories
- Turn a campaign on or off without deleting it

## How points are awarded

Signed-in web orders are linked to the member before Square checkout opens. When Square confirms a completed payment, the verified webhook awards 10 points per eligible dollar. Eligible spend excludes taxes, tips, and service charges. Completed refunds reverse the matching points.

If more than one points campaign is active, only the highest multiplier applies. Promotions do not stack.

A friend referral qualifies only after the new member completes a first eligible purchase of at least $5. Self-referrals are blocked, each new member can qualify only once, and each member may receive up to ten referrer bonuses per calendar month. A qualifying refund reverses the referral points.

For an in-person Square POS sale, points can be matched when the order has a Square customer attached whose email or mobile number matches the member’s Dame profile.

Webhook processing is idempotent: repeated Square notifications cannot award the same payment twice.

## Database setup

Apply these SQL files in order:

1. `supabase-setup.sql`
2. `supabase-phase3-rewards.sql`
3. `supabase-phase4-owned-rewards.sql`
4. `supabase-phase4b-rewards-growth.sql`
5. `supabase-phase4c-reward-refund-tracking.sql`
6. `supabase-phase4d-reward-policy-tuning.sql`
7. `supabase-phase4e-referral-threshold.sql`

Phase 4 and 4B create:

- `rewards_accounts`
- `reward_definitions`
- `rewards_order_links`
- `reward_ledger`
- `reward_redemptions`
- `reward_referrals`
- `reward_promotions`

Every customer-facing table has Row Level Security. Members can read only their own account, order links, activity, and redemptions. Point changes and reward use are handled through protected database functions.

## Local development

```bash
pnpm install
pnpm dev
```

Create `.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key

SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_LOCATION_ID=your-square-location-id
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=your-square-webhook-signature-key
SQUARE_WEBHOOK_NOTIFICATION_URL=http://localhost:3000/api/webhooks/square

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit passwords, database passwords, Supabase secret keys, Square access tokens, or webhook signature keys.

## Square webhook

Create a Square webhook subscription for:

```text
https://www.damecoffeeco.com/api/webhooks/square
```

Subscribe to:

- `payment.updated`
- `refund.updated`

Copy the subscription’s signature key into the production environment variable:

```text
SQUARE_WEBHOOK_SIGNATURE_KEY
```

The notification URL used to create the Square signature must exactly match `SQUARE_WEBHOOK_NOTIFICATION_URL`.

## Production deployment

The GitHub `main` branch is connected to the Dame Coffee Vercel project. Merging an approved pull request into `main` creates the production deployment.

Public variables for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only production variables:

- `SUPABASE_SECRET_KEY`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_ENVIRONMENT=production`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SQUARE_WEBHOOK_NOTIFICATION_URL=https://www.damecoffeeco.com/api/webhooks/square`
- `NEXT_PUBLIC_SITE_URL=https://www.damecoffeeco.com`

Preview deployments can display the customer rewards dashboard with the normal Supabase public variables. Live payment processing and Square webhooks remain production-only.

## Verification

Before publishing:

```bash
pnpm lint
pnpm build
```

Also confirm:

- Customers cannot see another member’s reward records
- Repeated webhook events do not duplicate points
- Refund events do not create negative balances
- Referral bonuses qualify only once and respect the monthly cap
- Qualifying refunds reverse referral bonuses
- The highest eligible live promotion is applied only once
- Category-limited promotions match Square Catalog categories
- Used and expired reward codes cannot be redeemed again
- `/admin` and `/admin/login` still work
