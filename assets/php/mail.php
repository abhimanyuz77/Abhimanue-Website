<?php
// Set error reporting for debugging (you can remove this in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if the form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form values
    $name = isset($_POST['name']) ? $_POST['name'] : '';
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $subject = isset($_POST['subject']) ? $_POST['subject'] : '';
    $phone = isset($_POST['phone']) ? $_POST['phone'] : 'Not provided';
    $msg = isset($_POST['msg']) ? $_POST['msg'] : '';
    
    // Recipient email
    $to = 'abhimanue@hexagonknow.com';
    
    // Create email headers
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // Create email content
    $output = "Name: $name\r\n";
    $output .= "Email: $email\r\n";
    $output .= "Phone: $phone\r\n";
    $output .= "Subject: $subject\r\n\r\n";
    $output .= "Message:\r\n$msg";
    
    // Send email
    $send = mail($to, $subject, $output, $headers);
    
    // Return response to AJAX call
    if ($send) {
        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send email']);
    }
} else {
    // Not a POST request
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}