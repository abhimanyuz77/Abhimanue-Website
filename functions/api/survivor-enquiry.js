// Private acquisition enquiries for The Survivor.
// Sends (A) a notification to the owner and (B) a confirmation to the enquirer
// through Resend, using the same RESEND_API_KEY as /api/contact.
//
// Environment variables:
//   RESEND_API_KEY        (required) existing Resend key
//   SURVIVOR_OWNER_EMAIL  (optional) comma-separated recipients, defaults below
//   SURVIVOR_PAGE_URL     (optional) official page link used in the buyer email

const DEFAULT_OWNER_EMAIL = 'abhimanue@hexagonknow.com';
const DEFAULT_PAGE_URL = 'https://abhimanue.in/the-survivor.html';
const FROM_ADDRESS = 'Abhimanue Udayan <noreply@hexagonknow.com>';
const ARTWORK = 'The Survivor';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json();
  return Object.fromEntries((await request.formData()).entries());
}

async function sendEmail(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function ownerEmailHtml(e) {
  const rows = [
    ['Name', e.name],
    ['Email', `<a href="mailto:${escapeHtml(e.email)}">${escapeHtml(e.email)}</a>`, true],
    ['Country', e.country],
    ['Phone / WhatsApp', e.phone || 'Not provided'],
    ['Proposed amount', e.offer ? `USD ${Number(e.offer).toLocaleString('en-US')}` : 'Not specified'],
    ['Message', e.message || '—'],
    ['Received', e.receivedAt]
  ]
    .map(([label, value, raw]) => `<tr><td style="padding:10px 0;font-weight:bold;color:#333;width:160px;vertical-align:top;">${label}</td><td style="padding:10px 0;color:#555;white-space:pre-wrap;">${raw ? value : escapeHtml(value)}</td></tr>`)
    .join('');
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
      <div style="background:#0A0A0A;padding:24px;border-radius:8px 8px 0 0;border-bottom:2px solid #A78652;">
        <h2 style="color:#F4F1EB;margin:0;font-weight:normal;">Private Acquisition Enquiry — ${ARTWORK}</h2>
      </div>
      <div style="padding:24px;background:#f9f9f9;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="color:#888;font-size:12px;margin-top:20px;">The enquirer has been sent an automatic confirmation stating that you will respond personally within 24 hours. Reply directly to this email to respond.</p>
      </div>
    </div>`;
}

function buyerEmailHtml(name, pageUrl) {
  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#F4F1EB;padding:48px 40px;">
      <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#A78652;margin:0 0 24px;">Private Acquisition Enquiry</p>
      <h1 style="font-weight:normal;font-size:30px;letter-spacing:2px;margin:0 0 28px;">THE SURVIVOR</h1>
      <p style="font-size:16px;line-height:1.8;color:#d8d4cc;">Dear ${escapeHtml(name)},</p>
      <p style="font-size:16px;line-height:1.8;color:#d8d4cc;">Thank you for your interest in <em>The Survivor</em>. This is to confirm that your private acquisition enquiry has been received.</p>
      <p style="font-size:16px;line-height:1.8;color:#d8d4cc;">I will respond to you personally within 24 hours to discuss the artwork, a private viewing and the next steps.</p>
      <p style="font-size:16px;line-height:1.8;color:#d8d4cc;">No payment is required at this stage.</p>
      <p style="font-size:16px;line-height:1.8;color:#d8d4cc;margin-top:32px;">With gratitude,<br/><span style="color:#A78652;">Abhimanue Udayan</span></p>
      <hr style="border:none;border-top:1px solid rgba(167,134,82,0.4);margin:36px 0 20px;"/>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#8a867f;line-height:1.7;margin:0;">
        <a href="${escapeHtml(pageUrl)}" style="color:#A78652;">${escapeHtml(pageUrl.replace(/^https?:\/\//, ''))}</a><br/>
        You are receiving this email because you submitted an enquiry about The Survivor.
      </p>
    </div>`;
}

function buyerEmailText(name, pageUrl) {
  return [
    `Dear ${name},`,
    '',
    'Thank you for your interest in The Survivor. This is to confirm that your private acquisition enquiry has been received.',
    '',
    'I will respond to you personally within 24 hours to discuss the artwork, a private viewing and the next steps.',
    '',
    'No payment is required at this stage.',
    '',
    'With gratitude,',
    'Abhimanue Udayan',
    '',
    pageUrl
  ].join('\n');
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await readBody(request);
  } catch {
    return json({ success: false, message: 'Invalid request.' }, 400);
  }

  // Honeypot: silently accept so bots get no signal.
  if (data.company) return json({ success: true });

  const enquiry = {
    name: clean(data.name, 120),
    email: clean(data.email, 200),
    country: clean(data.country, 80),
    phone: clean(data.phone, 40),
    offer: clean(data.offer, 15).replace(/[^\d]/g, ''),
    message: clean(data.message, 3000),
    receivedAt: new Date().toUTCString()
  };

  if (!enquiry.name || !enquiry.country || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
    return json({ success: false, message: 'Please provide your name, a valid email address and your country.' }, 400);
  }

  if (!env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable.');
    return json({ success: false, message: 'Enquiries are temporarily unavailable. Please email contact@abhimanue.in.' }, 500);
  }

  const owners = (env.SURVIVOR_OWNER_EMAIL || DEFAULT_OWNER_EMAIL).split(',').map((s) => s.trim()).filter(Boolean);
  const pageUrl = env.SURVIVOR_PAGE_URL || DEFAULT_PAGE_URL;

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: FROM_ADDRESS,
      to: owners,
      reply_to: enquiry.email,
      subject: `Private Acquisition Enquiry — ${ARTWORK} — ${enquiry.name} (${enquiry.country})`,
      html: ownerEmailHtml(enquiry)
    });
  } catch (err) {
    console.error('Owner notification failed:', err);
    return json({ success: false, message: 'Your enquiry could not be sent. Please try again or email contact@abhimanue.in.' }, 502);
  }

  // The owner already has the enquiry, so a failed confirmation should not fail the request.
  let buyerConfirmationSent = true;
  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: FROM_ADDRESS,
      to: [enquiry.email],
      reply_to: owners[0],
      subject: `Your enquiry about ${ARTWORK} has been received`,
      html: buyerEmailHtml(enquiry.name, pageUrl),
      text: buyerEmailText(enquiry.name, pageUrl)
    });
  } catch (err) {
    buyerConfirmationSent = false;
    console.error('Buyer confirmation failed:', err);
  }

  return json({ success: true, buyerConfirmationSent });
}
