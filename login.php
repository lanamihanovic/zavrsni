<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "kaiseki";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Veza s bazom nije uspjela.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $username = $_POST['name'] ?? '';
    $password = $_POST['password'] ?? '';

    // Validacija lozinke
    $errors = [];
    if (strlen($password) < 8) {
        $errors[] = "Lozinka mora imati najmanje 8 znakova.";
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = "Lozinka mora sadržavati barem jedno veliko slovo.";
    }
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = "Lozinka mora sadržavati barem jedan broj.";
    }

    if (!empty($errors)) {
        echo json_encode(['status' => 'error', 'errors' => $errors]);
        exit;
    }

    // Obrada slike (opcionalno)
    $avatarB64 = null;
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
        $imgData = file_get_contents($_FILES['profile_picture']['tmp_name']);
        $avatarB64 = base64_encode($imgData);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Provjera postoji li korisnik s istim korisničkim imenom
    $check = $conn->prepare("SELECT * FROM users WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $result = $check->get_result();

    if ($result->num_rows > 0) {
        // PRIJAVA postojećeg korisnika
        $user = $result->fetch_assoc();

        if (password_verify($password, $user['password_hash'])) {
            echo json_encode([
                'status' => 'login',
                'user' => [
                    'id' => (int)$user['id'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                    'image' => $user['avatar_b64'] ? "data:image/png;base64," . $user['avatar_b64'] : null,
                    'isAdmin' => (bool)($user['is_admin'] ?? 0)
                ]
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'errors' => ["Pogrešna lozinka."]
            ]);
        }
    } else {
        // REGISTRACIJA novog korisnika
        $stmt = $conn->prepare("INSERT INTO users (email, username, avatar_b64, password_hash) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $email, $username, $avatarB64, $passwordHash);
        $success = $stmt->execute();
        $user_id = $conn->insert_id;
        $stmt->close();

        if ($success) {
            echo json_encode([
                'status' => 'registered',
                'user' => [
                    'id' => $user_id,
                    'email' => $email,
                    'username' => $username,
                    'image' => $avatarB64 ? "data:image/png;base64," . $avatarB64 : null,
                    'isAdmin' => false
                ]
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Greška pri spremanju korisnika: ' . $conn->error
            ]);
        }
    }

    $check->close();
}

$conn->close();
?>
