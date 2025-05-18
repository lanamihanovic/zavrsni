<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");



ini_set('display_errors', 1);
error_reporting(E_ALL);

if (!isset($_GET['user_id']) || !is_numeric($_GET['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid user ID']);
    exit;
}

$user_id = intval($_GET['user_id']);

$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Dohvati rezervacije
$reservations = [];
$resStmt = $conn->prepare("SELECT tables, date, time, guests, note FROM reservations WHERE user_id = ?");
$resStmt->bind_param("i", $user_id);
$resStmt->execute();
$resResult = $resStmt->get_result();
while ($row = $resResult->fetch_assoc()) {
    $reservations[] = $row;
}
$resStmt->close();

// Dohvati narudzbe
$orders = [];
$orderStmt = $conn->prepare("SELECT items, delivery_time, delivery_location FROM orders WHERE user_id = ?");
$orderStmt->bind_param("i", $user_id);
$orderStmt->execute();
$orderResult = $orderStmt->get_result();
while ($row = $orderResult->fetch_assoc()) {
    $orders[] = $row;
}
$orderStmt->close();

// Dohvati recenzije (iskljuci anonimne)
$reviews = [];
$revStmt = $conn->prepare("SELECT text, rating, created_at FROM reviews WHERE user_id = ? AND anonymous = 0");
$revStmt->bind_param("i", $user_id);
$revStmt->execute();
$revResult = $revStmt->get_result();
while ($row = $revResult->fetch_assoc()) {
    $reviews[] = $row;
}
$revStmt->close();

$conn->close();

echo json_encode([
    'status' => 'success',
    'reservations' => $reservations,
    'orders' => $orders,
    'reviews' => $reviews
]);
exit;
?>