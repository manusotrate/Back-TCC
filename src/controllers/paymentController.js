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

    const body = {
      transaction_amount: parseFloat(valor),
      token,
      description: "Recarga BusTap",
      installments: 1,
      payment_method_id: paymentMethodId,
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
    };

    console.log('🚀 Payload completo para MP:', JSON.stringify(body, null, 2));
    const resultado = await payment.create({ body });

    // Compatibilidade com diferentes formatos de retorno da SDK
    const paymentId = String(resultado.id || (resultado.response && resultado.response.id) || (resultado.body && resultado.body.id));
    const status = resultado.status || (resultado.response && resultado.response.status) || (resultado.body && resultado.body.status);
    const statusDetail = resultado.status_detail || (resultado.response && resultado.response.status_detail) || (resultado.body && resultado.body.status_detail);

    console.log("Status retornado pelo MP:", status, statusDetail);

    if (status === "approved" || status === "authorized") {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Verifica se o pagamento já foi processado para evitar crédito duplo
        const [exist] = await conn.query(
          "SELECT status FROM pagamentos_recarga WHERE payment_id_mp = ? FOR UPDATE",
          [paymentId]
        );

        if (exist.length === 0) {
          await conn.query(
            `INSERT INTO pagamentos_recarga (usuario_id, payment_id_mp, valor, status)
             VALUES (?, ?, ?, 'aprovado')`,
            [usuarioId, paymentId, parseFloat(valor)]
          );

          await conn.query(
            "UPDATE usuarios SET saldo = saldo + ? WHERE id = ?",
            [parseFloat(valor), usuarioId]
          );

          console.log(`✅ Débito processado: inserido pagamento ${paymentId} e creditado R$${valor} para usuário ${usuarioId}`);
        } else if (exist[0].status !== 'aprovado') {
          await conn.query(
            "UPDATE pagamentos_recarga SET status = 'aprovado' WHERE payment_id_mp = ?",
            [paymentId]
          );
          await conn.query(
            "UPDATE usuarios SET saldo = saldo + ? WHERE id = ?",
            [parseFloat(valor), usuarioId]
          );
          console.log(`✅ Débito processado: pagamento ${paymentId} atualizado para aprovado e creditado R$${valor} para usuário ${usuarioId}`);
        } else {
          console.log(`⚠️ Pagamento ${paymentId} já estava marcado como aprovado — nenhum crédito aplicado.`);
        }

        await conn.commit();
      } catch (err) {
        await conn.rollback();
        console.error("Erro transação débito:", err);
      } finally {
        conn.release();
      }
    }

    // Se foi aprovado, retorna também o saldo atualizado
    if (status === "approved" || status === "authorized") {
      try {
        const [saldoResult] = await db.query(
          "SELECT saldo FROM usuarios WHERE id = ?",
          [usuarioId]
        );
        const novoSaldo = saldoResult && saldoResult[0] ? parseFloat(saldoResult[0].saldo) : null;

        return res.json({
          paymentId,
          status,
          statusDetail,
          novoSaldo,
        });
      } catch (err) {
        console.error('Erro ao buscar saldo após processamento:', err);
      }
    }

    res.json({
      paymentId,
      status,
      statusDetail,
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

// ================= PAGAMENTO COM DÉBITO =================
exports.pagarComDebito = async (req, res) => {
  const { valor, token, paymentMethodId, issuerId, installments } = req.body;
  const usuarioId = req.usuario.id;

  try {
    console.log("📋 Dados recebidos para débito:", {
      valor,
      token: token ? `${token.substring(0, 20)}...` : "não informado",
      tokenLength: token ? token.length : 0,
      paymentMethodId,
      issuerId,
      installments
    });

    // Validação básica
    if (!valor || valor <= 0) {
      return res.status(400).json({ erro: "Valor inválido" });
    }

    if (!token) {
      return res.status(400).json({ erro: "Token do cartão não fornecido" });
    }

    // Processa pagamento via Mercado Pago com token
    const payment = new Payment(client);
    
    const paymentPayload = {
      body: {
        transaction_amount: parseFloat(valor),
        token: token, // Token gerado pelo SDK do MP no frontend
        installments: installments || 1,
        payment_method_id: paymentMethodId || "visa",
        payer: {
          email: req.usuario.email,
        },
        description: "Recarga BusTap - Débito",
        metadata: {
          usuario_id: usuarioId,
          tipo: "recarga",
          valor: parseFloat(valor),
        },
      },
    };

    // Só adiciona issuer_id se for um número inteiro válido
    if (issuerId) {
      const parsedIssuer = Number(issuerId);
      if (!isNaN(parsedIssuer) && Number.isInteger(parsedIssuer) && parsedIssuer > 0) {
        paymentPayload.body.issuer_id = parsedIssuer;
      } else {
        console.warn(`issuerId inválido ignorado: ${issuerId} (não é número inteiro positivo)`);
      }
    }

    console.log("📤 Enviando payload ao MP:", JSON.stringify(paymentPayload.body, null, 2));

    const paymentResponse = await payment.create(paymentPayload);

    console.log("📥 Resposta do MP completa:", JSON.stringify(paymentResponse, null, 2));

    // Se aprovado, atualiza saldo
    if (paymentResponse.status === "approved" || paymentResponse.status === "authorized") {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query(
          "UPDATE usuarios SET saldo = saldo + ? WHERE id = ?",
          [valor, usuarioId]
        );

        await conn.query(
          `INSERT INTO pagamentos_recarga 
            (usuario_id, payment_id_mp, valor, status, criado_em)
           VALUES (?, ?, ?, 'aprovado', NOW())`,
          [usuarioId, String(paymentResponse.id), valor]
        );

        await conn.commit();
        console.log(`✅ Pagamento com débito aprovado: usuário ${usuarioId} +R$${valor}`);

        // Busca o novo saldo
        const [saldoResult] = await db.query(
          "SELECT saldo FROM usuarios WHERE id = ?",
          [usuarioId]
        );

        res.json({
          sucesso: true,
          status: "approved",
          mensagem: "Pagamento aprovado",
          novoSaldo: parseFloat(saldoResult[0].saldo),
          paymentId: paymentResponse.id,
        });
      } catch (err) {
        await conn.rollback();
        console.error("Erro na transação de débito:", err);
        res.status(500).json({ erro: "Erro ao processar pagamento" });
      } finally {
        conn.release();
      }
    } else {
      // Pagamento recusado ou pendente
      console.warn(`⚠️ Pagamento ${paymentResponse.status}:`, paymentResponse.status_detail);
      res.status(400).json({
        sucesso: false,
        status: paymentResponse.status,
        statusDetail: paymentResponse.status_detail || "Pagamento não aprovado",
        mensagem: paymentResponse.status_detail || "Pagamento não aprovado",
      });
    }
  } catch (error) {
    console.error("Erro ao processar pagamento com débito:", error);
    res.status(500).json({ 
      erro: "Erro ao processar pagamento",
      detalhes: error.message 
    });
  }
};