-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema tcc
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tcc` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`viagens`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`viagens` ;

CREATE TABLE IF NOT EXISTS `mydb`.`viagens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `origem` VARCHAR(45) NOT NULL,
  `destino` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


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
  `saldo` DECIMAL(10,3) NOT NULL DEFAULT 0,
  `pagamentos_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE,
  UNIQUE INDEX `cpf` (`cpf` ASC) VISIBLE,
  INDEX `fk_usuarios_pagamentos1_idx` (`pagamentos_id` ASC) VISIBLE,
  CONSTRAINT `fk_usuarios_pagamentos1`
    FOREIGN KEY (`pagamentos_id`)
    REFERENCES `mydb`.`pagamentos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `tcc`.`tickets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`tickets` ;

CREATE TABLE IF NOT EXISTS `tcc`.`tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `duração` TIME NOT NULL,
  `quantidade` INT NOT NULL,
  `valor` DECIMAL(10,3) NOT NULL,
  `ativação` TIMESTAMP NOT NULL,
  `status` ENUM('ativo', 'usado') NOT NULL,
  `viagens_id` INT NOT NULL,
  `usuarios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cpf` (`duração` ASC) VISIBLE,
  INDEX `fk_tickets_viagens1_idx` (`viagens_id` ASC) VISIBLE,
  INDEX `fk_tickets_usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_tickets_viagens1`
    FOREIGN KEY (`viagens_id`)
    REFERENCES `mydb`.`viagens` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tickets_usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tcc`.`usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `mydb`.`pagamentos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`pagamentos` ;

CREATE TABLE IF NOT EXISTS `mydb`.`pagamentos` (
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
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

USE `tcc` ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
