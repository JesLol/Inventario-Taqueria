<?php
// Conexion a la bdd
require_once '../includes/db_connection.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Lee todos los insumos
        $sql = "SELECT id_insumo, nombre, unidad_medida, stock_actual, costo_por_unidad FROM insumos ORDER BY nombre";
        $result = $conn->query($sql);
        $insumos = [];
        while ($row = $result->fetch_assoc()) {
            $insumos[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $insumos]);
        break;

    case 'POST':
        // Agrega un nuevo insumo
        $data = json_decode(file_get_contents("php://input"), true);
        $nombre = $data['nombre'] ?? '';
        $unidad = $data['unidad_medida'] ?? '';
        $stock = $data['stock_actual'] ?? 0;
        $costo = $data['costo_por_unidad'] ?? 0;

        if (!$nombre || !$unidad) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios.']);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO insumos (nombre, unidad_medida, stock_actual, costo_por_unidad) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssdd", $nombre, $unidad, $stock, $costo);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Insumo agregado con éxito.', 'id' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al agregar insumo: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'PUT':
        // Actualiza el stock de un insumo
        parse_str(file_get_contents("php://input"), $put_vars);
        $id = $put_vars['id_insumo'] ?? null;
        $stock = $put_vars['stock_actual'] ?? null;

        if (!$id || is_null($stock)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de insumo y stock son obligatorios.']);
            exit();
        }

        $stmt = $conn->prepare("UPDATE insumos SET stock_actual = ? WHERE id_insumo = ?");
        $stmt->bind_param("di", $stock, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Stock actualizado con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar stock: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        // Eliminar un insumo
        parse_str(file_get_contents("php://input"), $delete_vars);
        $id = $delete_vars['id_insumo'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de insumo es obligatorio.']);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM insumos WHERE id_insumo = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Insumo eliminado con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al eliminar insumo: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
        break;
}
$conn->close();
?>