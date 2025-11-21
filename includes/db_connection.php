<?php
// Credenciales
$servername = "localhost";
$username = "root";
$password = "root";
$dbname = "taqueria_inventario_db";

// Crear conexion
$conn = new mysqli($servername, $username, $password, $dbname);

// Chequear conexion
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
$conn->set_charset("utf8");
?>