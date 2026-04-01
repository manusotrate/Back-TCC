const fs = require('fs');
const db = require('./src/banco/database');

async function runSQL() {
  try {
    const sql = fs.readFileSync('./src/banco/banco.sql', 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    console.log('SQL script executed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

runSQL();