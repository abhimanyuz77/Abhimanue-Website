export async function onRequestPost(context) {
  try {
    let data;
    const contentType = context.request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await context.request.json();
    } else {
      const formData = await context.request.formData();
      data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }

    // Honeypot spam check
    if (data.company) {
      return new Response(JSON.stringify({ success: false, message: "Spam detected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const name = data.name;
    const email = data.email;
    const subject = data.subject || "No Subject";
    const msg = data.msg;

    if (!name || !email || !msg) {
      return new Response(
        JSON.stringify({ success: false, message: "Please fill in all required fields." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = context.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable.");
      return new Response(
        JSON.stringify({ success: false, message: "Email service is not configured. Please contact us on WhatsApp." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Use forward_to if provided, otherwise default
    const recipients = data.forward_to
      ? data.forward_to.split(',').map(e => e.trim()).filter(Boolean)
      : ["abhimanue@hexagonknow.com"];

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Abhimanue Website <noreply@hexagonknow.com>",
        to: recipients,
        reply_to: email,
        subject: `Contact Form: ${subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px;border-radius:12px 12px 0 0;">
              <h2 style="color:#fff;margin:0;">New Contact Form Submission</h2>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">From abhimanue.com</p>
            </div>
            <div style="padding:24px;background:#f9f9f9;border-radius:0 0 12px 12px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;width:100px;">Name</td><td style="padding:10px 0;color:#555;">${name}</td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Email</td><td style="padding:10px 0;color:#555;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Subject</td><td style="padding:10px 0;color:#555;">${subject}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
              <p style="font-weight:bold;color:#333;margin-bottom:8px;">Message:</p>
              <p style="color:#555;line-height:1.6;">${msg}</p>
            </div>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errBody);
      return new Response(
        JSON.stringify({ success: false, message: "Something went wrong. Please try again later.", detail: errBody }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Contact form error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred. Please try again." }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
