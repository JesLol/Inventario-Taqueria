<?php
require_once '../includes/db_connection.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $password = $data['password'] ?? '';
    // Traemos todos los usuarios para buscar cual coincide (no es la mejor practica pero no van a ser muchos usuarios xdd)
    $sql = "SELECT id, nombre, role, password_hash FROM usuarios";
    $result = $conn->query($sql);
    $usuario_encontrado = null;
    while($user = $result->fetch_assoc()){
        if(password_verify($password, $user['password_hash'])){
            $usuario_encontrado = $user;
            break;
        }
    }
    if ($usuario_encontrado) {
        $_SESSION['user_id'] = $usuario_encontrado['id'];
        $_SESSION['role'] = $usuario_encontrado['role'];
        $_SESSION['nombre'] = $usuario_encontrado['nombre'];

        unset($usuario_encontrado['password_hash']); 
        echo json_encode(['success' => true, 'user' => $usuario_encontrado]);
    } else {
        echo json_encode(['success' => false, 'message' => 'PIN Incorrecto']);
    }
}
$conn->close();
?>