<?php
require_once '../includes/db_connection.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $username = $data['username'] ?? ''; 
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Faltan datos de usuario o PIN.']);
        $conn->close();
        exit();
    }
    $stmt = $conn->prepare("SELECT id, nombre, role, password_hash FROM usuarios WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario_encontrado = $result->fetch_assoc();
    $stmt->close();
    
    if ($usuario_encontrado && password_verify($password, $usuario_encontrado['password_hash'])) {
        
        $_SESSION['user_id'] = $usuario_encontrado['id'];
        $_SESSION['role'] = $usuario_encontrado['role'];
        $_SESSION['nombre'] = $usuario_encontrado['nombre'];

        unset($usuario_encontrado['password_hash']); 
        echo json_encode(['success' => true, 'user' => $usuario_encontrado]);
    } else {
        // usuario no encontrado o pin incorrecto
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario o PIN incorrectos.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
$conn->close();
?>