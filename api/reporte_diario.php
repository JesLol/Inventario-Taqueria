<?php
require_once '../includes/db_connection.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Obtener ventas y productos vendidos
    $sql_ventas = "
        SELECT 
            SUM(v.total_venta) AS total_ventas,
            COUNT(DISTINCT v.id_venta) AS num_ventas,
            SUM(dv.cantidad_vendida) AS total_productos
        FROM ventas v
        JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        WHERE DATE(v.fecha_hora) = CURDATE()
    ";
    $res_ventas = $conn->query($sql_ventas);
    $resumen = $res_ventas->fetch_assoc();

    // Resumend de productos por tipo
    $sql_productos = "
        SELECT 
            p.nombre_producto,
            SUM(dv.cantidad_vendida) AS total_vendido
        FROM detalle_venta dv
        JOIN productos p ON dv.id_producto = p.id_producto
        JOIN ventas v ON dv.id_venta = v.id_venta
        WHERE DATE(v.fecha_hora) = CURDATE()
        GROUP BY p.nombre_producto
        ORDER BY total_vendido DESC
    ";
    $res_productos = $conn->query($sql_productos);
    $productos_vendidos = [];
    while ($row = $res_productos->fetch_assoc()) {
        $productos_vendidos[] = $row;
    }

    // Merma prevista
    // implica calcular el consumo basado en las ventas del día
    $sql_consumo = "
        SELECT
            i.nombre AS insumo_nombre,
            i.unidad_medida,
            SUM(r.cantidad_requerida * dv.cantidad_vendida) AS consumo_total
        FROM detalle_venta dv
        JOIN ventas v ON dv.id_venta = v.id_venta
        JOIN recetas r ON dv.id_producto = r.id_producto
        JOIN insumos i ON r.id_insumo = i.id_insumo
        WHERE DATE(v.fecha_hora) = CURDATE()
        GROUP BY i.nombre, i.unidad_medida
        ORDER BY consumo_total DESC
    ";
    $res_consumo = $conn->query($sql_consumo);
    $consumo_insumos = [];
    while ($row = $res_consumo->fetch_assoc()) {
        $consumo_insumos[] = $row;
    }

    echo json_encode([
        'success' => true,
        'resumen' => $resumen,
        'productos_vendidos' => $productos_vendidos,
        'consumo_insumos' => $consumo_insumos
    ]);

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
$conn->close();
?>