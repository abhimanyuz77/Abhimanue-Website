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
    $student_name = isset($_POST['student_name']) ? sanitize_input($_POST['student_name']) : '';
    $email        = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $phone        = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $time_slot    = isset($_POST['time_slot']) ? sanitize_input($_POST['time_slot']) : '';
    $timestamp    = date('Y-m-d H:i:s');

    // Validate required fields
    if (empty($student_name) || empty($email) || empty($phone) || empty($time_slot)) {
        throw new Exception("All required fields must be filled");
    }

    // Validate email
    if (!validate_email($email)) {
        throw new Exception("Invalid email address");
    }

    // Prepare email to admin
    $to = "abhimanue@hexagonknow.com";
    $subject = "New Webinar Registration: " . $student_name;

    $email_body = "New NEET Physics Crash Course Webinar Registration\n\n";
    $email_body .= "=================================\n\n";
    $email_body .= "Student Name: " . $student_name . "\n";
    $email_body .= "Email: " . $email . "\n";
    $email_body .= "Phone: " . $phone . "\n";
    $email_body .= "Selected Time Slot: " . $time_slot . "\n";
    $email_body .= "Registration Time: " . $timestamp . "\n";
    $email_body .= "\n=================================\n";

    // Email headers
    $headers = "From: NEET Physics Webinar <noreply@abhimanue.in>\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Save to CSV (backup)
    $csv_file = '../data/webinar-registrations.csv';
    $csv_dir = dirname($csv_file);

    if (!file_exists($csv_dir)) {
        mkdir($csv_dir, 0755, true);
    }

    $file_exists = file_exists($csv_file);
    $file = fopen($csv_file, 'a');

    if ($file) {
        if (!$file_exists) {
            fputcsv($file, ['Timestamp', 'Student Name', 'Email', 'Phone', 'Time Slot']);
        }
        fputcsv($file, [$timestamp, $student_name, $email, $phone, $time_slot]);
        fclose($file);
    }

    // Send email
    $mail_sent = mail($to, $subject, $email_body, $headers);

    // Prepare success response
    $response['success'] = true;
    $response['message'] = 'Registration successful! Redirecting to WhatsApp group...';

    // Redirect to WhatsApp group
    $whatsapp_link = "https://chat.whatsapp.com/GnkwiwJzRWoE5PJethBmUP";
    header("Location: $whatsapp_link");
    exit;

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    error_log("Webinar registration error: " . $e->getMessage());
}

// Return JSON if not redirected
echo json_encode($response);
exit;
?>
