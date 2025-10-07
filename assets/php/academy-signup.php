<?php
header('Content-Type: application/json');

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Function to sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Initialize response
$response = array(
    'success' => false,
    'message' => ''
);

try {
    // Check if request method is POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }
    
    // Get and sanitize form data
    $fullname = isset($_POST['fullname']) ? sanitize_input($_POST['fullname']) : '';
    $age = isset($_POST['age']) ? sanitize_input($_POST['age']) : '';
    $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $background = isset($_POST['background']) ? sanitize_input($_POST['background']) : '';
    $experience = isset($_POST['experience']) ? sanitize_input($_POST['experience']) : 'Not specified';
    $message = isset($_POST['message']) ? sanitize_input($_POST['message']) : 'No additional message';
    $timestamp = isset($_POST['timestamp']) ? sanitize_input($_POST['timestamp']) : date('Y-m-d H:i:s');
    
    // Validate required fields
    if (empty($fullname) || empty($age) || empty($email) || empty($phone) || empty($background)) {
        throw new Exception("All required fields must be filled");
    }
    
    // Validate email format
    if (!validate_email($email)) {
        throw new Exception("Invalid email address");
    }
    
    // Validate age
    if (!is_numeric($age) || $age < 16 || $age > 100) {
        throw new Exception("Invalid age");
    }
    
    // Prepare email content
    $to = "abhimanue@hexagonknow.com"; // Replace with your actual email
    $subject = "New Academy Signup: " . $fullname;
    
    $email_body = "New Academy Signup Application\n\n";
    $email_body .= "=================================\n\n";
    $email_body .= "Full Name: " . $fullname . "\n";
    $email_body .= "Age: " . $age . "\n";
    $email_body .= "Email: " . $email . "\n";
    $email_body .= "Phone: " . $phone . "\n";
    $email_body .= "Background: " . $background . "\n";
    $email_body .= "Experience: " . $experience . "\n";
    $email_body .= "Message: " . $message . "\n";
    $email_body .= "Timestamp: " . $timestamp . "\n";
    $email_body .= "\n=================================\n";
    
    // Email headers
    $headers = "From: Academy Signup <noreply@abhimanue.site>\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Save to CSV file (as backup)
    $csv_file = '../data/academy-signups.csv';
    $csv_dir = dirname($csv_file);
    
    // Create directory if it doesn't exist
    if (!file_exists($csv_dir)) {
        mkdir($csv_dir, 0755, true);
    }
    
    // Check if file exists to determine if we need headers
    $file_exists = file_exists($csv_file);
    
    // Open file for appending
    $file = fopen($csv_file, 'a');
    
    if ($file) {
        // Add headers if file is new
        if (!$file_exists) {
            fputcsv($file, array('Timestamp', 'Full Name', 'Age', 'Email', 'Phone', 'Background', 'Experience', 'Message'));
        }
        
        // Add data
        fputcsv($file, array($timestamp, $fullname, $age, $email, $phone, $background, $experience, $message));
        fclose($file);
    }
    
    // Send email
    $mail_sent = mail($to, $subject, $email_body, $headers);
    
    // Prepare success response
    $response['success'] = true;
    $response['message'] = 'Application submitted successfully';
    
    // Note: Even if email fails, we consider it success since data is saved to CSV
    if (!$mail_sent) {
        error_log("Academy signup email failed to send for: " . $email);
    }
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    error_log("Academy signup error: " . $e->getMessage());
}

// Return JSON response
echo json_encode($response);
exit;
?>
