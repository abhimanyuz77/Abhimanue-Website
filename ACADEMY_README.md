# Coding Academy Landing Page

## Overview
A comprehensive landing page for the Full Stack Development Academy program. This page includes program details, curriculum, pricing, and a signup form to collect student applications.

## Files Created

### 1. `academy.html`
Main landing page with the following sections:
- **Hero Section**: Eye-catching header with batch countdown and CTA buttons
- **Program Structure**: Details about the 3-month program format
- **Curriculum**: Month-by-month breakdown of what students will learn
- **Ideal Audience**: Target demographics for the program
- **Pricing**: Transparent pricing with EMI options
- **Signup Form**: Application form to collect student information

### 2. `assets/css/academy.css`
Custom styles for the academy page including:
- Gradient backgrounds and modern card designs
- Animated elements (pulse effect on badges)
- Responsive layouts for all screen sizes
- Form styling with focus states
- Timeline design for curriculum section

### 3. `assets/js/academy.js`
JavaScript functionality for:
- Form validation (email, age, required fields)
- AJAX form submission
- Alert messages (success/error/warning)
- Phone number formatting
- Form field animations

### 4. `assets/php/academy-signup.php`
Backend PHP script that:
- Validates form data
- Saves submissions to CSV file (`assets/data/academy-signups.csv`)
- Sends email notifications
- Returns JSON responses

## Form Fields Collected

The signup form collects the following information:
- **Full Name** (required)
- **Age** (required, 16-100)
- **Email Address** (required, validated)
- **Phone Number** (required)
- **Educational/Professional Background** (required dropdown)
  - Final Year Student
  - Recent Graduate/Fresher
  - Non-CS Graduate
  - Working Professional
  - Other
- **Coding Experience** (optional dropdown)
  - Complete Beginner
  - Basic (HTML/CSS)
  - Intermediate
  - Advanced
- **Why do you want to join?** (optional text area)
- **Terms agreement** (required checkbox)

## Setup Instructions

### 1. Email Configuration
Edit `assets/php/academy-signup.php` and update the email address on line 60:
```php
$to = "your-email@example.com"; // Replace with your actual email
```

### 2. Data Storage
The PHP script automatically creates a CSV file at:
```
assets/data/academy-signups.csv
```
Make sure the `assets/data/` directory has write permissions (755 or 775).

### 3. Server Requirements
- PHP 7.0 or higher
- Mail function enabled (for email notifications)
- Write permissions for data directory

### 4. Testing
1. Open `academy.html` in a browser
2. Fill out the signup form
3. Check that:
   - Form validation works
   - Success message appears
   - Email is received
   - Data is saved to CSV

## Features

### Design Features
- **Modern UI**: Gradient backgrounds, smooth animations, hover effects
- **Responsive**: Fully responsive design for mobile, tablet, and desktop
- **Accessibility**: Proper form labels, focus states, and semantic HTML
- **Consistent Branding**: Uses the same color scheme as the main portfolio

### Functional Features
- **Real-time Validation**: Client-side validation before submission
- **AJAX Submission**: No page reload on form submit
- **Dual Storage**: Saves to both email and CSV file
- **Error Handling**: Comprehensive error messages for users
- **Auto-formatting**: Phone number formatting on input

### Marketing Features
- **Scarcity**: "Only 30 seats per batch" messaging
- **Social Proof**: Comparison with expensive bootcamps
- **Clear Value**: Transparent pricing with EMI options
- **Security**: Certification and LMS access highlighted
- **Speed**: "Launch your app in 3 months" promise

## Customization

### Update Program Details
Edit `academy.html` to modify:
- Batch size (currently 30 students)
- Pricing (currently ₹19,999)
- Curriculum content
- Program duration

### Update Styling
Edit `assets/css/academy.css` to change:
- Color scheme (search for `#fec544` and `#ff6b6b`)
- Card styles
- Typography
- Spacing

### Update Form Fields
To add/remove form fields:
1. Update HTML in `academy.html`
2. Update validation in `assets/js/academy.js`
3. Update PHP processing in `assets/php/academy-signup.php`
4. Update CSV headers in PHP script

## Integration with Main Site

The academy page is linked from the main portfolio:
- `index.html` → "Join Now" button in the Coding Academy card links to `academy.html`
- Header navigation includes link back to portfolio

## Data Management

### Viewing Submissions
Access the CSV file at `assets/data/academy-signups.csv` to view all submissions.

CSV columns:
1. Timestamp
2. Full Name
3. Age
4. Email
5. Phone
6. Background
7. Experience
8. Message

### Email Notifications
Each submission triggers an email with all form data to the configured email address.

## Security Considerations

1. **Input Sanitization**: All inputs are sanitized in PHP
2. **Email Validation**: Server-side email format validation
3. **CSRF Protection**: Consider adding CSRF tokens for production
4. **Rate Limiting**: Consider adding rate limiting to prevent spam
5. **File Permissions**: Ensure CSV file is not publicly accessible

## Future Enhancements

Consider adding:
- Payment gateway integration
- Student dashboard/portal
- Automated email sequences
- Calendar integration for batch scheduling
- Video testimonials section
- FAQ section
- Live chat support
- Social media integration
- Google Analytics tracking
- A/B testing for conversion optimization

## Support

For questions or issues, contact: your-email@example.com

---

**Last Updated**: January 2025
**Version**: 1.0.0
