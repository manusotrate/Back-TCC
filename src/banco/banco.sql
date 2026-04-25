-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `tccbanco` ;

-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tccbanco` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `tccbanco` ;

-- -----------------------------------------------------
-- Table `tcc`.`usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tccbanco`.`usuarios` ;

CREATE TABLE IF NOT EXISTS `tccbanco`.`usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `sobrenome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `saldo` DECIMAL(10,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE,
  UNIQUE INDEX `cpf` (`cpf` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tccbanco`.`viagens`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tccbanco`.`viagens` ;

CREATE TABLE IF NOT EXISTS `tccbanco`.`viagens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `origem` VARCHAR(45) NOT NULL,
  `destino` VARCHAR(45) NOT NULL,
  `distancia_km` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tccbanco`.`tickets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tccbanco`.`tickets` ;

CREATE TABLE IF NOT EXISTS `tccbanco`.`tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(100) NOT NULL,
  `valor` DECIMAL(10,3) NOT NULL,
  `ativação` TIMESTAMP NOT NULL,
  `status` ENUM('ativo', 'usado', 'cancelado', 'expirado') NOT NULL DEFAULT 'ativo',
  `viagens_id` INT NOT NULL,
  `usuarios_id` INT NOT NULL,
  `distancia_km` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `codigo` (`codigo` ASC) VISIBLE,
  INDEX `fk_tickets_viagens1_idx` (`viagens_id` ASC) VISIBLE,
  INDEX `fk_tickets_usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_tickets_usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tccbanco`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_viagens1`
    FOREIGN KEY (`viagens_id`)
    REFERENCES `tccbanco`.`viagens` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tccbanco`.`pagamentos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tccbanco`.`pagamentos` ;

CREATE TABLE IF NOT EXISTS `tccbanco`.`pagamentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `valor` DECIMAL(10,3) NOT NULL,
  `formas_pagamento` ENUM('Crédito', 'Debito', 'Pix') NOT NULL,
  `data` TIMESTAMP NOT NULL,
  `tickets_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_pagamentos_tickets_idx` (`tickets_id` ASC) VISIBLE,
  CONSTRAINT `fk_pagamentos_tickets`
    FOREIGN KEY (`tickets_id`)
    REFERENCES `tccbanco`.`tickets` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tccbanco`.`pagamentos_recarga`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tccbanco`.`pagamentos_recarga` ;

CREATE TABLE IF NOT EXISTS `tccbanco`.`pagamentos_recarga` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `payment_id_mp` VARCHAR(100) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `status` ENUM('aprovado', 'pendente', 'recusado') NOT NULL DEFAULT 'pendente',
  `criado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `payment_id_mp` (`payment_id_mp` ASC) VISIBLE,
  INDEX `fk_pagamentos_recarga_usuario_idx` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `fk_pagamentos_recarga_usuario`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `tccbanco`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
