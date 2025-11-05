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
CREATE SCHEMA IF NOT EXISTS `tcc` DEFAULT CHARACTER SET utf8mb3 ;
USE `tcc` ;

-- -----------------------------------------------------
-- Table `tcc`.`historico`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`historico` ;

CREATE TABLE IF NOT EXISTS `tcc`.`historico` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `valor` DECIMAL(10,2) NOT NULL,
  `data` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `tcc`.`usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`usuarios` ;

CREATE TABLE IF NOT EXISTS `tcc`.`usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `sobrenome` VARCHAR(255) NOT NULL,
  `cpf` VARCHAR(11) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `tcc`.`saldos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`saldos` ;

CREATE TABLE IF NOT EXISTS `tcc`.`saldos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `valor` DECIMAL(10,2) NOT NULL,
  `data` DATETIME NOT NULL,
  `usuarios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_saldos_usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_saldos_usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tcc`.`usuarios` (`id`),
  CONSTRAINT `nao_existe`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tcc`.`usuarios` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `tcc`.`pagamentos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`pagamentos` ;

CREATE TABLE IF NOT EXISTS `tcc`.`pagamentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `metodo` ENUM('Entrada', 'Saída') NOT NULL,
  `dinheiro` DECIMAL(10,2) NOT NULL,
  `saldos_id` INT NOT NULL,
  `usuarios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_pagamento_saldos1_idx` (`saldos_id` ASC) VISIBLE,
  INDEX `fk_pagamentos_usuarios_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_pagamento_saldos1`
    FOREIGN KEY (`saldos_id`)
    REFERENCES `tcc`.`saldos` (`id`),
  CONSTRAINT `fk_pagamentos_usuarios`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tcc`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 15
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `tcc`.`pontos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`pontos` ;

CREATE TABLE IF NOT EXISTS `tcc`.`pontos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ponto_chegada` VARCHAR(100) NOT NULL,
  `ponto_partida` VARCHAR(100) NOT NULL,
  `usuarios_idpontos` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_pontos_usuarios_idx` (`usuarios_idpontos` ASC) VISIBLE,
  CONSTRAINT `fk_pontos_usuarios`
    FOREIGN KEY (`usuarios_idpontos`)
    REFERENCES `tcc`.`usuarios` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `tcc`.`viagens`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tcc`.`viagens` ;

CREATE TABLE IF NOT EXISTS `tcc`.`viagens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `valor` DECIMAL(10,2) NOT NULL,
  `horario` DATE NOT NULL,
  `ponto_partida` VARCHAR(100) NOT NULL,
  `ponto_chegada` VARCHAR(100) NOT NULL,
  `usuarios_id` INT NOT NULL,
  `historico_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_viagens_usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  INDEX `fk_viagens_historico1_idx` (`historico_id` ASC) VISIBLE,
  CONSTRAINT `fk_viagens_historico1`
    FOREIGN KEY (`historico_id`)
    REFERENCES `tcc`.`historico` (`id`),
  CONSTRAINT `fk_viagens_usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `tcc`.`usuarios` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;

USE `tcc`;

DELIMITER $$

USE `tcc`$$
DROP TRIGGER IF EXISTS `tcc`.`atualizar_saldo_entrada` $$
USE `tcc`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `tcc`.`atualizar_saldo_entrada`
AFTER INSERT ON `tcc`.`pagamentos`
FOR EACH ROW
BEGIN
    IF NEW.metodo = 'Entrada' THEN
        UPDATE saldos
        SET valor = valor + NEW.dinheiro
        WHERE id = NEW.saldos_id;
    END IF;
END$$


USE `tcc`$$
DROP TRIGGER IF EXISTS `tcc`.`atualizar_saldo_saida` $$
USE `tcc`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `tcc`.`atualizar_saldo_saida`
AFTER INSERT ON `tcc`.`pagamentos`
FOR EACH ROW
BEGIN
    IF NEW.metodo = 'Saída' THEN
        UPDATE saldos
        SET valor = valor - NEW.dinheiro
        WHERE id = NEW.saldos_id;
    END IF;
END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
