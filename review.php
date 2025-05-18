<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid or empty JSON"]);
    http_response_code(400);
    exit;
}

// Log za dijagnostiku
file_put_contents("review_debug.log", print_r($data, true));

// Validacija
if (
    !isset($data['user_id']) || !is_numeric($data['user_id']) ||
    !isset($data['text']) || trim($data['text']) === '' ||
    !isset($data['rating']) || !is_numeric($data['rating']) ||
    !isset($data['created_at'])
) {
    echo json_encode(["status" => "error", "message" => "Nedostaju obavezni podaci"]);
    http_response_code(400);
    exit;
}

$user_id = intval($data['user_id']);
$text = trim($data['text']);
$rating = intval($data['rating']);
$created_at = $data['created_at'];
$anonymous = isset($data['anonymous']) && $data['anonymous'] ? 1 : 0;

$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Konekcija s bazom nije uspjela"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO reviews (user_id, text, rating, created_at, anonymous) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param("isisi", $user_id, $text, $rating, $created_at, $anonymous);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "id" => $conn->insert_id]);
} else {
    echo json_encode(["status" => "error", "message" => "Insert failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>