<?php
// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Funcion para detener la ejecución si no es admin
function verificarAdmin() {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => 'ACCESO DENEGADO: Se requieren permisos de Administrador.'
        ]);
        exit(); // Matar proceso
    }
}

// para cajeros 
function verificarUsuario() {
    if (!isset($_SESSION['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            'success' => false, 
            'message' => 'No estás autenticado. Por favor inicia sesión.'
        ]);
        exit();
    }
}
?>