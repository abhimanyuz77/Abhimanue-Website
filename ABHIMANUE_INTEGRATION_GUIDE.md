# Abhimanue.in → Hexagon Know Payment Integration Guide

## Overview

When a student clicks **Enroll** on `abhimanue.in`, their details (name, email, phone) should be passed to the Hexagon Know payment page via URL parameters. The payment page will automatically capture and fill these details, so the student never has to enter information twice.

## Payment Page URL

```
https://hexagonknow.com/abhimanue-payment.html
```

## Required URL Parameters

| Parameter    | Required | Description                        | Example              |
|-------------|----------|------------------------------------|----------------------|
| `name`      | Yes      | Student's full name                | `Abhimanue Sharma`   |
| `email`     | Yes      | Student's email address            | `student@gmail.com`  |
| `phone`     | No       | Student's phone number (10 digits) | `9876543210`         |

## How It Works

1. Student fills out the enrollment form on `abhimanue.in` (name, email, phone).
2. Student clicks the **Enroll / Pay Now** button.
3. `abhimanue.in` redirects to the Hexagon Know payment page with the details tagged in the URL.
4. The payment page reads the URL parameters and **auto-fills** the form.
5. If both `name` and `email` are present, the form is **hidden entirely** — the student just sees the course details and the Pay button.
6. Student clicks **Pay Securely with Razorpay** and completes the payment.

## Example Redirect URL

```
https://hexagonknow.com/abhimanue-payment.html?name=Abhimanue%20Sharma&email=student@gmail.com&phone=9876543210
```

> **Important:** URL-encode the parameter values (especially spaces and special characters). For example, a space becomes `%20`.

## JavaScript Integration Code for Abhimanue.in

Place this code on `abhimanue.in` where the enroll button is clicked. Update the form field IDs to match your actual form.

```html
<form id="enrollForm" onsubmit="redirectToPayment(event)">
    <input type="text" id="studentName" placeholder="Full Name" required>
    <input type="email" id="studentEmail" placeholder="Email Address" required>
    <input type="tel" id="studentPhone" placeholder="Phone Number">
    <button type="submit">Enroll Now</button>
</form>

<script>
    function redirectToPayment(event) {
        event.preventDefault();

        // Capture form values
        var name = document.getElementById('studentName').value.trim();
        var email = document.getElementById('studentEmail').value.trim();
        var phone = document.getElementById('studentPhone').value.trim();

        // Build the redirect URL with parameters
        var params = new URLSearchParams({
            name: name,
            email: email
        });

        // Only add phone if provided
        if (phone) {
            params.append('phone', phone);
        }

        // Redirect to Hexagon Know payment page
        var paymentUrl = 'https://hexagonknow.com/abhimanue-payment.html?' + params.toString();
        window.location.href = paymentUrl;
    }
</script>
```

## Alternative: Direct Link (No Form on Abhimanue.in)

If `abhimanue.in` already has the student's details stored (e.g., from a login session or database), you can construct the link directly:

```javascript
var paymentUrl = 'https://hexagonknow.com/abhimanue-payment.html?'
    + 'name=' + encodeURIComponent(studentName)
    + '&email=' + encodeURIComponent(studentEmail)
    + '&phone=' + encodeURIComponent(studentPhone);

window.location.href = paymentUrl;
```

## What the Student Sees

### With all details provided (name + email):
- Form is **hidden**
- Student sees: Course name, price (₹2,500), and a **Pay Securely** button
- One click to complete payment

### With no details provided (direct visit):
- Student sees the form (Full Name, Email, Phone)
- Fills it in and clicks Pay

## Security Notes

- All details are passed via URL query parameters (not POST body), so **do not include sensitive data** like passwords or card numbers.
- The payment page uses HTTPS, so the URL parameters are encrypted in transit.
- Razorpay payment verification happens on the backend — the student cannot tamper with the amount.

## Optional: Customer ID Tracking

If `abhimanue.in` assigns a unique customer ID to each student, you can pass it as well:

```
https://hexagonknow.com/abhimanue-payment.html?name=Abhimanue&email=test@gmail.com&customer_id=CUST12345
```

When `customer_id` is provided, the form is hidden and the ID is stored with the Razorpay order for your records.

## Quick Reference

| Scenario                          | URL                                                                                   |
|----------------------------------|---------------------------------------------------------------------------------------|
| Full details                     | `?name=John&email=john@test.com&phone=9876543210`                                    |
| Name + Email only                | `?name=John&email=john@test.com`                                                      |
| With customer ID                 | `?name=John&email=john@test.com&customer_id=CUST123`                                  |
| No details (manual entry)        | (no parameters — just the base URL)                                                   |

## Support

For any integration issues, contact: **support@hexagonknow.com**
