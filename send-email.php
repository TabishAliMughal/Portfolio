<?php
// Enable CORS for frontend requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    // Try to get form data if JSON parsing failed
    $input = $_POST;
}

// Validate required fields
$required_fields = ['name', 'email', 'subject', 'message'];
$errors = [];

foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        $errors[] = ucfirst($field) . ' is required';
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit();
}

// Validate email format
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit();
}

// Sanitize input data
$name = htmlspecialchars(trim($input['name']));
$email = htmlspecialchars(trim($input['email']));
$subject = htmlspecialchars(trim($input['subject']));
$message = htmlspecialchars(trim($input['message']));

// SMTP Configuration
$smtp_host = 'smtp.tabishalimughal.xyz';
$smtp_port = 465; // SSL port
$smtp_username = 'support@tabishalimughal.xyz';
$smtp_password = 'Hh5f3608c';
$smtp_from = 'support@tabishalimughal.xyz';
$smtp_to = 'tabishalimughal@gmail.com';

// Create email content
$email_subject = "Portfolio Contact: " . $subject;
$email_body = "
<html>
<head>
    <title>New Contact Form Submission</title>
</head>
<body>
    <h2>New Contact Form Submission</h2>

    <p><strong>Name:</strong> {$name}</p>
    <p><strong>Email:</strong> {$email}</p>
    <p><strong>Subject:</strong> {$subject}</p>

    <h3>Message:</h3>
    <p>" . nl2br($message) . "</p>

    <hr>
    <p><em>This email was sent from your portfolio contact form.</em></p>
</body>
</html>
";

// Use SMTP socket connection for proper authentication
function sendSMTPEmail($host, $port, $username, $password, $from, $to, $subject, $body) {
    // Create socket connection
    $socket = fsockopen("ssl://$host", $port, $errno, $errstr, 30);
    if (!$socket) {
        return false;
    }

    // Read initial response
    fgets($socket);

    // SMTP commands
    $commands = [
        "EHLO $host",
        "AUTH LOGIN",
        base64_encode($username),
        base64_encode($password),
        "MAIL FROM: <$from>",
        "RCPT TO: <$to>",
        "DATA"
    ];

    foreach ($commands as $command) {
        fputs($socket, $command . "\r\n");
        $response = fgets($socket);
        if (strpos($response, '250') === false && strpos($response, '334') === false && strpos($response, '354') === false) {
            fclose($socket);
            return false;
        }
    }

    // Email content
    $email_data = "From: Portfolio <$from>\r\n";
    $email_data .= "To: <$to>\r\n";
    $email_data .= "Subject: $subject\r\n";
    $email_data .= "MIME-Version: 1.0\r\n";
    $email_data .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $email_data .= $body . "\r\n.\r\n";

    fputs($socket, $email_data);
    $response = fgets($socket);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return strpos($response, '250') !== false;
}

// Send email
if (sendSMTPEmail($smtp_host, $smtp_port, $smtp_username, $smtp_password, $smtp_from, $smtp_to, $email_subject, $email_body)) {
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your message has been sent successfully.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, there was an error sending your message. Please try again or contact directly at tabishalimughal@gmail.com'
    ]);
}
?>