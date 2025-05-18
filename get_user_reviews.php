<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Prikaz svih PHP grešaka za razvoj
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Povezivanje na bazu
$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Greška kod spajanja na bazu']);
    exit;
}

// Dohvati user_id iz GET parametra
$user_id = $_GET['user_id'] ?? null;
if (!$user_id || !is_numeric($user_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Nedostaje ili neispravan user_id']);
    exit;
}

// Priprema SQL-a
$query = "
    SELECT 
        reviews.id,
        reviews.text AS comment,
        reviews.rating,
        reviews.anonymous,
        reviews.created_at AS date,
        users.username,
        users.avatar_b64
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    WHERE users.id = ?
    ORDER BY reviews.created_at DESC
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$reviews = [];
while ($row = $result->fetch_assoc()) {
    $reviews[] = [
        'id' => (int)$row['id'],
        'comment' => $row['comment'],
        'rating' => (int)$row['rating'],
        'date' => $row['date'],
        'user' => $row['anonymous'] ? 'Anonymous' : $row['username'],
        'userImage' => $row['anonymous']
            ? 'https://via.placeholder.com/50'
            : ($row['avatar_b64'] ? 'data:image/png;base64,' . $row['avatar_b64'] : 'https://via.placeholder.com/50')
    ];
}

echo json_encode(['status' => 'success', 'reviews' => $reviews]);
$conn->close();
?>
