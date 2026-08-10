# Dame Coffee OS roadmap audit

Audited against the production code and Supabase schema on August 10, 2026. A feature is marked complete only when its customer or staff workflow exists in the application—not because it appeared in an earlier plan.

## Status at a glance

| Original phase | Status | What exists | What remains |
| --- | --- | --- | --- |
| 2 — Menu Experience | Complete with Phase 12 | Square-synced menu and pickup categories, descriptions, prices, photos, availability, featured and seasonal badges, website visibility, sold-out controls, and a private Menu Studio. Square safely owns sellable items, prices, and modifiers. | Add real item photos and descriptions as the catalog grows. |
| 3 — Event Booking | Partial | Catering estimator, address autocomplete and map, date and time, drink and service sliders, estimate, $200 Square deposit, Supabase request record, and full admin workflow. | Add company, guest count, indoor/outdoor, budget, and customer notes. |
| 4 — Rewards | Complete | Dame-owned accounts, points, redemptions, birthday rewards, referrals, 2× campaigns, and refund reversals. | Ongoing reward tuning only. |
| 5 — Customer Accounts | Partial | Customer profile, reward balance and activity, referrals, and reward redemption. | Add favorite drinks, pickup order history, and upcoming catering bookings to the customer account. |
| 6 — Online Ordering | Complete | Square catalog, grouped menu, modifiers, cart editing, Square checkout, pickup details, confirmation, tracking, and staff status controls. | Test the live Square Register notification flow on the physical device. |
| 7 — Admin Dashboard 2.0 | Complete | Focused workspaces for revenue, orders, catering, rewards, menu, inventory, locations, events, notifications, and daily prep. | Continue polishing as later features are added. |
| 8 — Inventory | Complete | Supplies, quantities, units, low-stock limits, notes, search, filters, and low/out alerts. | Optional future automatic ingredient depletion from sales. |
| 9 — Employee Portal | Partial | Daily opening, service, and closing checklists are live. | Add employee roles, clock-in/out, schedules, today’s event view, recipes, and training videos. |
| 10 — Analytics | Partial | Daily, weekly, monthly, quarterly, and yearly Square sales; selectable periods; drilldowns; orders; average ticket; tax; tips; discounts; service charges; and top items. | Add repeat-customer, event-booking, rewards-redemption, peak-hour, and category-specific pastry/drink views. |

## Completion order

1. **Customer + catering details** — closes the missing Phase 3 and Phase 5 customer-facing fields together.
2. **Employee Portal** — adds staff access, clocking, schedules, today’s assignments, recipes, and training.
3. **Advanced Analytics** — combines Square sales with Dame catering, rewards, and repeat-customer reporting.

Each release stays focused so ordering, payments, rewards, and the live business dashboard remain stable.
