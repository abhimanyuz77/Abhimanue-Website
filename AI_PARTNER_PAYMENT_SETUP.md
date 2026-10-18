# AI Learning & Career Partner — Payment Setup Guide

This document describes the payment integration for the **AI Learning & Career Partner annual membership** sold on `abhimanue.in` and processed through Hexagon Know's payment infrastructure (hexagonknow.com).

It is written so it can be dropped into the hexagonknow.com codebase and handed to an AI agent or developer to set up / verify the payment page end to end.

## Product

- **Product name:** AI Learning & Career Partner — Annual Membership
- **Price:** ₹2,000 / year (one annual payment, 12 months access)
- **Branding:** Hexagon Know (Abhimanue)
- **Payment processor:** Razorpay via Hexagon Know Pvt Ltd
- **Note:** AI credits are *not* part of this payment — they are purchased separately inside the platform at `learn.abhimanue.in`.

## URLs & Endpoints

| Piece | Location |
|---|---|
| Payment page | `https://hexagonknow.com/abhimanue-ai-payment.html` |
| Success page | `https://hexagonknow.com/abhimanue-ai-payment-success.html` |
| Failure page | `https://hexagonknow.com/abhimanue-ai-payment-failed.html` |
| Backend API | `/api/abhimanue-ai-payment` (Cloudflare Pages Function) |
| Source CTA | `https://abhimanue.in/ai_learning_partner.html` → "Get Annual Access" |

## Flow

1. User clicks **Get Annual Access** on `abhimanue.in/ai_learning_partner.html`.
   - Link value lives in `Abhimanue-Website/assets/js/ai-career-partner.js` → `ACP_LINKS.membership`.
2. `abhimanue-ai-payment.html` collects Full Name, Email, Phone (auto pre-fills and hides the form when `?name=&email=&phone=` or `?customer_id=` are in the URL).
3. Page calls `GET /api/abhimanue-ai-payment?action=get-key` to fetch the Razorpay key ID.
4. `POST /api/abhimanue-ai-payment` with `action=create-order` → creates a Razorpay order for **₹2,000** (amount is fixed server-side in the `COURSES` table — never trusted from the client).
5. Razorpay Checkout opens; on success the page POSTs `action=verify-payment` → backend validates the `razorpay_signature` (HMAC-SHA256 via Web Crypto) and confirms payment status through the Razorpay API.
6. Verified → redirect to `abhimanue-ai-payment-success.html?ref=<order_id>&course=ai-partner-membership`. That page links the user to `https://learn.abhimanue.in/` to start using the platform.

## Files on hexagonknow.com

| File | Purpose |
|---|---|
| `abhimanue-ai-payment.html` | Payment capture page (dark theme, same style as `abhimanue-payment.html`) |
| `functions/api/abhimanue-ai-payment.js` | `get-key` / `create-order` / `verify-payment` / `get-payment-details` |
| `abhimanue-ai-payment-success.html` | Confirmation + order ID + link to `learn.abhimanue.in` |
| `abhimanue-ai-payment-failed.html` | Retry page (linked manually; verification failures currently alert in-page) |

Backend product table entry (must match the page exactly):

```js
'ai-partner-membership': {
  name: 'AI Learning & Career Partner - Annual Membership',
  amount: 2000,
  currency: 'INR'
}
```

Receipt prefix used: `aip_`. Order notes include `product: 'AI Learning & Career Partner'`, `source: 'abhimanue.in'`.

If these files do not exist yet, clone `abhimanue-payment.html` / `abhimanue-payment-success.html` / `abhimanue-payment-failed.html` and `functions/api/abhimanue-payment.js`, then apply the product name, `₹2,000` amount, `/api/abhimanue-ai-payment` endpoint, and back-links to `https://abhimanue.in/ai_learning_partner.html`.

## Required Environment Variables (Cloudflare Pages project)

All already exist for the other payment products — just confirm they are set:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ABHIMANUE_KV` (optional KV binding — logs orders/verification for 30 days)

No new env vars, routes, or wrangler changes are needed — Pages auto-deploys `functions/api/*`.

## Deploy & Test Checklist

1. Deploy the site (upload/commit new files → Cloudflare Pages rebuild).
2. Open `https://hexagonknow.com/abhimanue-ai-payment.html` — confirm it shows ₹2,000 / year.
3. Place a test order (test keys → Razorpay test card `4111 1111 1111 1111`; live keys → real charge, refund after).
4. Verify success redirect shows the order ID and "Go to Platform" reaches `learn.abhimanue.in`.
5. Confirm the order appears in the Razorpay dashboard and in the `ABHIMANUE_KV` namespace (`order:<order_id>`, status `completed`).

## Fulfilment

Manual, same as the coaching program — the verified payment lands in Razorpay + KV, and access at `learn.abhimanue.in` is granted manually. To automate later, add a Razorpay `payment.captured` webhook that calls the LMS backend to create/upgrade the member account.
