/**
 * The Survivor — Sculpture Acquisition Payment Backend
 * Hosted on hexagonknow.com at /api/abhimanue-survivor-payment
 * (Cloudflare Pages Function)
 *
 * Actions:
 *   GET  ?action=get-key                          → Razorpay publishable key ID
 *   POST { action: 'create-order', product, name, email, phone, customer_id }
 *        → creates a Razorpay order (amount fixed server-side)
 *   POST { action: 'verify-payment', razorpay_order_id, razorpay_payment_id,
 *          razorpay_signature }
 *        → verifies HMAC signature + confirms capture via Razorpay API
 *   GET  ?action=check-payment&payment_id=pay_...
 *        → server-to-server status check used by abhimanue.in
 *
 * Env vars (Cloudflare Pages → Settings → Environment variables):
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 *   ABHIMANUE_KV (optional KV binding — order/verification logging)
 *
 * NOTE: USD charges require international payments enabled on the
 * Razorpay account (Dashboard → Settings → International Payments).
 */

const COURSES = {
  'the-survivor': {
    name: 'The Survivor — Natural Sculpture (Edition 1 of 1)',
    amount: 10000,         // USD — $10,000 private acquisition
    currency: 'USD'
  }
};

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function authHeader(env) {
  return 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
}

async function verifySignature(orderId, paymentId, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${orderId}|${paymentId}`)
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

async function fetchPayment(env, paymentId) {
  const res = await fetch(`${RAZORPAY_API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader(env) }
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchOrder(env, orderId) {
  const res = await fetch(`${RAZORPAY_API}/orders/${orderId}`, {
    headers: { Authorization: authHeader(env) }
  });
  if (!res.ok) return null;
  return res.json();
}

async function logToKV(env, key, record) {
  if (!env.ABHIMANUE_KV) return;
  try {
    await env.ABHIMANUE_KV.put(key, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });
  } catch (e) {
    console.error('KV log failed:', e);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'get-key') {
    if (!env.RAZORPAY_KEY_ID) {
      return json({ success: false, message: 'Payment gateway not configured' }, 500);
    }
    return json({ success: true, key: env.RAZORPAY_KEY_ID });
  }

  if (action === 'check-payment') {
    const paymentId = url.searchParams.get('payment_id');
    if (!paymentId) {
      return json({ success: false, message: 'payment_id is required' }, 400);
    }
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return json({ success: false, message: 'Payment gateway not configured' }, 500);
    }

    const payment = await fetchPayment(env, paymentId);
    if (!payment) {
      return json({ success: false, paid: false, message: 'Payment not found' }, 404);
    }

    const order = payment.order_id ? await fetchOrder(env, payment.order_id) : null;
    const notes = (order && order.notes) || payment.notes || {};
    const captured = payment.status === 'captured' || payment.status === 'authorized';

    return json({
      success: true,
      paid: captured,
      payment_id: payment.id,
      order_id: payment.order_id || '',
      status: payment.status,
      amount: payment.amount,               // cents (USD smallest unit)
      currency: payment.currency,
      product_id: notes.product || 'the-survivor',
      product_name: COURSES['the-survivor'].name,
      customer_id: notes.customer_id || '',
      student_name: notes.name || '',
      student_email: payment.email || notes.email || '',
      student_phone: payment.contact || notes.phone || '',
      shipping_address: notes.shipping || ''
    });
  }

  return json({ success: false, message: 'Unknown action' }, 400);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ success: false, message: 'Invalid request body' }, 400);
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ success: false, message: 'Payment gateway not configured' }, 500);
  }

  /* ---------- create-order ---------- */
  if (data.action === 'create-order') {
    const product = COURSES[data.product || 'the-survivor'];
    if (!product) {
      return json({ success: false, message: 'Unknown product' }, 400);
    }

    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const phone = (data.phone || '').trim();
    const customerId = (data.customer_id || '').trim();

    if (!name || !email || !phone) {
      return json({ success: false, message: 'Name, email and phone are required' }, 400);
    }

    // Shipping address is required — the artwork is physically delivered
    const s = data.shipping || {};
    const shipping = {
      line1: (s.line1 || '').trim(),
      line2: (s.line2 || '').trim(),
      city: (s.city || '').trim(),
      state: (s.state || '').trim(),
      zip: (s.zip || '').trim(),
      country: (s.country || '').trim()
    };
    if (!shipping.line1 || !shipping.city || !shipping.state || !shipping.zip || !shipping.country) {
      return json({ success: false, message: 'Complete shipping address is required' }, 400);
    }
    const shippingAddress = [shipping.line1, shipping.line2, shipping.city, shipping.state, shipping.zip, shipping.country]
      .filter(Boolean).join(', ').slice(0, 250);

    const orderPayload = {
      amount: product.amount * 100,          // cents (USD smallest unit)
      currency: product.currency,
      receipt: `surv_${Date.now()}`,
      notes: {
        product: 'the-survivor',
        source: 'abhimanue.in',
        customer_id: customerId,
        name,
        email,
        phone,
        shipping: shippingAddress
      }
    };

    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(env),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const order = await res.json();
    if (!res.ok || !order.id) {
      console.error('Razorpay order error:', res.status, order);
      return json({ success: false, message: 'Could not create the order. Please try again.' }, 502);
    }

    await logToKV(env, `order:${order.id}`, {
      order_id: order.id,
      product: 'the-survivor',
      amount: order.amount,
      currency: order.currency,
      customer_id: customerId,
      name,
      email,
      phone,
      shipping,
      status: 'created',
      created_at: new Date().toISOString()
    });

    return json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: env.RAZORPAY_KEY_ID
    });
  }

  /* ---------- verify-payment ---------- */
  if (data.action === 'verify-payment') {
    const orderId = data.razorpay_order_id;
    const paymentId = data.razorpay_payment_id;
    const signature = data.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return json({ success: false, verified: false, message: 'Missing payment details' }, 400);
    }

    const valid = await verifySignature(orderId, paymentId, signature, env.RAZORPAY_KEY_SECRET);
    if (!valid) {
      return json({ success: false, verified: false, message: 'Invalid payment signature' }, 400);
    }

    // Signature valid — also confirm the payment is actually captured
    const payment = await fetchPayment(env, paymentId);
    const captured = payment && (payment.status === 'captured' || payment.status === 'authorized');

    await logToKV(env, `order:${orderId}`, {
      order_id: orderId,
      payment_id: paymentId,
      status: captured ? 'completed' : (payment ? payment.status : 'unknown'),
      verified_at: new Date().toISOString()
    });

    if (!captured) {
      return json({
        success: false,
        verified: false,
        message: 'Payment is not captured yet. If money was deducted, it will auto-refund or settle — contact support if it persists.'
      }, 402);
    }

    return json({ success: true, verified: true, payment_id: paymentId, order_id: orderId });
  }

  return json({ success: false, message: 'Unknown action' }, 400);
}
