# deepakfinance — Razorpay Test Mode starter

This is a small local demo: a sample digital-product storefront, an Express backend, Razorpay order creation, and payment-signature verification.

## Before you start
- Use **Razorpay Test Mode** keys only.
- Never put the Key Secret in browser code or share it publicly.
- The sample product names and prices are placeholders. Update the catalogue in `server.js` and the display in `public/index.html` together.
- This is not production-ready. It does not connect to Supabase, persist orders, issue entitlements, or securely deliver PDFs. Do not accept live payments with it.

## Run locally
1. Install Node.js (LTS) from https://nodejs.org if it is not already installed.
2. Extract this ZIP.
3. In the extracted folder, copy `.env.example` to a new file named `.env`.
4. Open `.env` and replace the two placeholder values with your Razorpay **Test Key ID** and **Test Key Secret**.
5. Open a terminal in this folder and run:
   `npm install`
   `npm start`
6. Visit http://localhost:3000

If the `.env` file is hidden by Windows, enable **View → Show → File name extensions** and **View → Show → Hidden items** in File Explorer.

## Test payment
Use Razorpay's documented test payment details in the checkout flow. Test Mode does not charge real money. Check the current Razorpay test-card documentation for the test method available to your account.

## Security
The server uses the secret only on the backend and verifies the checkout signature. A verified signature alone is not a complete production fulfilment system. Before going live, add server-side order persistence, webhook reconciliation, authenticated customer ownership, one-time/appropriate entitlement handling, and private signed PDF delivery.
