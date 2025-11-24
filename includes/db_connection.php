<?php
// Credenciales
$servername = "localhost";
$username = "root";
$password = "root";
$dbname = "taqueria_inventario_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
// Configurar la zona horaria de php
date_default_timezone_set('America/Mexico_City');

// Sincronizar sona horaria de php con mysql
$offset = date('P'); 
$conn->query("SET time_zone='$offset';");

$conn->set_charset("utf8");
?>