# Dame Coffee mobile app

This folder is the native iPhone and Android customer app. It is intentionally separate from the Next.js website while sharing Dame's live menu, location, events, rewards, ordering, and catering services.

## Current foundation

- Native iOS and Android project powered by Expo and React Native
- Dame app identity and bundle IDs (`com.damecoffeeco.app`)
- Native Today, Menu, Order, Catering, and Rewards navigation
- Live public data from `https://www.damecoffeeco.com/api/mobile/bootstrap`
- Pull-to-refresh and offline-safe fallback content
- Existing web checkout links remain available during native payment development

## Required before public release

1. Apple Developer Program membership for Dame Coffee Co LLC.
2. Google Play Console organization account.
3. Square Developer application with production Application ID and Location ID.
4. Apple Pay Merchant ID and Square payment-processing certificate.
5. Google Pay production profile.
6. App Store privacy policy, support page, screenshots, and review account.

## Payment phase

Square's In-App Payments SDK will tokenize Apple Pay, Google Pay, and card payments. Dame's server will create the Square payment and order. Access tokens must stay on the server and must never be included in the mobile app.

## Updates

- Menu, location, sold-out status, events, rewards, and prices update from Dame's backend without a store release.
- JavaScript, styling, copy, and image fixes can use EAS Update.
- Native SDK, permission, or entitlement changes require a new App Store / Google Play build.

## Local setup

```bash
cd mobile
pnpm install
pnpm start
```

Set `EXPO_PUBLIC_DAME_API_URL` only when testing against a non-production Dame server.
