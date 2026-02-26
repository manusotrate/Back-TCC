const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "tcc",
    port: 3307, // ajuste se necessário
  });
  
  (async () => {
    try {
      await db.getConnection();
      console.log("✅ Conectado ao MySQL");
    } catch (err) {
      console.error("❌ Erro ao conectar ao MySQL:", err);
    }
  })();