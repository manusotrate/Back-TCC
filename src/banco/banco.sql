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
DROP SCHEMA IF EXISTS `tcc` ;

-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tcc` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `tcc` ;

-- -----------------------------------------------------
-- Table `tcc`.`usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`usuarios` ;

CREATE TABLE IF NOT EXISTS `tcc`.`usuarios` (
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
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`viagens`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`viagens` ;

CREATE TABLE IF NOT EXISTS `tcc`.`viagens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `origem` VARCHAR(45) NOT NULL,
  `destino` VARCHAR(45) NOT NULL,
  `distancia_km` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`tickets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`tickets` ;

CREATE TABLE IF NOT EXISTS `tcc`.`tickets` (
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
    REFERENCES `tcc`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_viagens1`
    FOREIGN KEY (`viagens_id`)
    REFERENCES `tcc`.`viagens` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`historico_viagens`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`historico_viagens` ;

CREATE TABLE IF NOT EXISTS `tcc`.`historico_viagens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuarios_id` INT NOT NULL,
  `ticket_id` INT NOT NULL,
  `origem` VARCHAR(100) NOT NULL,
  `destino` VARCHAR(100) NOT NULL,
  `distancia_km` DECIMAL(10,2) NOT NULL,
  `usado_em` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_historico_usuarios_idx` (`usuarios_id` ASC) VISIBLE,
  INDEX `fk_historico_tickets_idx` (`ticket_id` ASC) VISIBLE,
  CONSTRAINT `fk_historico_tickets`
    FOREIGN KEY (`ticket_id`)
    REFERENCES `tcc`.`tickets` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_historico_usuarios`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tcc`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`pagamentos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`pagamentos` ;

CREATE TABLE IF NOT EXISTS `tcc`.`pagamentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `valor` DECIMAL(10,3) NOT NULL,
  `formas_pagamento` ENUM('Crédito', 'Debito', 'Pix') NOT NULL,
  `data` TIMESTAMP NOT NULL,
  `tickets_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_pagamentos_tickets_idx` (`tickets_id` ASC) VISIBLE,
  CONSTRAINT `fk_pagamentos_tickets`
    FOREIGN KEY (`tickets_id`)
    REFERENCES `tcc`.`tickets` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`pagamentos_recarga`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`pagamentos_recarga` ;

CREATE TABLE IF NOT EXISTS `tcc`.`pagamentos_recarga` (
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
    REFERENCES `tcc`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`tokens_recuperacao`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`tokens_recuperacao` ;

CREATE TABLE IF NOT EXISTS `tcc`.`tokens_recuperacao` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `token` VARCHAR(100) NOT NULL,
  `expira_em` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `usuario_id` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `fk_tokens_usuario`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `tcc`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
