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

    const fullname = data.fullname;
    const email = data.email;
    const phone = data.phone;
    const student_type = data.student_type;
    const challenges = data.challenges;
    const address = data.address;
    const message = data.message || 'No additional message';
    const timestamp = data.timestamp || new Date().toISOString();

    if (!fullname || !email || !phone || !student_type || !challenges || !address) {
      return new Response(
        JSON.stringify({ success: false, message: "All required fields must be filled" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email address" }),
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

    const studentTypeLabels = {
      'high-school': 'High School Student',
      'higher-secondary': 'Higher Secondary Student',
      'competitive-exam': 'Competitive Exam Aspirant',
      'college': 'College Student',
      'other': 'Other'
    };

    const challengeLabels = {
      'memory': 'Forgetting what I study',
      'mathematics': 'Mathematics is confusing',
      'focus': 'Losing focus while studying',
      'procrastination': 'Procrastinating before exams',
      'revision': "Don't know how to revise",
      'low-marks': 'Studying hard but marks don\'t reflect effort',
      'dont-know-where-to-start': "Don't know where to start",
      'multiple': 'Multiple challenges'
    };

    const studentTypeLabel = studentTypeLabels[student_type] || student_type;
    const challengeLabel = challengeLabels[challenges] || challenges;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Abhimanue Website <noreply@hexagonknow.com>",
        to: ["abhimanue@hexagonknow.com"],
        reply_to: email,
        subject: `Study Performance Coaching Enrollment: ${fullname}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px;border-radius:12px 12px 0 0;">
              <h2 style="color:#fff;margin:0;">New Study Performance Coaching Enrollment</h2>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">From abhimanue.in</p>
            </div>
            <div style="padding:24px;background:#f9f9f9;border-radius:0 0 12px 12px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;width:140px;">Full Name</td><td style="padding:10px 0;color:#555;">${fullname}</td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Email</td><td style="padding:10px 0;color:#555;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Phone</td><td style="padding:10px 0;color:#555;">${phone}</td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Address</td><td style="padding:10px 0;color:#555;">${address}</td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Current Status</td><td style="padding:10px 0;color:#555;">${studentTypeLabel}</td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Main Challenge</td><td style="padding:10px 0;color:#555;">${challengeLabel}</td></tr>
                <tr><td style="padding:10px 0;font-weight:bold;color:#333;">Timestamp</td><td style="padding:10px 0;color:#555;">${timestamp}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
              <p style="font-weight:bold;color:#333;margin-bottom:8px;">Message:</p>
              <p style="color:#555;line-height:1.6;">${message}</p>
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
      JSON.stringify({ success: true, message: "Enrollment request submitted successfully" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Study coaching signup error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred. Please try again." }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
