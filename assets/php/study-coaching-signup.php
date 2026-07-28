<?php
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 0);

function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

$response = array(
    'success' => false,
    'message' => ''
);

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    $fullname = isset($_POST['fullname']) ? sanitize_input($_POST['fullname']) : '';
    $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $student_type = isset($_POST['student_type']) ? sanitize_input($_POST['student_type']) : '';
    $challenges = isset($_POST['challenges']) ? sanitize_input($_POST['challenges']) : '';
    $message = isset($_POST['message']) ? sanitize_input($_POST['message']) : 'No additional message';
    $timestamp = isset($_POST['timestamp']) ? sanitize_input($_POST['timestamp']) : date('Y-m-d H:i:s');

    if (empty($fullname) || empty($email) || empty($phone) || empty($student_type) || empty($challenges)) {
        throw new Exception("All required fields must be filled");
    }

    if (!validate_email($email)) {
        throw new Exception("Invalid email address");
    }

    $to = "abhimanue@hexagonknow.com";
    $subject = "Study Performance Coaching Enrollment: " . $fullname;

    $email_body = "New Study Performance Coaching Enrollment\n\n";
    $email_body .= "=================================\n\n";
    $email_body .= "Full Name: " . $fullname . "\n";
    $email_body .= "Email: " . $email . "\n";
    $email_body .= "Phone: " . $phone . "\n";
    $email_body .= "Student Type: " . $student_type . "\n";
    $email_body .= "Main Challenge: " . $challenges . "\n";
    $email_body .= "Message: " . $message . "\n";
    $email_body .= "Timestamp: " . $timestamp . "\n";
    $email_body .= "\n=================================\n";

    $headers = "From: Study Coaching <noreply@abhimanue.in>\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $csv_file = '../data/study-coaching-signups.csv';
    $csv_dir = dirname($csv_file);

    if (!file_exists($csv_dir)) {
        mkdir($csv_dir, 0755, true);
    }

    $file_exists = file_exists($csv_file);

    $file = fopen($csv_file, 'a');

    if ($file) {
        if (!$file_exists) {
            fputcsv($file, array('Timestamp', 'Full Name', 'Email', 'Phone', 'Student Type', 'Challenges', 'Message'));
        }
        fputcsv($file, array($timestamp, $fullname, $email, $phone, $student_type, $challenges, $message));
        fclose($file);
    }

    $mail_sent = mail($to, $subject, $email_body, $headers);

    $response['success'] = true;
    $response['message'] = 'Enrollment request submitted successfully';

    if (!$mail_sent) {
        error_log("Study coaching signup email failed to send for: " . $email);
    }

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    error_log("Study coaching signup error: " . $e->getMessage());
}

echo json_encode($response);
exit;
?>
