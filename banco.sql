-- Criar banco
CREATE SCHEMA IF NOT EXISTS `tcc`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE `tcc`;

-- -----------------------------------------------------
-- Tabela usuarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `sobrenome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `saldo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE (`email`),
  UNIQUE (`cpf`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabela viagens
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `viagens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `origem` VARCHAR(100) NOT NULL,
  `destino` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabela tickets
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `duracao` TIME NOT NULL,
  `quantidade` INT NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `ativacao` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('ativo', 'usado') NOT NULL DEFAULT 'ativo',
  `usuario_id` INT NOT NULL,
  `viagem_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`viagem_id`) REFERENCES `viagens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabela pagamentos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pagamentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `valor` DECIMAL(10,2) NOT NULL,
  `forma_pagamento` ENUM('Credito', 'Debito', 'Pix') NOT NULL,
  `data_pagamento` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
