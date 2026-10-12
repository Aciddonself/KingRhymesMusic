# Flutterwave Payment Setup

Flutterwave is the payment provider currently wired into the app. Hosted checkout is used for song purchases and donations. PayPal and Stripe are not currently active options.

## 1. Configure Flutterwave credentials

In the Flutterwave dashboard, enable the payment methods and currencies for the countries where you operate. The app currently requests card and Uganda Mobile Money checkout.

Copy the secret API key and webhook secret hash into the server environment:

```env
FLW_SECRET_KEY=FLWSECK_TEST-...
FLW_SECRET_HASH=your-webhook-secret-hash
```

Use test credentials first. Keep both values server-side; never prefix them with `NEXT_PUBLIC_`, commit them, or paste them into chat. Add the same values to the deployment platform’s secret settings for production.

## 2. Register the webhook

In Flutterwave’s webhook settings, configure this HTTPS endpoint:

```text
https://YOUR_PUBLIC_DOMAIN/api/payments/webhook/flutterwave
```

Use the same secret hash as `FLW_SECRET_HASH` and subscribe to completed charge events. The webhook route rejects missing/incorrect signatures. It then asks Flutterwave’s transaction verification API to confirm the transaction reference, amount, currency, and customer email before marking a purchase or donation completed.

For local testing, Flutterwave must be able to reach your development server. Use a trusted HTTPS development tunnel and temporarily set both the webhook URL and `NEXT_PUBLIC_SITE_URL` to that public tunnel URL. Do not use the temporary tunnel for production.

## 3. Set the site URL and restart

Set `NEXT_PUBLIC_SITE_URL` to the exact public origin, for example `https://music.example.com`, with no trailing slash. Checkout sends customers to `/checkout/return`; the browser return is not trusted by itself and performs the same server-side transaction verification. Webhooks can complete the order even if the customer closes the browser.

Restart the app after changing environment settings. Locally, run `npm run dev`; in deployment, redeploy or restart the service so the new secrets are loaded.

## 4. Test before going live

1. Use Flutterwave test keys and a test payment method from Flutterwave’s dashboard documentation.
2. Buy a test song and confirm checkout opens on Flutterwave rather than showing an immediate success screen.
3. Complete a test payment and confirm the return page says payment confirmed and provides the download.
4. Confirm the matching record is completed in the admin dashboard and that the webhook returns success.
5. Cancel a payment and confirm no download is unlocked and no donation appears on the supporters wall.
6. Test a donation in each currency you plan to offer and verify the admin totals are shown in USD.
7. Switch to live API credentials only after test-mode transactions and webhooks work on the deployed HTTPS domain.

## Operational notes

- Amounts are based on USD prices and converted using the static rates in `src/lib/currency.ts`. Review and update those rates before accepting real payments in multiple currencies.
- Flutterwave availability, mobile-money methods, and currencies depend on the merchant account and country configuration.
- The app does not send its own receipt emails. Flutterwave may send provider receipts according to your account settings.
- Refunds are not initiated from the app; process them in Flutterwave and update your customer support workflow accordingly.
- Payment secrets and the webhook hash are required for the payment APIs to work. Without them, checkout is unavailable by design.