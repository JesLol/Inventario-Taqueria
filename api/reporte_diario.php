<?php
require_once '../includes/db_connection.php';
require_once '../includes/auth.php'; 

// Validar sesion
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado.']);
    exit();
}

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$filter = $_GET['filter'] ?? 'diario'; // Recibe el filtro del JS

// LOGICA DEL FILTRO 
// Por defecto es HOY
$date_condition = "DATE(v.fecha_hora) = CURDATE()"; 

if ($filter === 'mensual') {
    $date_condition = "MONTH(v.fecha_hora) = MONTH(CURRENT_DATE()) AND YEAR(v.fecha_hora) = YEAR(CURRENT_DATE())";
} elseif ($filter === 'historico') {
    $date_condition = "1=1"; 
}

if ($method === 'GET') {
    
    // Resumen
    $sql_ventas = "
        SELECT 
            IFNULL(SUM(v.total_venta), 0) AS total_ventas,
            COUNT(DISTINCT v.id_venta) AS num_ventas,
            IFNULL(SUM(dv.cantidad_vendida), 0) AS total_productos
        FROM ventas v
        LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        WHERE $date_condition 
    ";
    
    $res_ventas = $conn->query($sql_ventas);
    if (!$res_ventas) { echo json_encode(['error' => $conn->error]); exit; } // Debug si falla SQL
    $resumen = $res_ventas->fetch_assoc();

    // Productos Vendidos
    $sql_productos = "
        SELECT 
            p.nombre_producto,
            SUM(dv.cantidad_vendida) AS total_vendido
        FROM detalle_venta dv
        JOIN productos p ON dv.id_producto = p.id_producto
        JOIN ventas v ON dv.id_venta = v.id_venta
        WHERE $date_condition
        GROUP BY p.nombre_producto
        ORDER BY total_vendido DESC
    ";
    $res_productos = $conn->query($sql_productos);
    $productos_vendidos = [];
    while ($row = $res_productos->fetch_assoc()) { $productos_vendidos[] = $row; }

    // Merma / Insumos
    $sql_consumo = "
        SELECT
            i.nombre AS insumo_nombre,
            i.unidad_medida,
            SUM(r.cantidad_requerida * dv.cantidad_vendida) AS consumo_total
        FROM detalle_venta dv
        JOIN ventas v ON dv.id_venta = v.id_venta
        JOIN recetas r ON dv.id_producto = r.id_producto
        JOIN insumos i ON r.id_insumo = i.id_insumo
        WHERE $date_condition
        GROUP BY i.nombre, i.unidad_medida
        ORDER BY consumo_total DESC
    ";
    $res_consumo = $conn->query($sql_consumo);
    $consumo_insumos = [];
    while ($row = $res_consumo->fetch_assoc()) { $consumo_insumos[] = $row; }

    // Detalle Ventas (Bitacora)
    $sql_detalle = "
        SELECT 
            DATE_FORMAT(v.fecha_hora, '%d/%m/%Y %H:%i') as fecha_formato,
            v.total_venta as total,
            IFNULL(u.nombre, 'Sistema') as usuario,
            GROUP_CONCAT(CONCAT(p.nombre_producto, ' (', dv.cantidad_vendida, ')') SEPARATOR ', ') as descripcion_productos
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id
        JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        JOIN productos p ON dv.id_producto = p.id_producto
        WHERE $date_condition
        GROUP BY v.id_venta
        ORDER BY v.fecha_hora DESC
    ";
    $res_detalle = $conn->query($sql_detalle);
    $ventas_detalladas = [];
    while ($row = $res_detalle->fetch_assoc()) { $ventas_detalladas[] = $row; }

    echo json_encode([
        'success' => true,
        'periodo' => $filter, 
        'resumen' => $resumen,
        'productos_vendidos' => $productos_vendidos,
        'consumo_insumos' => $consumo_insumos,
        'ventas_detalladas' => $ventas_detalladas
    ]);

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
$conn->close();
?>