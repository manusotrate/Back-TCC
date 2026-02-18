const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Em produção use variável de ambiente
const JWT_SECRET = "sua_chave_secreta_super_segura_aqui_2024";

// ======================
// Conexão MySQL
// ======================
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "tcc",
  port: 3306
});

(async () => {
  try {
    await db.getConnection();
    console.log("Conectado ao MySQL ✅");
  } catch (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  }
})();

// ======================
// Middleware JWT
// ======================
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded; // 🔥 Corrigido para singular
    next();
  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
};

// ======================
// Cadastro
// ======================
app.post("/cadastro", async (req, res) => {
  const { nome, sobrenome, email, cpf, senha } = req.body;

  if (!nome || !sobrenome || !email || !cpf || !senha) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  try {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const hashedSenha = await bcrypt.hash(senha, 10);

    await db.query(
      "INSERT INTO usuarios (nome, sobrenome, email, cpf, senha) VALUES (?, ?, ?, ?, ?)",
      [nome, sobrenome, email, cpfLimpo, hashedSenha]
    );

    res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });

  } catch (error) {
    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ erro: "CPF ou email já cadastrado" });
    }

    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// ======================
// Login
// ======================
app.post("/login", async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ erro: "CPF e senha são obrigatórios" });
  }

  try {
    const cpfLimpo = cpf.replace(/\D/g, '');

    // 🔥 Consulta simplificada (já salvamos cpf limpo)
    const [results] = await db.query(
      "SELECT * FROM usuarios WHERE cpf = ?",
      [cpfLimpo]
    );

    if (results.length === 0) {
      return res.status(401).json({ erro: "CPF não encontrado" });
    }

    const usuario = results[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email,
        cpf: usuario.cpf
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {   // 🔥 padronizado singular
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// ======================
// Rota protegida - Dados do usuário
// ======================
app.get("/usuarios", verificarToken, async (req, res) => {
  try {

    const [results] = await db.query(
      "SELECT id, nome, sobrenome, email, cpf FROM usuarios WHERE id = ?",
      [req.usuario.id]   // 🔥 corrigido aqui
    );

    if (results.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json({ usuario: results[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// ======================
// Validar token
// ======================
app.get("/validar-token", verificarToken, (req, res) => {
  res.json({
    valido: true,
    usuario: req.usuario   // 🔥 corrigido aqui
  });
});

// ======================
// Servidor
// ======================
app.listen(4000, () => {
  console.log("Servidor rodando na porta 4000 🚀");
});
