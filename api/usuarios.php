<?php
require_once '../includes/db_connection.php';
require_once '../includes/auth.php'; 

// solo el rol admin pueda acceder a este API
verificarAdmin(); 

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Leer Usuarios
        $sql = "SELECT id, nombre, role FROM usuarios ORDER BY id";
        $result = $conn->query($sql);
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $usuarios]);
        break;

    case 'POST':
        // Crear usuario
        $data = json_decode(file_get_contents("php://input"), true);
        $nombre = $data['nombre'] ?? '';
        $role = $data['role'] ?? '';
        $password = $data['password'] ?? '';
        
        // Asumimos que el username es el mismo que el nombre
        $username = $nombre; 
        
        // 🚨 CRÍTICO: Generar un ID único para la columna user_uid
        $user_uid = uniqid('', true); 
        
        if (empty($nombre) || empty($role) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios para el usuario.']);
            exit();
        }

        $password_hash = password_hash($password, PASSWORD_DEFAULT); 

        // 🚨 CRÍTICO: Incluir 'username' y 'user_uid' en la consulta (5 columnas)
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, role, password_hash, username, user_uid) VALUES (?, ?, ?, ?, ?)");
        
        // 🚨 CRÍTICO: Incluir $username y $user_uid en bind_param (5 parámetros 's')
        // El orden es: nombre, role, password_hash, username, user_uid
        $stmt->bind_param("sssss", $nombre, $role, $password_hash, $username, $user_uid); // Esto será la línea 47

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario registrado con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al registrar usuario: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        // Eliminar Usuario
        parse_str(file_get_contents("php://input"), $delete_vars);
        $id = $delete_vars['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario es obligatorio.']);
            exit();
        }
        
        // Por si el admin se quiere eliminar a si mismo xddd
        if ($id == $_SESSION['user_id']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propia sesión de administrador.']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario eliminado con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al eliminar usuario: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
$conn->close();
?>