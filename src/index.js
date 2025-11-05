// backend.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());



// Testar conexão
(async () => {
  try {
    await db.getConnection();
    console.log("Conectado ao MySQL ✅");
  } catch (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  }
})();

// ======================
// Cadastro
// ======================
app.post("/cadastro", async (req, res) => {
  const { nome, sobrenome, email, cpf, senha } = req.body;

  if (!nome || !sobrenome || !email || !cpf || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir no banco
    await db.query(
      "INSERT INTO cadastro (nome, sobrenome, email, cpf, senha) VALUES (?, ?, ?, ?, ?)",
      [nome, sobrenome, email, cpf.replace(/\D/g, ''), hashedSenha]
    );

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

// ======================
// Login
// ======================
app.post("/login", async (req, res) => {
  const { cpf, senha } = req.body;
  if (!cpf || !senha) return res.status(400).json({ erro: "CPF e senha são obrigatórios" });

  try {
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Consulta ajustada para ignorar pontos/traços no banco
    const [results] = await db.query(
      "SELECT * FROM cadastro WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?",
      [cpfLimpo]
    );

    if (results.length === 0) return res.status(401).json({ erro: "CPF não encontrado" });

    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) return res.status(401).json({ erro: "Senha incorreta" });

    res.json({ mensagem: "Login realizado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});


// ======================
// Servidor
// ======================
app.listen(4000, () => {
  console.log("Servidor rodando na porta 4000 🚀");
});