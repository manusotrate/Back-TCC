require("dotenv").config();
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

const db = require("./src/banco/database");

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection();