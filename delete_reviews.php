<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ➕ DEBUG ZAPIS — spremi cijeli JSON payload u datoteku
file_put_contents("delete_debug.log", file_get_contents("php://input"));

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "No JSON data received"]);
    exit;
}

if (!isset($data["admin"]) || !$data["admin"]) {
    echo json_encode(["status" => "error", "message" => "Not allowed – admin only"]);
    exit;
}

if (!isset($data["id"]) || !is_numeric($data["id"])) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid review ID"]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$id = intval($data["id"]);
$stmt = $conn->prepare("DELETE FROM reviews WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Deletion failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
