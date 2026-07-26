-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: giga_fleet
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `operations`
--

DROP TABLE IF EXISTS `operations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `event_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setup_time` time DEFAULT NULL,
  `breakdown_time` time DEFAULT NULL,
  `pickup_time` time DEFAULT NULL,
  `maintenance_notes` text COLLATE utf8mb4_unicode_ci,
  `observations` text COLLATE utf8mb4_unicode_ci,
  `status` enum('AGENDADO','EM_MONTAGEM','EM_OPERACAO','EM_DESMONTAGEM','FINALIZADO','CANCELADO') COLLATE utf8mb4_unicode_ci DEFAULT 'AGENDADO',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `client` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `vehicle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technician` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_plate` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technician_names` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `idx_operations_date` (`event_date`),
  KEY `idx_operations_status` (`status`),
  CONSTRAINT `operations_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operations`
--

LOCK TABLES `operations` WRITE;
/*!40000 ALTER TABLE `operations` DISABLE KEYS */;
INSERT INTO `operations` VALUES (22,6,'Teste','2026-07-26','Travessa Tenente Manoel De Lima 18','18:54:00','22:55:00',NULL,NULL,'teste','EM_MONTAGEM','2026-07-26 17:55:19','2026-07-26 17:55:19','',NULL,NULL,NULL,'evening','UBI9F89','EDINHO','EDINHO'),(23,2,'Teste','2026-07-30','Travessa Tenente Manoel De Lima 18','10:28:00','18:53:00',NULL,NULL,NULL,'EM_MONTAGEM','2026-07-26 18:53:22','2026-07-26 18:53:22','',NULL,NULL,NULL,'morning','UBI9F89','DVD','DVD'),(24,2,'teste 02','2026-07-26','Travessa Tenente Manoel De Lima 18','06:11:00','23:11:00',NULL,NULL,'tes','EM_MONTAGEM','2026-07-26 19:11:41','2026-07-26 19:11:41','',NULL,NULL,NULL,'morning','SET5G18','DVD','DVD'),(25,1,'Teste','2026-07-26','Travessa Tenente Manoel De Lima 18','16:19:00','22:19:00',NULL,NULL,NULL,'EM_MONTAGEM','2026-07-26 19:19:51','2026-07-26 19:19:51','',NULL,NULL,NULL,'afternoon','SET5G18','DVD','DVD');
/*!40000 ALTER TABLE `operations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-26 19:27:58
