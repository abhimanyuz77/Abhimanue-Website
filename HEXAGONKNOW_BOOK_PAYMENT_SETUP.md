# From Zero to Hired — hexagonknow.com Payment Setup

Everything needed on **hexagonknow.com** to run the ₹99 book checkout and hand the
buyer over to the api.abhimanue.in Django backend for signed-URL delivery.

Companion documents (abhimanue.in repo):
- `FROM_ZERO_TO_HIRED_PAYMENT_SETUP.md` — the landing page + payment product overview
- `FROM_ZERO_TO_HIRED_FULFILMENT_SETUP.md` — the full Django-side specification (claim endpoint, signed URLs, webhook)

## §1 Files to deploy on hexagonknow.com

| File (from Abhimanue-Website repo) | Deploy location on hexagonknow.com |
|---|---|
| `abhimanue-book-payment.html` | Site root → `https://hexagonknow.com/abhimanue-book-payment.html` |
| `functions/api/abhimanue-book-payment.js` | `functions/api/abhimanue-book-payment.js` → `/api/abhimanue-book-payment` |

Backend product table (inside `functions/api/abhimanue-book-payment.js`, fixed
server-side — never trusted from the client):

```js
'from-zero-to-hired': {
  name: 'From Zero to Hired — Digital Edition (PDF + EPUB)',
  amount: 99,    // INR — ₹99
  currency: 'INR'
}
```

Environment variables (already set on the hexagonknow.com Cloudflare Pages
project — nothing new to add):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ABHIMANUE_KV` (optional — order/verification logging)

## §2 The one required change

In `abhimanue-book-payment.html`, point the post-payment redirect at the LMS
claim endpoint:

```js
// BEFORE
var DEFAULT_RETURN_URL = 'https://abhimanue.in/from-zero-to-hired.html';

// AFTER
var DEFAULT_RETURN_URL = 'https://api.abhimanue.in/api/v1/books/from-zero-to-hired/claim';
```

That is the only code change required on hexagonknow.com. Everything else on the
payment page already works:

- `verify-payment` validates the Razorpay HMAC signature and confirms capture
- After verification, `buildCallbackUrl` redirects the buyer to
  `DEFAULT_RETURN_URL` (or a `?return_url=` override) with:
  `payment_status=success`, `order_id`, `payment_id`, `signature`, `product`,
  `name`, `email`, `phone`, `customer_id` — exactly the parameters the LMS claim
  endpoint reads
- The LMS re-verifies the payment server-to-server via
  `GET /api/abhimanue-book-payment?action=check-payment&payment_id=pay_...`
  before issuing any signed download links, so the redirect parameters are never
  trusted on their own

## §3 The flow after the change

```
abhimanue.in                          hexagonknow.com                          api.abhimanue.in
────────────                          ────────────────                          ──────────────────
from-zero-to-hired.html
  "Get Your Copy – ₹99"
        │
        ▼
abhimanue-book-payment.html
  1. create-order (₹99 fixed server-side)
  2. Razorpay Checkout
  3. verify-payment (HMAC + captured)
  4. redirect buyer ──────────────────────────────────►  /api/v1/books/from-zero-to-hired/claim
                                                          5. LMS re-verifies via check-payment
                                                          6. Creates BookPurchase (idempotent)
                                                          7. Signs PDF + EPUB + toolkit URLs
                                                          8. Download page + links email
```

## §4 Pre-flight check (before deploying the change)

Confirm the LMS claim endpoint is live before flipping `DEFAULT_RETURN_URL` —
otherwise buyers would land on a 404 after paying:

```bash
curl -i "https://api.abhimanue.in/api/v1/books/from-zero-to-hired/claim?order_id=order_test&payment_id=pay_test"
```

Expected: an HTTP response from the LMS (e.g. `402` with the payment-not-verified
page, or a JSON error body) — **any response means routing works**. A DNS error,
connection failure or `404` means the endpoint is not live yet; keep the landing
page return URL until it is.

## §5 Deploy checklist

- [ ] `abhimanue-book-payment.html` deployed to hexagonknow.com site root (with the §2 change applied)
- [ ] `functions/api/abhimanue-book-payment.js` deployed to `functions/api/`
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` env vars confirmed
- [ ] Pre-flight check (§4) passed — LMS claim endpoint responds
- [ ] End-to-end test: buy the book (₹99), confirm you land on the LMS download page, both files download, email with links arrives
- [ ] Order appears in the Razorpay dashboard with notes `product: from-zero-to-hired`, `formats: PDF + EPUB`

## §6 Rollback

If the LMS handoff misbehaves, revert the single line in §2 back to
`https://abhimanue.in/from-zero-to-hired.html` and redeploy. The landing page's
success banner still works as a fallback, and fulfilment falls back to manual
delivery from the Razorpay dashboard order notes until the redirect is restored.

## Test card (Razorpay test mode)

- Card: `4111 1111 1111 1111` · any future expiry · any CVV · any name
