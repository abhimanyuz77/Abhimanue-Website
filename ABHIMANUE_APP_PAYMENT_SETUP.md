# Learn with Abhimanue App — Lifetime Access Payment Integration

## Overview

Lifetime access to the **Learn with Abhimanue app** is sold at **₹2,000 (one-time)**
via a hosted payment page on `hexagonknow.com` (Razorpay under Hexagon Know's
account). `abhimanue.in` sends the user to the payment link; after a verified
payment, the user is redirected back to `abhimanue.in` with payment details so
the app can activate lifetime access.

## Flow

```
abhimanue.in                              hexagonknow.com                        abhimanue.in
─────────────                             ─────────────────                      ─────────────
1. User clicks "Get Lifetime Access"
   (optionally logged in → user ID)
2. Redirect to payment page with
   name/email/customer_id in URL
                                        3. User pays ₹2,000 via Razorpay
                                        4. Backend verifies signature
                                        5. Redirect back to abhimanue.in
                                                                           6. Landing page reads callback
                                                                              params → calls your backend
                                                                           7. Backend verifies server-side
                                                                              via check-payment
                                                                           8. Grant lifetime access
```

## Payment Page URL

```
https://hexagonknow.com/abhimanue-app-payment.html
```

## URL Parameters (abhimanue.in → payment page)

| Parameter     | Required | Description                                        | Example                       |
|---------------|----------|----------------------------------------------------|-------------------------------|
| `name`        | No*      | Customer's full name                               | `Abhimanue Sharma`            |
| `email`       | No*      | Customer's email (used for account activation)     | `user@gmail.com`              |
| `phone`       | No*      | 10–15 digit phone number                           | `9876543210`                  |
| `customer_id` | No       | Your internal user ID — passed through & stored    | `USER_1042`                   |
| `return_url`  | No       | Override the callback URL (default below)          | `https://abhimanue.in/payment-success` |

\* If `name`, `email` **and** `phone` are all present, the form is hidden — one click
to pay. Otherwise the form is shown pre-filled.

Default callback URL: `https://abhimanue.in/payment-success`

> **Important:** URL-encode all values (`URLSearchParams` / `encodeURIComponent`).

## Linking from abhimanue.in

### Plain JavaScript

```html
<button onclick="buyLifetimeAccess()">Get Lifetime Access — ₹2,000</button>

<script>
function buyLifetimeAccess() {
    // Pull from your logged-in user session if available
    var params = new URLSearchParams({
        name:  currentUser.name,   // optional
        email: currentUser.email,  // recommended — used for activation
        phone: currentUser.phone,  // optional
        customer_id: currentUser.id
        // return_url: 'https://abhimanue.in/payment-success' // optional override
    });

    window.location.href =
        'https://hexagonknow.com/abhimanue-app-payment.html?' + params.toString();
}
</script>
```

### Simple link (no user context)

```html
<a href="https://hexagonknow.com/abhimanue-app-payment.html">
    Get Lifetime Access — ₹2,000
</a>
```

The user will fill in name/email/phone on the payment page itself. Note that
without `customer_id`/`email`, your backend has less context for activation —
prefer passing at least `email` and `customer_id` for logged-in users.

## Callback Parameters (payment page → abhimanue.in)

On **verified** success the user is redirected to `return_url` with:

| Parameter        | Description                                  |
|------------------|----------------------------------------------|
| `payment_status` | Always `success`                             |
| `order_id`       | Razorpay order ID (`order_...`)              |
| `payment_id`     | Razorpay payment ID (`pay_...`)              |
| `signature`      | Razorpay signature (optional HMAC check)     |
| `product`        | `app-lifetime`                               |
| `customer_id`    | Echoed back if you sent it                   |
| `name`, `email`, `phone` | Customer details entered/confirmed   |

Example:

```
https://abhimanue.in/payment-success?payment_status=success&order_id=order_ABC123&payment_id=pay_XYZ789&signature=9f2c...&product=app-lifetime&customer_id=USER_1042&email=user@gmail.com
```

> ⚠️ **Do not activate access based on these params alone** — they are user-visible
> and tamperable. Verify server-side first (below).

## Server-Side Verification (required before activation)

Your backend confirms the payment **server-to-server**:

```
GET https://hexagonknow.com/api/abhimanue-app-payment?action=check-payment&payment_id=<payment_id>
```

Response:

