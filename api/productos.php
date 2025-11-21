<?php
require_once '../includes/db_connection.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtiene todos los productos con sus recetas
        $sql = "
            SELECT 
                p.id_producto, p.nombre_producto, p.precio_venta, 
                r.id_insumo, r.cantidad_requerida, i.nombre AS insumo_nombre, i.unidad_medida
            FROM productos p
            LEFT JOIN recetas r ON p.id_producto = r.id_producto
            LEFT JOIN insumos i ON r.id_insumo = i.id_insumo
            ORDER BY p.nombre_producto
        ";
        $result = $conn->query($sql);
        $productos = [];

        while ($row = $result->fetch_assoc()) {
            $id = $row['id_producto'];
            if (!isset($productos[$id])) {
                $productos[$id] = [
                    'id_producto' => $row['id_producto'],
                    'nombre_producto' => $row['nombre_producto'],
                    'precio_venta' => $row['precio_venta'],
                    'receta' => []
                ];
            }
            // Agrega insumo a la receta si existe
            if ($row['id_insumo']) {
                $productos[$id]['receta'][] = [
                    'id_insumo' => $row['id_insumo'],
                    'cantidad_requerida' => $row['cantidad_requerida'],
                    'insumo_nombre' => $row['insumo_nombre'],
                    'unidad_medida' => $row['unidad_medida']
                ];
            }
        }
        echo json_encode(['success' => true, 'data' => array_values($productos)]);
        break;

    case 'POST':
        // Agregar nuevo producto y su receta
        $data = json_decode(file_get_contents("php://input"), true);
        $nombre = $data['nombre_producto'] ?? '';
        $precio = $data['precio_venta'] ?? 0;
        $receta = $data['receta'] ?? []; // Array de {id_insumo, cantidad_requerida}

        if (!$nombre || $precio <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios del producto.']);
            exit();
        }

        //INICIO DE TRANSACCION
        $conn->begin_transaction();
        try {
            // Insertar Producto
            $stmt_prod = $conn->prepare("INSERT INTO productos (nombre_producto, precio_venta) VALUES (?, ?)");
            $stmt_prod->bind_param("sd", $nombre, $precio);
            $stmt_prod->execute();
            $id_producto = $conn->insert_id;
            $stmt_prod->close();

            // Insertar Receta
            if (!empty($receta)) {
                $stmt_receta = $conn->prepare("INSERT INTO recetas (id_producto, id_insumo, cantidad_requerida) VALUES (?, ?, ?)");
                foreach ($receta as $item) {
                    $id_insumo = $item['id_insumo'];
                    $cantidad = $item['cantidad_requerida'];
                    $stmt_receta->bind_param("iid", $id_producto, $id_insumo, $cantidad);
                    $stmt_receta->execute();
                }
                $stmt_receta->close();
            }

            //COMMIT
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Producto y receta guardados con exito.', 'id_producto' => $id_producto]);

        } catch (Exception $e) {
            //ROLLBACK
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al guardar producto/receta: ' . $e->getMessage()]);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Metodo no permitido.']);
        break;
}
$conn->close();
?>