const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../banco/database");

require("dotenv").config();

// ================= CADASTRO =================
exports.cadastro = async (req, res) => {
  const { nome, sobrenome, email, cpf, senha } = req.body;

  if (!nome || !sobrenome || !email || !cpf || !senha) {
    return res.status(400).json({
      erro: "Todos os campos são obrigatórios"
    });
  }

  try {
    const cpfLimpo = cpf.replace(/\D/g, "");
    const hashedSenha = await bcrypt.hash(senha, 10);

    await db.query(
      `INSERT INTO usuarios 
      (nome, sobrenome, email, cpf, senha) 
      VALUES (?, ?, ?, ?, ?)`,
      [nome, sobrenome, email, cpfLimpo, hashedSenha]
    );

    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!"
    });

  } catch (error) {

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        erro: "CPF ou email já cadastrado"
      });
    }

    console.error("ERRO CADASTRO:", error);

    res.status(500).json({
      erro: "Erro ao cadastrar usuário"
    });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({
      erro: "CPF e senha são obrigatórios"
    });
  }

  try {

    const cpfLimpo = cpf.replace(/\D/g, "");

    const [results] = await db.query(
      "SELECT * FROM usuarios WHERE cpf = ?",
      [cpfLimpo]
    );

    if (results.length === 0) {
      return res.status(401).json({
        erro: "CPF não encontrado"
      });
    }

    const usuario = results[0];

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "Senha incorreta"
      });
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
      {
        expiresIn: "24h"
      }
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

  } catch (error) {

    console.error("ERRO LOGIN:", error);

    res.status(500).json({
      erro: "Erro no servidor"
    });
  }
};

// ================= USUÁRIO =================
exports.getUsuario = async (req, res) => {

  try {

    const [results] = await db.query(
      `SELECT id, nome, sobrenome, email, cpf 
       FROM usuarios 
       WHERE id = ?`,
      [req.usuario.id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado"
      });
    }

    res.json({
      usuario: results[0]
    });

  } catch (error) {

    console.error("ERRO USUARIO:", error);

    res.status(500).json({
      erro: "Erro no servidor"
    });
  }
};

// ================= VALIDAR TOKEN =================
exports.validarToken = (req, res) => {

  res.json({
    valido: true,
    usuario: req.usuario
  });
};

// ================= RECUPERAR SENHA =================
exports.recuperarSenha = async (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      erro: "Email obrigatório"
    });
  }

  try {

    const [rows] = await db.query(
      "SELECT id, nome FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.json({
        mensagem: "Se o email existir, você receberá as instruções."
      });
    }

    const usuario = rows[0];

    // Token aleatório
    const token = crypto.randomBytes(32).toString("hex");

    // Expira em 1 hora
    const expira = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await db.query(
      `INSERT INTO tokens_recuperacao 
      (usuario_id, token, expira_em)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      token = VALUES(token),
      expira_em = VALUES(expira_em)`,
      [usuario.id, token, expira]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const link = `${process.env.APP_URL}/redefinir-senha?token=${token}`;

   try {
  const info = await transporter.sendMail({
    from: `"BusTap" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Recuperação de senha - BusTap",
    html: `
      <h2>Olá, ${usuario.nome}!</h2>
      <p>Clique no link abaixo para redefinir sua senha:</p>
      <a href="${link}">Redefinir senha</a>
      <p>Este link expira em 1 hora.</p>
      <p>Se não foi você, ignore este email.</p>
    `
  });

  console.log("✅ Email enviado:", info.messageId);

} catch (emailError) {

  console.error("❌ Código do erro:", emailError.code);
  console.error("❌ Mensagem:", emailError.message);
  console.error("❌ Resposta SMTP:", emailError.response);

  throw emailError;
}

    res.json({
      mensagem: "Se o email existir, você receberá as instruções."
    });

  } catch (error) {

    console.error(
      "Erro recuperar senha:",
      error.message,
      error.stack
    );

    res.status(500).json({
      erro: "Erro ao processar solicitação"
    });
  }
};

// ================= REDEFINIR SENHA =================
exports.redefinirSenha = async (req, res) => {

  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {

    return res.status(400).json({
      erro: "Token e nova senha obrigatórios"
    });
  }

  try {

    const [rows] = await db.query(
      `SELECT * 
       FROM tokens_recuperacao 
       WHERE token = ?
       AND expira_em > NOW()`,
      [token]
    );

    if (rows.length === 0) {

      return res.status(400).json({
        erro: "Token inválido ou expirado"
      });
    }

    const hashedSenha = await bcrypt.hash(
      novaSenha,
      10
    );

    await db.query(
      "UPDATE usuarios SET senha = ? WHERE id = ?",
      [
        hashedSenha,
        rows[0].usuario_id
      ]
    );

    await db.query(
      "DELETE FROM tokens_recuperacao WHERE token = ?",
      [token]
    );

    res.json({
      mensagem: "Senha redefinida com sucesso!"
    });

  } catch (error) {

    console.error(
      "Erro redefinir senha:",
      error
    );

    res.status(500).json({
      erro: "Erro ao redefinir senha"
    });
  }
};