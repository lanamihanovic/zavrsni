<?php
// Zaglavlja
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Prikaži greške (samo za razvoj)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Povezivanje s bazom
$conn = new mysqli("localhost", "root", "", "kaiseki");

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Connection to database failed"
    ]);
    exit;
}

// SQL upit za dohvat recenzija i korisničkih podataka
$sql = "
    SELECT 
        reviews.id,
        reviews.text AS comment,
        reviews.rating,
        reviews.anonymous,
        reviews.created_at,
        users.username,
        users.avatar_b64
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    ORDER BY reviews.created_at DESC
";

$result = $conn->query($sql);

$reviews = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
   $reviews[] = [
    "id" => (int)$row["id"],
    "text" => $row["comment"],
    "rating" => (int)$row["rating"],
    "created_at" => $row["created_at"],
    "user" => $row["anonymous"] ? "Anonymous" : $row["username"],
    "userImage" => $row["anonymous"]
        ? "slike/default-avatar.png"
        : ($row["avatar_b64"] ? "data:image/png;base64," . $row["avatar_b64"] : "slike/default-avatar.png")
];


    }
}

// Vrati rezultat kao JSON
echo json_encode([
    "status" => "success",
    "reviews" => $reviews
]);

$conn->close();
?>
