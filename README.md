# Dame Coffee OS — v0.1 prototype

A working visual prototype for damecoffeeco.com with:

- Homepage and live-location section
- Menu structure
- Full mission statement
- Catering calculator with the provided drink/time pricing logic
- Dame Rewards preview
- Mobile-responsive layout
- Existing Dame Coffee assets and photos

## Run locally

1. Install Node.js 20+
2. Run `npm install`
3. Run `npm run dev`
4. Open `http://localhost:3000`

## Deploy

Push this folder to a GitHub repository and import it into Vercel. Because this is a commercial website, use a Vercel plan that permits commercial use.

## Still to connect

- Square Catalog, Orders, Payments, Customers, and Loyalty APIs
- Google Places/Maps for catering addresses and distance pricing
- Database and admin dashboard
- Authentication
- Live location/order toggle
- Real event calendar and booking holds
- Email/SMS confirmations
- Final licensed Cubao Wide webfont or logo-as-image treatment

## Catering formula currently implemented

- Base: 100 drinks / 2 hours = $600
- Each additional 50 drinks = +$150
- 4 hours = +$150
- 6–12 hours = +$300 for every additional 2 hours beyond 4
- Tax is displayed separately

Examples:

- 150 drinks / 2 hours = $750 + tax
- 300 drinks / 4 hours = $1,350 + tax
- 300 drinks / 6 hours = $1,650 + tax
