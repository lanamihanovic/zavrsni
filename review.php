<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Greška s bazom']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$user_id = isset($data['user_id']) ? (int)$data['user_id'] : null;
$comment = trim($data['comment'] ?? '');
$rating = (int)($data['rating'] ?? 5);
$anonymous = !empty($data['anonymous']) ? 1 : 0;
$created_at = $data['date'] ?? date('Y-m-d H:i:s');

if (!$user_id || !$comment) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nedostaju podaci']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO reviews (user_id, text, rating, anonymous, created_at) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("isiss", $user_id, $comment, $rating, $anonymous, $created_at);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Upis nije uspio: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