```json
{
  "success": true,
  "paid": true,
  "payment_id": "pay_XYZ789",
  "order_id": "order_ABC123",
  "status": "captured",
  "amount": 200000,
  "currency": "INR",
  "product_id": "app-lifetime",
  "product_name": "Learn with Abhimanue App - Lifetime Access",
  "customer_id": "USER_1042",
  "student_name": "Abhimanue Sharma",
  "student_email": "user@gmail.com",
  "student_phone": "9876543210"
}
```

`amount` is in **paise** (₹2,000 → `200000`). Grant access only when
`paid == true`, `order_id` matches the callback, and `amount == 200000`.

### Node.js / Express example

```javascript
// POST /api/activate-lifetime
// body: { payment_id, order_id, customer_id }
app.post('/api/activate-lifetime', async (req, res) => {
    const { payment_id, order_id, customer_id } = req.body;
    if (!payment_id || !order_id) {
        return res.status(400).json({ success: false });
    }

    const r = await fetch(
        `https://hexagonknow.com/api/abhimanue-app-payment?action=check-payment&payment_id=${payment_id}`
    );
    const data = await r.json();

    if (!data.success || !data.paid ||
        data.order_id !== order_id ||
        data.amount !== 200000 ||
        data.product_id !== 'app-lifetime') {
        return res.status(402).json({ success: false, message: 'Payment not verified' });
    }

    // Optional: match the customer who initiated the payment
    if (customer_id && data.customer_id && data.customer_id !== customer_id) {
        return res.status(400).json({ success: false, message: 'Customer mismatch' });
    }

    // Grant lifetime access (idempotent — safe if called twice)
    await grantLifetimeAccess(data.customer_id || data.student_email, {
        payment_id,
        order_id
    });

    res.json({ success: true });
});
```

### Python / Django example

```python
import requests
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@require_POST
def activate_lifetime(request):
    payment_id  = request.POST.get("payment_id", "")
    order_id    = request.POST.get("order_id", "")
    customer_id = request.POST.get("customer_id", "")

    r = requests.get(
        "https://hexagonknow.com/api/abhimanue-app-payment",
        params={"action": "check-payment", "payment_id": payment_id},
        timeout=10,
    )
    data = r.json()

    if not (r.ok and data.get("paid")
            and data.get("order_id") == order_id
            and data.get("amount") == 200000):
        return JsonResponse({"success": False}, status=402)

    # grant_lifetime_access should be idempotent
    grant_lifetime_access(
        customer_id or data["student_email"],
        payment_id=payment_id, order_id=order_id,
    )
    return JsonResponse({"success": True})
```

### Callback landing page (frontend)

```javascript
// On your /payment-success page
const params = new URLSearchParams(window.location.search);

if (params.get('payment_status') === 'success') {
    fetch('/api/activate-lifetime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            payment_id:  params.get('payment_id'),
            order_id:    params.get('order_id'),
            customer_id: params.get('customer_id')
        })
    }).then(r => r.json()).then(d => {
        // show "Access activated!" or error
    });
}
```

## Alternative: verify the signature yourself

If you prefer not to call `check-payment`, verify the Razorpay signature with
the shared `RAZORPAY_KEY_SECRET` (request it from Hexagon Know):

```javascript
const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

if (expected !== signature) { /* reject */ }
```

`check-payment` is preferred — it also confirms the payment was actually
**captured**, not just signed.

## Failure / abandoned payments

- Closing the Razorpay modal keeps the user on the payment page to retry.
- There is **no** failure redirect — nothing happens on abhimanue.in side.
- Record activation idempotently: re-submitting the same `payment_id` must not
  double-grant or error.

## Quick Reference

| Step      | URL |
|-----------|-----|
| Pay       | `https://hexagonknow.com/abhimanue-app-payment.html?name=..&email=..&phone=..&customer_id=..` |
| Callback  | `https://abhimanue.in/payment-success?payment_status=success&order_id=..&payment_id=..&signature=..&customer_id=..` |
| Verify    | `GET https://hexagonknow.com/api/abhimanue-app-payment?action=check-payment&payment_id=pay_...` |

## Environment / Dependencies

- Hexagon Know side uses the same `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` as
  the other endpoints — already configured on Cloudflare Pages.
- Optional `ABHIMANUE_KV` binding stores order records (same namespace as the
  Study Performance Coaching payments).
- abhimanue.in needs only HTTP access for `check-payment` (or the shared
  `RAZORPAY_KEY_SECRET` for signature verification).

## Support

For any integration issues, contact: **support@hexagonknow.com**
