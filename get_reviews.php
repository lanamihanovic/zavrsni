<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Prikaz svih PHP grešaka (za razvojno okruženje)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Spoji se na bazu
$conn = new mysqli("localhost", "root", "", "kaiseki");
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Greška kod spajanja na bazu']);
    exit;
}

// Dohvati recenzije s pripadajućim korisnicima
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
    ORDER BY reviews.created_at DESC
";

$result = $conn->query($query);

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