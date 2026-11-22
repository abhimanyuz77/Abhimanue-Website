# From Zero to Hired — Book Payment Setup Guide

This document covers the payment integration for **From Zero to Hired**, the digital
career guidebook by Abhimanue Udayan, sold for **₹99 (INR)** through Hexagon Know's
Razorpay infrastructure. `abhimanue.in` sends the buyer to the hosted payment page;
the payment is completed and verified on `hexagonknow.com`.

## Product Details

- **Product ID:** `from-zero-to-hired`
- **Product Name:** From Zero to Hired — Digital Edition (PDF + EPUB)
- **Price:** ₹99 — one-time payment; charged amount is fixed server-side — never trust client amounts
- **Currency:** `INR`
- **Formats:** PDF + EPUB (both included with purchase)
- **Delivery:** Digital — instant delivery to the buyer's email after successful payment
- **Branding:** Hexagon Know (by Abhimanue)
- **Payment Processor:** Hexagon Know Pvt Ltd (Razorpay)

## Files to Deploy on hexagonknow.com

| File (from Abhimanue-Website repo) | Deploy location on hexagonknow.com |
|---|---|
| `abhimanue-book-payment.html` | Site root → `https://hexagonknow.com/abhimanue-book-payment.html` |
| `functions/api/abhimanue-book-payment.js` | `functions/api/abhimanue-book-payment.js` → `/api/abhimanue-book-payment` |

## Files on abhimanue.in

| File | Purpose |
|---|---|
| `from-zero-to-hired.html` | Book landing page (dark + green theme, self-contained CSS) |
| `assets/img/Book-Cover.jpg` | Book cover image (1024×1536) used by the landing page |

## Flow

```
abhimanue.in/from-zero-to-hired.html         hexagonknow.com                     api.abhimanue.in
─────────────────────────────                ────────────────                    ──────────────────
1. Buyer clicks "Get Your Copy – ₹99"
   (hero, nav, next-step or pricing CTA)
                                             2. Buyer fills NAME, EMAIL, PHONE
                                             3. Buyer ticks "digital product" checkbox
                                             4. create-order → Razorpay checkout
                                             5. verify-payment (HMAC signature)
                                             6. Redirect to LMS claim endpoint
                                                                                 7. /api/v1/books/from-zero-to-hired/claim
                                                                                    re-verifies via check-payment,
                                                                                    issues signed URLs + email
```

See `HEXAGONKNOW_BOOK_PAYMENT_SETUP.md` §2 for the `DEFAULT_RETURN_URL` change
that enables step 6, and `FROM_ZERO_TO_HIRED_FULFILMENT_SETUP.md` for the full
Django-side specification.

## Payment Page URL

```
https://hexagonknow.com/abhimanue-book-payment.html
```

## URL Parameters (abhimanue.in → payment page)

| Parameter     | Required | Description                                    | Example                                      |
|---------------|----------|------------------------------------------------|----------------------------------------------|
| `name`        | No       | Buyer's full name (pre-fills form)             | `Ravi Graduate`                              |
| `email`       | No       | Buyer's email                                  | `buyer@example.com`                          |
| `phone`       | No       | 10–15 digit phone number                       | `919876543210`                               |
| `customer_id` | No       | Internal ID — passed through & stored          | `INQ_1042`                                   |
| `return_url`  | No       | Redirect target after verified payment         | `https://api.abhimanue.in/api/v1/books/from-zero-to-hired/claim` |

\* If `name`, `email` **and** `phone` are all present, the personal-details form
is hidden and a summary is shown instead. The terms checkbox is always shown.

Default `return_url`: `https://api.abhimanue.in/api/v1/books/from-zero-to-hired/claim`

## Callback Parameters (payment page → LMS claim endpoint)

On **verified** success the buyer is redirected to `return_url` (the LMS claim
endpoint) with:

| Parameter        | Description                                  |
|------------------|----------------------------------------------|
| `payment_status` | Always `success`                             |
| `order_id`       | Razorpay order ID (`order_...`)              |
| `payment_id`     | Razorpay payment ID (`pay_...`)              |
| `signature`      | Razorpay HMAC signature                       |
| `product`        | `from-zero-to-hired`                          |
| `customer_id`    | Echoed back if sent                          |
| `name`, `email`, `phone` | Buyer details                        |

The LMS re-verifies these server-to-server before issuing signed URLs — the
parameters alone are never trusted. The landing page's success banner remains as
a fallback if the buyer later revisits `from-zero-to-hired.html?payment_status=success`.

## Backend API — `/api/abhimanue-book-payment`

| Action           | Method | Purpose                                             |
|------------------|--------|-----------------------------------------------------|
| `get-key`        | GET    | Returns publishable `RAZORPAY_KEY_ID`               |
| `create-order`   | POST   | Creates Razorpay order; requires name, email and phone (validated server-side) |
| `verify-payment` | POST   | Verifies HMAC SHA256 signature + confirms capture via Razorpay API |
| `check-payment`  | GET    | `?payment_id=pay_...` — server-to-server status check, returns `paid`, amount, currency, and buyer details |

### Order notes (visible in the Razorpay dashboard)

- `product: from-zero-to-hired`, `source: abhimanue.in`, `customer_id`, `name`,
  `email`, `phone`, `formats: PDF + EPUB`

## Required Environment Variables (hexagonknow.com Cloudflare project)

- `RAZORPAY_KEY_ID` — already set (shared with existing payment pages)
- `RAZORPAY_KEY_SECRET` — already set
- `ABHIMANUE_KV` (optional KV binding — order/verification logging)

No new env vars, routes, or wrangler changes are needed — Cloudflare Pages
auto-deploys `functions/api/*`.

## Deploy Checklist

- [ ] Copy `abhimanue-book-payment.html` to hexagonknow.com site root
- [ ] Copy `functions/api/abhimanue-book-payment.js` to `functions/api/`
- [ ] Confirm `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` env vars are set
- [ ] (Optional) Bind `ABHIMANUE_KV` for order logging
- [ ] Deploy `from-zero-to-hired.html` to abhimanue.in
- [ ] Add `assets/img/Book-Cover.jpg` book cover (done — 1024×1536)
- [ ] Test end-to-end: from-zero-to-hired.html → checkout → Razorpay test card → LMS claim → signed downloads + email
- [ ] Confirm the order appears in the Razorpay dashboard with PDF + EPUB notes

## Test Card (Razorpay test mode)

- Card: `4111 1111 1111 1111` · any future expiry · any CVV · any name

## Fulfilment

Digital delivery is handled by the **api.abhimanue.in academy Django backend**
via time-limited signed download URLs. After a verified payment, the buyer is
redirected to the LMS claim endpoint, which re-verifies the payment server-to-server
(using this deployment's `check-payment` action), records the purchase and issues
signed links for the PDF, EPUB and toolkit files — on the download page and by email.

**Full specification:** see `FROM_ZERO_TO_HIRED_FULFILMENT_SETUP.md` in this repo
(Django models/views/URLs/settings, the one-line `DEFAULT_RETURN_URL` change on the
payment page, an optional Razorpay `payment.captured` webhook, rollout order and
acceptance tests).

Until the LMS endpoint is live, fulfilment falls back to manual delivery from the
Razorpay dashboard order notes (name, email, phone, `formats: PDF + EPUB`).

## Sitemap

`from-zero-to-hired.html` has been added to `sitemap.xml` (priority 0.9, Books section).
