<?php
header('Content-Type: application/json');

// Enable error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Initialize response
$response = [
    'success' => false,
    'message' => ''
];

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    // Get and sanitize form fields
    $student_name   = isset($_POST['student_name']) ? sanitize_input($_POST['student_name']) : '';
    $parent_name    = isset($_POST['parent_name']) ? sanitize_input($_POST['parent_name']) : '';
    $email          = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $phone          = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $physics_level  = isset($_POST['physics_level']) ? sanitize_input($_POST['physics_level']) : '';
    $timestamp      = date('Y-m-d H:i:s');

    // Validate required fields
    if (empty($student_name) || empty($parent_name) || empty($email) || empty($phone) || empty($physics_level)) {
        throw new Exception("All required fields must be filled");
    }

    // Validate email
    if (!validate_email($email)) {
        throw new Exception("Invalid email address");
    }

    // Prepare email
    $to = "abhimanue@hexagonknow.com"; // your email
    $subject = "New NEET Physics Crash Course Enrollment: " . $student_name;

    $email_body = "New NEET Physics Crash Course Enrollment\n\n";
    $email_body .= "=================================\n\n";
    $email_body .= "Student Name: " . $student_name . "\n";
    $email_body .= "Parent Name: " . $parent_name . "\n";
    $email_body .= "Email: " . $email . "\n";
    $email_body .= "Phone: " . $phone . "\n";
    $email_body .= "Physics Level: " . $physics_level . "\n";
    $email_body .= "Timestamp: " . $timestamp . "\n";
    $email_body .= "\n=================================\n";

    // Email headers
    $headers = "From: NEET Physics Crash Course <noreply@abhimanue.in>\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Save to CSV (backup)
    $csv_file = '../data/neet-crash-signups.csv';
    $csv_dir = dirname($csv_file);

    if (!file_exists($csv_dir)) {
        mkdir($csv_dir, 0755, true);
    }

    $file_exists = file_exists($csv_file);
    $file = fopen($csv_file, 'a');

    if ($file) {
        if (!$file_exists) {
            fputcsv($file, ['Timestamp', 'Student Name', 'Parent Name', 'Email', 'Phone', 'Physics Level']);
        }
        fputcsv($file, [$timestamp, $student_name, $parent_name, $email, $phone, $physics_level]);
        fclose($file);
    }

    // Send email
    $mail_sent = mail($to, $subject, $email_body, $headers);

    // Prepare success response
    $response['success'] = true;
    $response['message'] = 'Form submitted successfully';

    // Redirect to payment page
    $payment_page = "https://rzp.io/rzp/UTyXWKNC";  // your actual payment page
    header("Location: $payment_page");
    exit;

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    error_log("NEET Crash Course signup error: " . $e->getMessage());
}

// Return JSON if not redirected
echo json_encode($response);
exit;
?>
