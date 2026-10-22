/**
 * Learn with Abhimanue App — Payment Callback & Activation (abhimanue.in)
 * Endpoint: POST /api/activate-app-access
 *
 * Called by payment-success.html after the Razorpay payment redirects back.
 * 1. Verifies the payment server-to-server via hexagonknow.com check-payment.
 * 2. Emails the support engineer a notification with ALL captured user
 *    details so they can send the user a platform invite.
 * 3. Sends the user a confirmation email (invite on the way).
 *
 * Env vars: RESEND_API_KEY (already used by the other signup functions).
 * Optional: ABHIMANUE_KV for idempotency (dedupes repeat activations).
 */

const CHECK_PAYMENT_URL =
  'https://hexagonknow.com/api/abhimanue-app-payment?action=check-payment&payment_id=';
const EXPECTED_AMOUNT = 200000; // paise — ₹2,000
const EXPECTED_PRODUCT = 'app-lifetime';
const SUPPORT_EMAILS = ['abhimanue@hexagonknow.com', 'support@hexagonknow.com'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendEmail(env, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Resend error:', res.status, body);
  }
  return res.ok;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ success: false, message: 'Invalid request body' }, 400);
  }

  const paymentId = (data.payment_id || '').trim();
  const orderId = (data.order_id || '').trim();
  const customerId = (data.customer_id || '').trim();

  if (!paymentId || !orderId) {
    return json({ success: false, message: 'Missing payment details' }, 400);
  }

  /* ---- Idempotency: don't process the same payment twice ---- */
  if (env.ABHIMANUE_KV) {
    try {
      const seen = await env.ABHIMANUE_KV.get(`activated:${paymentId}`);
      if (seen) {
        return json({ success: true, already_activated: true });
      }
    } catch (e) { /* non-fatal */ }
  }

  /* ---- Server-side verification via hexagonknow.com ---- */
  let check;
  try {
    const res = await fetch(CHECK_PAYMENT_URL + encodeURIComponent(paymentId));
    check = await res.json();
  } catch (e) {
    console.error('check-payment fetch failed:', e);
    return json({ success: false, message: 'Could not verify payment. Please contact support.' }, 502);
  }

  const verified =
    check && check.success && check.paid &&
    check.order_id === orderId &&
    check.amount === EXPECTED_AMOUNT &&
    check.product_id === EXPECTED_PRODUCT;

  if (!verified) {
    console.error('Payment verification failed:', JSON.stringify(check));
    return json({ success: false, message: 'Payment could not be verified. Please contact support.' }, 402);
  }

  if (customerId && check.customer_id && check.customer_id !== customerId) {
    return json({ success: false, message: 'Customer mismatch' }, 400);
  }

  /* ---- Merge details: server truth + callback params ---- */
  const name = check.student_name || data.name || '';
  const email = check.student_email || data.email || '';
  const phone = check.student_phone || data.phone || '';
  const amountInr = (check.amount / 100).toLocaleString('en-IN');
  const paidAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  if (!env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY — payment verified but support email NOT sent:', paymentId);
    return json({ success: true, verified: true, email_sent: false });
  }

  /* ---- 1) Support-engineer notification: send platform invite ---- */
  await sendEmail(env, {
    from: 'Abhimanue Website <noreply@hexagonknow.com>',
    to: SUPPORT_EMAILS,
    subject: `✅ App Payment Verified — Send Platform Invite: ${name} (${paymentId})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#064e3b,#065f46);padding:24px;border-radius:12px 12px 0 0;">
          <h2 style="color:#fff;margin:0;">New Paid Signup — Learn with Abhimanue App</h2>
          <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;">Payment verified. Please send this user a platform invite.</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;width:150px;">Full Name</td><td style="padding:9px 0;color:#555;">${esc(name)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Email</td><td style="padding:9px 0;color:#555;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Phone</td><td style="padding:9px 0;color:#555;">${esc(phone)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Customer ID</td><td style="padding:9px 0;color:#555;">${esc(check.customer_id || customerId || '—')}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Product</td><td style="padding:9px 0;color:#555;">${esc(check.product_name)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Amount Paid</td><td style="padding:9px 0;color:#555;">₹${esc(amountInr)} ${esc(check.currency)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Order ID</td><td style="padding:9px 0;color:#555;">${esc(check.order_id)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Payment ID</td><td style="padding:9px 0;color:#555;">${esc(paymentId)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Status</td><td style="padding:9px 0;color:#16a34a;font-weight:bold;">${esc(check.status)}</td></tr>
            <tr><td style="padding:9px 0;font-weight:bold;color:#333;">Verified At</td><td style="padding:9px 0;color:#555;">${esc(paidAt)} IST</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #ddd;margin:18px 0;">
          <p style="color:#555;line-height:1.6;margin:0;">
            <strong>Next step:</strong> send the user an invite to
            <a href="https://learn.abhimanue.in/">learn.abhimanue.in</a> using the email above.
          </p>
        </div>
      </div>
    `
  });

  /* ---- 2) User confirmation: invite is on the way ---- */
  if (email) {
    await sendEmail(env, {
      from: 'Learn with Abhimanue <noreply@hexagonknow.com>',
      to: [email],
      subject: 'Payment received — your AI Study Partner invite is on the way',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">Welcome aboard, ${esc(name.split(' ')[0] || 'learner')}!</h2>
          </div>
          <div style="padding:24px;background:#f9f9f9;border-radius:0 0 12px 12px;color:#555;line-height:1.7;">
            <p>Your payment of <strong>₹${esc(amountInr)}</strong> for the
            <strong>Learn with Abhimanue App — Lifetime Access</strong> was successful
            (Order <em>${esc(check.order_id)}</em>).</p>
            <p>We're activating your account now — you'll receive your platform invite on
            this email / WhatsApp shortly. If it doesn't arrive within 24 hours, reply to
            this email or WhatsApp us at <strong>+91 88917 00108</strong>.</p>
            <p style="margin:0;">— Team Hexagon Know</p>
          </div>
        </div>
      `
    });
  }

  /* ---- Mark processed ---- */
  if (env.ABHIMANUE_KV) {
    try {
      await env.ABHIMANUE_KV.put(`activated:${paymentId}`, JSON.stringify({
        order_id: orderId,
        email,
        activated_at: new Date().toISOString()
      }), { expirationTtl: 60 * 60 * 24 * 90 });
    } catch (e) { /* non-fatal */ }
  }

  return json({ success: true, verified: true });
}
