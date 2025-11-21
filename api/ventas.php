<?php
require_once '../includes/db_connection.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Registrar una nueva venta
    $data = json_decode(file_get_contents("php://input"), true);
    $productos_vendidos = $data['productos'] ?? []; // Array de {id_producto, cantidad}
    $total_venta = $data['total'] ?? 0;
    $id_usuario = $data['id_usuario'] ?? 1; // ID del empleado/cajero

    if (empty($productos_vendidos) || $total_venta <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Venta vacía o total no válido.']);
        exit();
    }

    // INICIO DE TRANSACCION
    $conn->begin_transaction();
    $errores = [];

    try {
        // Insertar Venta
        $stmt_venta = $conn->prepare("INSERT INTO ventas (fecha_hora, total_venta, id_usuario) VALUES (NOW(), ?, ?)");
        $stmt_venta->bind_param("di", $total_venta, $id_usuario);
        $stmt_venta->execute();
        $id_venta = $conn->insert_id;
        $stmt_venta->close();

        // Procesar cada producto vendido y deducir inventario
        foreach ($productos_vendidos as $item) {
            $id_producto = $item['id_producto'];
            $cantidad_vendida = $item['cantidad'];

            // Obtener precio del producto
            $stmt_prod = $conn->prepare("SELECT precio_venta, nombre_producto FROM productos WHERE id_producto = ?");
            $stmt_prod->bind_param("i", $id_producto);
            $stmt_prod->execute();
            $res_prod = $stmt_prod->get_result();
            if ($row_prod = $res_prod->fetch_assoc()) {
                $precio_unitario = $row_prod['precio_venta'];
                $nombre_producto = $row_prod['nombre_producto'];
                $subtotal = $precio_unitario * $cantidad_vendida;
            } else {
                throw new Exception("Producto con ID {$id_producto} no encontrado.");
            }
            $stmt_prod->close();

            // Insertar Detalle de Venta
            $stmt_detalle = $conn->prepare("INSERT INTO detalle_venta (id_venta, id_producto, cantidad_vendida, subtotal) VALUES (?, ?, ?, ?)");
            $stmt_detalle->bind_param("iidd", $id_venta, $id_producto, $cantidad_vendida, $subtotal);
            $stmt_detalle->execute();
            $stmt_detalle->close();

            // Deducir Insumos (Lógica Anti-Merma)
            $sql_receta = "SELECT r.id_insumo, r.cantidad_requerida, i.stock_actual, i.unidad_medida, i.nombre FROM recetas r JOIN insumos i ON r.id_insumo = i.id_insumo WHERE r.id_producto = ?";
            $res_receta = $conn->prepare($sql_receta);
            $res_receta->bind_param("i", $id_producto);
            $res_receta->execute();
            $result_receta = $res_receta->get_result();

            while ($req = $result_receta->fetch_assoc()) {
                $id_insumo = $req['id_insumo'];
                // Consumo total = Cantidad requerida por producto * Cantidad de productos vendidos
                $consumo_total = $req['cantidad_requerida'] * $cantidad_vendida;
                
                // Chequeo de Stock CRÍTICO (aunque esto debería hacerse en el frontend)
                if ($req['stock_actual'] < $consumo_total) {
                    throw new Exception("Stock insuficiente de {$req['nombre']} para {$cantidad_vendida} de {$nombre_producto}. Se necesita {$consumo_total} {$req['unidad_medida']}.");
                }
                
                // Deducción de inventario
                $stmt_update = $conn->prepare("UPDATE insumos SET stock_actual = stock_actual - ? WHERE id_insumo = ?");
                $stmt_update->bind_param("di", $consumo_total, $id_insumo);
                $stmt_update->execute();
                $stmt_update->close();
            }
            $res_receta->close();
        }

        // COMMIT (Confirmar la transaccion)
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Venta registrada e inventario deducido.', 'id_venta' => $id_venta]);

    } catch (Exception $e) {
        // ROLLBACK (Revertir si hay un error)
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la transacción de venta: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
$conn->close();
?>