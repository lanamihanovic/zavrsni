<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(['status' => 'error', 'message' => 'Only DELETE method allowed']);
    exit;
}

$rawData = file_get_contents("php://input");
parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY), $params);

$user_id = $params['id'] ?? null;

if (!$user_id || !is_numeric($user_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing user ID']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Brisanje korisnika i povezanih podataka
$conn->query("DELETE FROM reviews WHERE user_id = $user_id");
$conn->query("DELETE FROM orders WHERE user_id = $user_id");
$conn->query("DELETE FROM users WHERE id = $user_id");

if ($conn->affected_rows > 0) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'User not found or already deleted']);
}

$conn->close();
?>
