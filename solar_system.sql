
-- 1) Créer la base de données 
CREATE DATABASE IF NOT EXISTS `solar_system`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `solar_system`;

--  Créations  la table `planets`
DROP TABLE IF EXISTS `planets`;

CREATE TABLE `planets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pseudo` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `size` DOUBLE NOT NULL,
  `distance` DOUBLE NOT NULL,
  `temperature` DOUBLE NOT NULL,
  `atmosphere` TEXT,
  `hasWater` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



