DROP DATABASE IF EXISTS tcc;
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS tcc DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE tcc ;

-- -----------------------------------------------------
-- Table tcc.viagens
-- -----------------------------------------------------
DROP TABLE IF EXISTS tcc.viagens ;

CREATE TABLE IF NOT EXISTS tcc.viagens (
  id INT NOT NULL AUTO_INCREMENT,
  origem VARCHAR(45) NOT NULL,
  destino VARCHAR(45) NOT NULL,
  PRIMARY KEY (id))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table tcc.usuarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tcc.usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  saldo DECIMAL(10,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE INDEX email (email ASC) VISIBLE,
  UNIQUE INDEX cpf (cpf ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table tcc.tickets
-- -----------------------------------------------------
DROP TABLE IF EXISTS tcc.tickets ;

CREATE TABLE IF NOT EXISTS tcc.tickets (
  id INT NOT NULL AUTO_INCREMENT,
  duração TIME NOT NULL,
  quantidade INT NOT NULL,
  valor DECIMAL(10,3) NOT NULL,
  ativação TIMESTAMP NOT NULL,
  status ENUM('ativo', 'usado') NOT NULL,
  viagens_id INT NOT NULL,
  usuarios_id INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX cpf (duração ASC) VISIBLE,
  INDEX fk_tickets_viagens1_idx (viagens_id ASC) VISIBLE,
  INDEX fk_tickets_usuarios1_idx (usuarios_id ASC) VISIBLE,
  CONSTRAINT fk_tickets_viagens1
    FOREIGN KEY (viagens_id)
    REFERENCES tcc.viagens (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_tickets_usuarios1
    FOREIGN KEY (usuarios_id)
    REFERENCES tcc.usuarios (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table tcc.pagamentos
-- -----------------------------------------------------
DROP TABLE IF EXISTS tcc.pagamentos ;

CREATE TABLE IF NOT EXISTS tcc.pagamentos (
  id INT NOT NULL AUTO_INCREMENT,
  valor DECIMAL(10,3) NOT NULL,
  formas_pagamento ENUM('Crédito', 'Debito', 'Pix') NOT NULL,
  data TIMESTAMP NOT NULL,
  tickets_id INT NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_pagamentos_tickets_idx (tickets_id ASC) VISIBLE,
  CONSTRAINT fk_pagamentos_tickets
    FOREIGN KEY (tickets_id)
    REFERENCES tcc.tickets (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;