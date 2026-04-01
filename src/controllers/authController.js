const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../banco/database");
require("dotenv").config();

// ================= CADASTRO =================
exports.cadastro = async (req, res) => {
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
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ erro: "CPF ou email já cadastrado" });
    }

    console.error('ERRO CADASTRO:', error);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ erro: "CPF e senha são obrigatórios" });
  }

  try {
    const cpfLimpo = cpf.replace(/\D/g, '');

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
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        email: usuario.email
      }
    });

  } catch (err) {
    console.error('ERRO LOGIN:', err); // ← adicione isso
    res.status(500).json({ erro: "Erro no servidor" });
  }
};

// ================= USUÁRIO =================
exports.getUsuario = async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT id, nome, sobrenome, email, cpf FROM usuarios WHERE id = ?",
      [req.usuario.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json({ usuario: results[0] });

  } catch (err) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
};

exports.validarToken = (req, res) => {
  res.json({
    valido: true,
    usuario: req.usuario
  });
};