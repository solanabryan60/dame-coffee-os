# Dame Coffee OS — Phase 4 Dame Rewards

Dame Coffee OS is the public website, pickup-ordering experience, rewards program, and private control center for Dame Coffee.

Phase 4 replaces the paid Square Loyalty add-on with a Dame-owned rewards ledger in Supabase. Square still handles the catalog, orders, pickup fulfillment, and secure payments.

## What customers can do

- See where Dame is serving today
- Browse a live menu synced from the Square Catalog
- Place pickup orders through Square-hosted checkout
- Create a Dame Rewards account
- Earn 1 Dame point per eligible $1 on signed-in purchases
- View points and recent activity
- Exchange points for one-time reward codes
- Cancel an unused code and return the points to their balance

The initial rewards are:

- 25 points — free drink add-on
- 75 points — free food item
- 100 points — free Dame drink

## What Dame staff can do

The private `/admin` dashboard keeps all existing live-location controls and adds reward-code redemption.

Staff can:

- Update the current location, directions, hours, wait time, and open/closed status
- Turn mobile ordering on or off
- Enter an eight-character customer reward code
- See the reward and customer attached to that code
- Mark the code used after applying the matching free item in Square POS

## How points are awarded

Signed-in web orders are linked to the member before Square checkout opens. When Square confirms a completed payment, the verified webhook awards points. Completed refunds reverse the matching points.

For an in-person Square POS sale, points can be matched when the order has a Square customer attached whose email or mobile number matches the member’s Dame profile.

Webhook processing is idempotent: repeated Square notifications cannot award the same payment twice.

## Database setup

Apply these SQL files in order:

1. `supabase-setup.sql`
2. `supabase-phase3-rewards.sql`
3. `supabase-phase4-owned-rewards.sql`

Phase 4 creates:

- `rewards_accounts`
- `reward_definitions`
- `rewards_order_links`
- `reward_ledger`
- `reward_redemptions`

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
- Used and expired reward codes cannot be redeemed again
- `/admin` and `/admin/login` still work
