<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Greška s bazom']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;
$user_id = $data['user_id'] ?? null;
$is_admin = $data['is_admin'] ?? false;



if ($is_admin) {
    $stmt = $conn->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->bind_param("i", $id);
} else {
    if (!$user_id) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Zabranjeno']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $id, $user_id);
}

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Brisanje nije uspjelo']);
}

$stmt->close();
$conn->close();
