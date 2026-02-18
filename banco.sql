DROP DATABASE IF EXISTS tcc;

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, 
SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS tcc 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci;

USE tcc;

-- -----------------------------------------------------
-- Table viagens
-- -----------------------------------------------------
DROP TABLE IF EXISTS viagens;

CREATE TABLE viagens (
  id INT NOT NULL AUTO_INCREMENT,
  origem VARCHAR(45) NOT NULL,
  destino VARCHAR(45) NOT NULL,
  PRIMARY KEY (id)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table usuarios
-- -----------------------------------------------------
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  saldo DECIMAL(10,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE (email),
  UNIQUE (cpf)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table tickets
-- -----------------------------------------------------
DROP TABLE IF EXISTS tickets;

CREATE TABLE tickets (
  id INT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  duração TIME NOT NULL,
  valor DECIMAL(10,3) NOT NULL,
  ativação TIMESTAMP NOT NULL,
  status ENUM('ativo', 'usado', 'cancelado', 'expirado') 
         NOT NULL DEFAULT 'ativo',
  viagens_id INT NOT NULL,
  usuarios_id INT NOT NULL,
  PRIMARY KEY (id),

  INDEX fk_tickets_viagens1_idx (viagens_id),
  INDEX fk_tickets_usuarios1_idx (usuarios_id),

  CONSTRAINT fk_tickets_viagens1
    FOREIGN KEY (viagens_id)
    REFERENCES viagens (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_tickets_usuarios1
    FOREIGN KEY (usuarios_id)
    REFERENCES usuarios (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table pagamentos
-- -----------------------------------------------------
DROP TABLE IF EXISTS pagamentos;

CREATE TABLE pagamentos (
  id INT NOT NULL AUTO_INCREMENT,
  valor DECIMAL(10,3) NOT NULL,
  formas_pagamento ENUM('Crédito', 'Debito', 'Pix') NOT NULL,
  data TIMESTAMP NOT NULL,
  tickets_id INT NOT NULL,
  PRIMARY KEY (id),

  INDEX fk_pagamentos_tickets_idx (tickets_id),

  CONSTRAINT fk_pagamentos_tickets
    FOREIGN KEY (tickets_id)
    REFERENCES tickets (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
