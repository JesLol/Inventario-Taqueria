/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.0.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: taqueria_inventario_db
-- ------------------------------------------------------
-- Server version	12.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `detalle_venta`
--

DROP TABLE IF EXISTS `detalle_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_venta` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad_vendida` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_venta` (`id_venta`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_venta_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE,
  CONSTRAINT `detalle_venta_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_venta`
--

LOCK TABLES `detalle_venta` WRITE;
/*!40000 ALTER TABLE `detalle_venta` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `detalle_venta` VALUES
(1,1,2,1,35.00),
(2,1,1,1,15.00),
(3,2,1,1,15.00),
(4,3,1,1,15.00),
(5,4,1,1,15.00),
(6,5,1,1,15.00),
(7,6,1,1,15.00),
(8,7,2,2,70.00),
(9,7,1,2,30.00),
(10,8,1,1,15.00),
(11,9,2,1,35.00),
(12,9,1,1,15.00);
/*!40000 ALTER TABLE `detalle_venta` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id_insumo` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL COMMENT 'Ej: kg, L, unidad, bulto, docena',
  `stock_actual` decimal(10,3) NOT NULL DEFAULT 0.000 COMMENT 'Stock disponible en la unidad_medida',
  `costo_por_unidad` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Costo para fines de cálculo de utilidad',
  PRIMARY KEY (`id_insumo`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insumos`
--

LOCK TABLES `insumos` WRITE;
/*!40000 ALTER TABLE `insumos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `insumos` VALUES
(1,'Tortillas de Maíz','kg',9.100,20.00),
(2,'Carne al Pastor','kg',9.280,120.00),
(3,'Cebolla','unidad',49.500,2.50),
(4,'Cilantro','manojo',9.900,8.00);
/*!40000 ALTER TABLE `insumos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_producto` varchar(100) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `nombre_producto` (`nombre_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `productos` VALUES
(1,'Taco al Pastor',15.00),
(2,'Quesadilla Pastor',35.00);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `recetas`
--

DROP TABLE IF EXISTS `recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas` (
  `id_producto` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `cantidad_requerida` decimal(10,3) NOT NULL COMMENT 'Cantidad de insumo (en su unidad_medida) que consume 1 unidad de producto',
  PRIMARY KEY (`id_producto`,`id_insumo`),
  KEY `id_insumo` (`id_insumo`),
  CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE,
  CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recetas`
--

LOCK TABLES `recetas` WRITE;
/*!40000 ALTER TABLE `recetas` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `recetas` VALUES
(1,1,0.050),
(1,2,0.040),
(1,3,0.050),
(1,4,0.010),
(2,1,0.100),
(2,2,0.080);
/*!40000 ALTER TABLE `recetas` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_uid` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `role` varchar(20) DEFAULT 'cajero',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_uid` (`user_uid`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `usuarios` VALUES
(5,'692246784ea317.03241049','David','David','$2y$12$0aRampHAQCUDN.uK4W62t.7SS3Ls.XgxlJM2/7pX7EfjkRvCg.RLi','2025-11-22 23:25:44','admin'),
(9,'69224752c9b6f9.41730035','Jesus 2','Jesus 2','$2y$12$VL2BRNqvaiDfkuDN/d1H5.C9LgnTR0jFRKEXvFtpKbgaNfl64v/Pi','2025-11-22 23:29:23','colaborador');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_hora` datetime NOT NULL,
  `total_venta` decimal(10,2) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL COMMENT 'Referencia al empleado que hizo la venta (Opcional: crear tabla usuarios)',
  PRIMARY KEY (`id_venta`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `ventas` VALUES
(1,'2025-11-21 20:54:16',50.00,1),
(2,'2025-11-21 22:00:21',15.00,1),
(3,'2025-11-21 22:00:35',15.00,1),
(4,'2025-11-21 22:00:48',15.00,1),
(5,'2025-11-21 22:00:56',15.00,1),
(6,'2025-11-22 11:00:27',15.00,1),
(7,'2025-11-22 11:24:20',100.00,1),
(8,'2025-11-22 12:14:14',15.00,2),
(9,'2025-11-22 17:33:06',50.00,5);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-11-22 17:36:43
