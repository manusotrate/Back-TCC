const mysql = require("mysql2/promise");
require("dotenv").config();

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
};

// Habilita SSL condicionalmente quando DB_SSL=true.
// Se `DB_SSL_CA` estiver definido, espera um PEM codificado em base64.
if (String(process.env.DB_SSL).toLowerCase() === 'true') {
  if (process.env.DB_SSL_CA) {
    try {
      const ca = Buffer.from(process.env.DB_SSL_CA, 'base64').toString('utf8');
      poolConfig.ssl = { ca };
    } catch (e) {
      // Se houver problema em decodificar, fallback para aceitar TLS sem validar CA (apenas testes)
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  } else {
    // Ativa TLS mas não exige validação do CA (conveniente para testes).
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const db = mysql.createPool(poolConfig);

module.exports = db;