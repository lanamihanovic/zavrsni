<?php

// Omogućujemo pristup s drugih adresa (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Prikaz grešaka
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Povezivanje na bazu
$conn = new mysqli("localhost", "root", "", "kaiseki");

// Provjera konekcije
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "errors" => ["Database connection failed."]]));
}

// Ako se šalje rezervacija
if (isset($_POST['table-id'])) {
    $tables = $_POST['table-id'];
    $name = $_POST['name'];
    $email = $_POST['email'];
    $date = $_POST['date'];
    $time = $_POST['time'];
    $guests = $_POST['guests'];
    $note = $_POST['note'] ?? "";

    $sql = "INSERT INTO reservations (tables, name, email, date, time, guests, note)
            VALUES (?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssis", $tables, $name, $email, $date, $time, $guests, $note);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Reservation saved."]);
    } else {
        echo json_encode(["status" => "error", "errors" => ["Reservation failed."]]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

// Ako se šalje narudžba
if (isset($_POST['items'])) {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $location = $_POST['delivery_location'];
    $time = $_POST['delivery_time'];
    $note = $_POST['note'] ?? "";
    $items = json_decode($_POST['items'], true);

    if (!is_array($items)) {
        echo json_encode(["status" => "error", "errors" => ["Invalid items format."]]);
        exit;
    }

    $total = 0;
    foreach ($items as $item) {
        $total += floatval($item["price"]);
    }

    $items_json = json_encode($items);

    $sql = "INSERT INTO orders (name, email, delivery_location, delivery_time, note, items, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssssd", $name, $email, $location, $time, $note, $items_json, $total);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Order placed."]);
    } else {
        echo json_encode(["status" => "error", "errors" => ["Order failed."]]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

// Ako ništa nije prepoznato
echo json_encode(["status" => "error", "errors" => ["Invalid request."]]);
?>
