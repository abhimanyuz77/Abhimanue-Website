# The Survivor — Sculpture Acquisition Payment Setup Guide

This document covers the payment integration for **The Survivor**, a one-of-one
natural sculpture sold for **USD 10,000** through Hexagon Know's Razorpay
infrastructure. `abhimanue.in` sends the buyer to the hosted payment page; the
payment is completed and verified on `hexagonknow.com`.

## Product Details
- **Product ID:** `the-survivor`
- **Product Name:** The Survivor — Natural Sculpture (Edition 1 of 1)
- **Price:** USD 10,000 (fixed server-side — never trust client amounts)
- **Currency:** `USD`
- **Terms:** All sales final — no refunds, returns or exchanges
- **Shipping:** Free insured worldwide shipping (address collected at checkout)
- **Branding:** Hexagon Know (by Abhimanue)
- **Payment Processor:** Hexagon Know Pvt Ltd (Razorpay)

## Files to Deploy on hexagonknow.com

| File (from Abhimanue-Website repo) | Deploy location on hexagonknow.com |
|---|---|
| `abhimanue-survivor-payment.html` | Site root → `https://hexagonknow.com/abhimanue-survivor-payment.html` |
| `functions/api/abhimanue-survivor-payment.js` | `functions/api/abhimanue-survivor-payment.js` → `/api/abhimanue-survivor-payment` |

## Flow

```
abhimanue.in/the-survivor.html            hexagonknow.com                     abhimanue.in
─────────────────────────────             ────────────────                    ─────────────
1. Buyer fills acquisition form
   (name, email, phone, message)
2. Inquiry posted to /api/contact
   (studio notified)
3. Redirect to payment page with
   name/email/phone/return_url
                                        4. Buyer confirms/collects details
                                        5. Buyer fills SHIPPING ADDRESS
                                           (street, city, state, zip, country)
                                        6. Buyer ticks "final sale" checkbox
                                        7. create-order → Razorpay checkout
                                        8. verify-payment (HMAC signature)
                                        9. Redirect back to return_url
                                                                            10. the-survivor.html loads
                                                                                with payment params
```

## Payment Page URL

```
https://hexagonknow.com/abhimanue-survivor-payment.html
```

## URL Parameters (abhimanue.in → payment page)

| Parameter     | Required | Description                                    | Example                              |
|---------------|----------|------------------------------------------------|--------------------------------------|
| `name`        | No       | Buyer's full name (pre-fills form)             | `John Collector`                     |
| `email`       | No       | Buyer's email                                  | `buyer@example.com`                  |
| `phone`       | No       | 10–15 digit phone number                       | `919876543210`                       |
| `customer_id` | No       | Internal ID — passed through & stored          | `INQ_1042`                           |
| `return_url`  | No       | Redirect target after verified payment         | `https://abhimanue.in/the-survivor.html` |

\* If `name`, `email` **and** `phone` are all present, the personal-details form
is hidden. **The shipping address fields and the terms checkbox are always
shown** — the artwork is physically delivered, so the address is mandatory.

Default `return_url`: `https://abhimanue.in/the-survivor.html`

## Callback Parameters (payment page → abhimanue.in)

On **verified** success the buyer is redirected to `return_url` with:

| Parameter        | Description                                  |
|------------------|----------------------------------------------|
| `payment_status` | Always `success`                             |
| `order_id`       | Razorpay order ID (`order_...`)              |
| `payment_id`     | Razorpay payment ID (`pay_...`)              |
| `signature`      | Razorpay HMAC signature                      |
| `product`        | `the-survivor`                               |
| `customer_id`    | Echoed back if sent                          |
| `name`, `email`, `phone` | Buyer details                        |

## Backend API — `/api/abhimanue-survivor-payment`

| Action           | Method | Purpose                                             |
|------------------|--------|-----------------------------------------------------|
| `get-key`        | GET    | Returns publishable `RAZORPAY_KEY_ID`               |
| `create-order`   | POST   | Creates Razorpay order; requires name, email, phone **and full shipping address** (validated server-side) |
| `verify-payment` | POST   | Verifies HMAC SHA256 signature + confirms capture via Razorpay API |
| `check-payment`  | GET    | `?payment_id=pay_...` — server-to-server status check, returns `paid`, amount, currency, and `shipping_address` |

### Shipping address storage
- The buyer's address is stored in the **Razorpay order notes** (single-line,
  max 250 chars) — visible directly in the Razorpay dashboard on each payment.
- The full structured address (line1/line2/city/state/zip/country) is written
  to the `ABHIMANUE_KV` order log if the KV binding is configured.

## Required Environment Variables (hexagonknow.com Cloudflare project)

- `RAZORPAY_KEY_ID` — already set (shared with existing payment pages)
- `RAZORPAY_KEY_SECRET` — already set
- `ABHIMANUE_KV` (optional KV binding — order/verification logging)

## Razorpay Dashboard — required setting

**USD charges require international payments to be enabled:**
Razorpay Dashboard → Settings → International Payments → Enable.

Without this, `create-order` for `currency: 'USD'` will be rejected by the
Razorpay API. If international payments cannot be enabled, change `currency`
to `'INR'` and `amount` to the INR equivalent in the `COURSES` map inside
`functions/api/abhimanue-survivor-payment.js` (one line), and update the
displayed price on the payment page.

## Deploy Checklist

- [ ] Copy `abhimanue-survivor-payment.html` to hexagonknow.com site root
- [ ] Copy `abhimanue-survivor-payment.js` to `functions/api/`
- [ ] Confirm `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` env vars are set
- [ ] (Optional) Bind `ABHIMANUE_KV` for order logging
- [ ] Enable international payments in Razorpay dashboard
- [ ] Test end-to-end: the-survivor.html → form → checkout → Razorpay test card → redirect back
- [ ] Confirm shipping address appears on the order in Razorpay dashboard

## Test Card (Razorpay test mode)

- Card: `4111 1111 1111 1111` · any future expiry · any CVV · any name
- International test cards may be needed for USD currency orders.
