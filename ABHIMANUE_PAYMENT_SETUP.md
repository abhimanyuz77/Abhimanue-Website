# Abhimanue Study Techniques Course - Payment Setup Guide

This document summarizes the payment integration created for the Abhimanue Study Techniques Course through Hexagon Know's infrastructure.

## URLs & Endpoints
- **Payment Page:** `https://hexagonknow.com/abhimanue-payment.html`
- **Success Page:** `https://hexagonknow.com/abhimanue-payment-success.html`
- **Failure Page:** `https://hexagonknow.com/abhimanue-payment-failed.html`
- **Backend API:** `/api/abhimanue-payment` (Handles order creation & verification)

## Course Details
- **Course Name:** Abhimanue Study Techniques Course
- **Price:** ₹2,500
- **Branding:** Hexagon Know Tutors (by Abhimanue)
- **Payment Processor:** Hexagon Know Pvt Ltd

## Implementation Details
1. **Frontend (`abhimanue-payment.html`):** 
   - A modern, dark-themed payment capture page.
   - Collects Full Name, Email, and Phone Number.
   - Integrates with Razorpay Checkout.
   - Redirects to success/failure pages based on transaction result.

2. **Backend (`functions/api/abhimanue-payment.js`):**
   - Cloudflare Pages Function.
   - `create-order`: Generates a Razorpay Order ID.
   - `verify-payment`: Validates the payment signature using Web Crypto API.
   - `get-key`: Securely provides the Razorpay Key ID to the frontend.

3. **Data Security:**
   - All transactions are verified on the backend.
   - Uses Razorpay's standard HMAC SHA256 signature verification.
   - Integrated with Cloudflare KV (optional) for order logging.

## Usage on Abhimanue.in
To link to the payment page from `abhimanue.in`, use the following URL format:
`https://hexagonknow.com/abhimanue-payment.html`

If you have a customer ID or tracking parameter, you can append it:
`https://hexagonknow.com/abhimanue-payment.html?customer_id=12345`

## Required Environment Variables
Ensure the following are set in your Cloudflare dashboard:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ABHIMANUE_KV` (Optional, for logging)
