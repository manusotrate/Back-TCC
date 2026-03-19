const { MercadoPagoConfig, Payment } = require("mercadopago");
const db = require("../banco/database");
require("dotenv").config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ================= PIX =================
exports.criarPagamentoPix = async (req, res) => {
  const { valor } = req.body;
  const { id: usuarioId, nome, email, cpf } = req.usuario;

  if (!valor || valor < 1) {
    return res.status(400).json({ erro: "Valor mínimo é R$1,00" });
  }

  try {
    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: parseFloat(valor),
        description: "Recarga BusTap",
        payment_method_id: "pix",
        payer: {
          email: email,
          first_name: nome,
          identification: {
            type: "CPF",
            number: String(cpf).replace(/\D/g, ""),
          },
        },
        additional_info: {
          payer: {
            first_name: nome,
            identification: {
              type: "CPF",
              number: String(cpf).replace(/\D/g, ""),
            },
          },
        },
        metadata: {
          usuario_id: usuarioId,
          tipo: "recarga",
          valor: parseFloat(valor),
        },
      },
    });

    // Registra como pendente
    await db.query(
      `INSERT INTO pagamentos_recarga (usuario_id, payment_id_mp, valor, status)
       VALUES (?, ?, ?, 'pendente')
       ON DUPLICATE KEY UPDATE status = 'pendente'`,
      [usuarioId, String(resultado.id), parseFloat(valor)]
    );

    res.json({
      paymentId: resultado.id,
      status: resultado.status,
      qrCode: resultado.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: resultado.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao criar Pix:", error);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
};

// ================= DÉBITO =================
exports.criarPagamentoDebito = async (req, res) => {
  const { valor, token, issuerId, installments, paymentMethodId } = req.body;
  const { id: usuarioId, nome, email, cpf } = req.usuario;

  if (!valor || valor < 1) {
    return res.status(400).json({ erro: "Valor mínimo é R$1,00" });
  }
  if (!token) {
    return res.status(400).json({ erro: "Token do cartão é obrigatório" });
  }

  try {
    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: parseFloat(valor),
        token,
        description: "Recarga BusTap",
        installments: 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId,
        payer: {
          email,
          first_name: nome,
          identification: {
            type: "CPF",
            number: String(cpf).replace(/\D/g, ""),
          },
        },
        metadata: {
          usuario_id: usuarioId,
          tipo: "recarga",
          valor: parseFloat(valor),
        },
      },
    });

    // Se aprovado, já atualiza saldo
    if (resultado.status === "approved") {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          "UPDATE usuarios SET saldo = saldo + ? WHERE id = ?",
          [parseFloat(valor), usuarioId]
        );
        await conn.query(
          `INSERT INTO pagamentos_recarga (usuario_id, payment_id_mp, valor, status)
           VALUES (?, ?, ?, 'aprovado')`,
          [usuarioId, String(resultado.id), parseFloat(valor)]
        );
        await conn.commit();
        console.log(`✅ Débito aprovado: usuário ${usuarioId} +R$${valor}`);
      } catch (err) {
        await conn.rollback();
        console.error("Erro transação débito:", err);
      } finally {
        conn.release();
      }
    }

    res.json({
      paymentId: resultado.id,
      status: resultado.status,
      statusDetail: resultado.status_detail,
    });
  } catch (error) {
    console.error("Erro ao processar débito:", error);
    res.status(500).json({ erro: "Erro ao processar cartão de débito" });
  }
};

// ================= POLLING STATUS PIX =================
exports.consultarPagamento = async (req, res) => {
  const { paymentId } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const payment = new Payment(client);
    const pagamento = await payment.get({ id: paymentId });

    if (pagamento.status === "approved") {
      const [jaProcessado] = await db.query(
        "SELECT id FROM pagamentos_recarga WHERE payment_id_mp = ? AND status = 'aprovado'",
        [String(paymentId)]
      );

      if (jaProcessado.length === 0) {
        const valor = pagamento.metadata?.valor || pagamento.transaction_amount;
        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();
          await conn.query(
            "UPDATE usuarios SET saldo = saldo + ? WHERE id = ?",
            [valor, usuarioId]
          );
          await conn.query(
            "UPDATE pagamentos_recarga SET status = 'aprovado' WHERE payment_id_mp = ?",
            [String(paymentId)]
          );
          await conn.commit();
          console.log(`✅ Pix aprovado (polling): usuário ${usuarioId} +R$${valor}`);
        } catch (err) {
          await conn.rollback();
        } finally {
          conn.release();
        }
      }
    }

    res.json({ status: pagamento.status, statusDetail: pagamento.status_detail });
  } catch (error) {
    console.error("Erro ao consultar pagamento:", error);
    res.status(500).json({ erro: "Erro ao consultar pagamento" });
  }
};

// ================= WEBHOOK =================
exports.webhook = async (req, res) => {
  const { type, data } = req.body;
  res.sendStatus(200);
  if (type !== "payment") return;

  try {
    const payment = new Payment(client);
    const pagamento = await payment.get({ id: data.id });
    if (pagamento.status !== "approved") return;

    const usuarioId = pagamento.metadata?.usuario_id;
    const valor = pagamento.metadata?.valor || pagamento.transaction_amount;
    const paymentId = pagamento.id;
    if (!usuarioId || !valor) return;

    const [jaProcessado] = await db.query(
      "SELECT id FROM pagamentos_recarga WHERE payment_id_mp = ? AND status = 'aprovado'",
      [String(paymentId)]
    );
    if (jaProcessado.length > 0) return;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        "UPDATE usuarios SET saldo = saldo + ? WHERE id = ?",
        [valor, usuarioId]
      );
      await conn.query(
        `INSERT INTO pagamentos_recarga (usuario_id, payment_id_mp, valor, status)
         VALUES (?, ?, ?, 'aprovado')
         ON DUPLICATE KEY UPDATE status = 'aprovado'`,
        [usuarioId, String(paymentId), valor]
      );
      await conn.commit();
      console.log(`✅ Webhook: usuário ${usuarioId} +R$${valor}`);
    } catch (err) {
      await conn.rollback();
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Erro no webhook:", error);
  }
};

// ================= SALDO =================
exports.getSaldo = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT saldo FROM usuarios WHERE id = ?",
      [req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ saldo: parseFloat(rows[0].saldo) });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar saldo" });
  }
};