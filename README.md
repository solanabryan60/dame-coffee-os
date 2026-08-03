# Dame Coffee OS — Phase 9 Operations Center

Dame Coffee OS is the public website, pickup-ordering experience, rewards program, and private control center for Dame Coffee.

Phase 9 turns the private admin area into a focused, phone-friendly operations center. The overview shows what needs attention, then routes staff into a dedicated workspace for location, pickup orders, menu availability, catering, rewards, events, or notifications.

## Operations center

Visit `/admin` for the daily overview. Each workspace now has one purpose:

- `/admin/location` — current location, hours, wait time, open status, and mobile ordering
- `/admin/orders` — live Square-connected pickup queue
- `/admin/menu` — website menu availability overrides
- `/admin/catering` — deposits, event details, customer contact, notes, and status
- `/admin/rewards` — customer reward-code redemption and 2× points campaigns
- `/admin/events` — public upcoming-event publishing
- `/admin/notifications` — opt-in customer updates

The navigation stays available across every workspace, and the existing Supabase permissions and automatically refreshed admin session protect every private action.

## Pickup order center

When a customer begins Square checkout:

- Dame Coffee OS saves their pickup name, contact information, order items, customizations, quoted wait, and location snapshot
- The customer returns from Square to a private tracking link that cannot be guessed from the order number alone
- A verified Square `payment.updated` webhook moves the order from `Awaiting payment` to `Paid`
- Staff use `/admin/orders` to move the order through `Preparing`, `Ready for pickup`, and `Picked up`
- Status changes made in Square Order Manager automatically move the Dame tracker through Preparing, Ready, Picked up, or Cancelled
- The customer tracking page refreshes automatically as staff update the order
- Marking an order `Refund needed` sends staff to Square; a verified full Square refund automatically marks the order refunded

The pickup dashboard is separate from the main control center so live orders remain fast and focused during service.

## Catering request center

When a customer submits the catering estimator:

- Dame Coffee OS saves their contact details, event address, date, time, drink count, service hours, estimate, and Square order ID
- The request begins as `Awaiting deposit`
- A verified Square `payment.updated` webhook marks the $200 deposit paid
- Catering deposits are excluded from customer rewards points
- Staff can call or email the customer, open the event address in Google Maps, keep private notes, and move the request through the catering workflow
- Marking a request `Refund needed` gives staff a direct path to Square transactions
- A verified full Square refund automatically marks the request refunded

The dashboard supports these stages: awaiting deposit, deposit paid, contacted, confirmed, alternative proposed, refund needed, refunded, cancelled, and completed.

## Dame App

Visit `/app` to open the customer app home. Customers can:

- Add Dame to an iPhone or Android home screen
- Launch Dame full-screen with a branded app icon
- See the current location, open status, hours, and wait time
- Open pickup ordering when Dame is accepting mobile orders
- See their current points and next reward when signed in
- Jump directly to the menu, ordering, catering, or rewards
- Use a phone-friendly bottom navigation bar
- See published upcoming events and open their directions
- Choose whether to receive Dame updates on supported phones and browsers
- See a branded offline screen instead of a browser error when disconnected

The web app manifest starts installed sessions at `/app`. The service worker caches only the offline page and static Dame assets. API responses, customer rewards, orders, and other private data are never stored in the offline cache.

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

The private `/admin` dashboard keeps all existing live-location controls and adds reward-code redemption, promotion scheduling, upcoming-event publishing, and opt-in notifications. The focused `/admin/orders` dashboard manages live pickup orders.

Staff can:

- Update the current location, directions, hours, wait time, and open/closed status
- Turn mobile ordering on or off
- Enter an eight-character customer reward code
- See the reward and customer attached to that code
- Mark the code used after applying the matching free item in Square POS
- Schedule a named 2× points campaign for any date and time
- Apply a campaign to every eligible purchase or selected menu categories
- Turn a campaign on or off without deleting it
- Add, publish, hide, and remove upcoming events
- See how many devices have opted in to notifications
- Send a short notification that opens the Dame App, menu, ordering, rewards, catering, or homepage
- Review every website pickup order and its customer, items, customizations, location, and payment state
- Move pickup orders from paid to preparing, ready, and picked up while the customer watches their private tracker
- Flag an order for a Square refund and have the verified refund update Dame Coffee OS automatically
- Mark menu items sold out or available from `/admin/menu`
- Prevent sold-out items from being added through website checkout

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
8. `supabase-phase5-events-notifications.sql`
9. `supabase-phase6-catering-center.sql`
10. `supabase-phase7-pickup-center.sql`
11. `supabase-phase8-menu-availability.sql`

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

GOOGLE_MAPS_API_KEY=your-server-only-google-maps-key

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-web-push-public-key
VAPID_PRIVATE_KEY=your-server-only-web-push-private-key
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
- `order.updated`
- `order.fulfillment.updated`

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
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

Server-only production variables:

- `SUPABASE_SECRET_KEY`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_ENVIRONMENT=production`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SQUARE_WEBHOOK_NOTIFICATION_URL=https://www.damecoffeeco.com/api/webhooks/square`
- `NEXT_PUBLIC_SITE_URL=https://www.damecoffeeco.com`
- `GOOGLE_MAPS_API_KEY`
- `VAPID_PRIVATE_KEY`

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
- Published future events appear on the website and Dame App
- Hidden or past events do not appear publicly
- Notification permission is requested only after a customer chooses to opt in
- Notification sending remains limited to approved Dame admins
- Catering requests are visible and editable only to approved Dame admins
- Catering payments update the matching request and do not earn rewards points
- Full catering deposit refunds update the matching request automatically
- Pickup tracking links require both the order ID and its private tracking key
- Only approved Dame admins can read or update the pickup queue
- Completed Square payments move the matching pickup order to Paid
- Full Square refunds move the matching pickup order to Refunded
- Customer tracking pages never expose private staff notes or Square identifiers
- Sold-out controls are writable only by approved Dame admins
- Sold-out items remain visible to customers but cannot be checked out
- `/admin` and `/admin/login` still work

## Dame Insights

The admin overview includes a private Square-powered sales dashboard with Today, Week, Month, Quarter, and Year views. It combines completed register and online orders for the configured `SQUARE_LOCATION_ID` and shows net sales, total collected, order count, average order, sales rhythm, and top-selling items. The Square token stays server-only, and every analytics request requires an approved Dame admin session.
