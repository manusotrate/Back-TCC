const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const db = require("../banco/database");
require("dotenv").config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ================= CRIAR PREFERÊNCIA (CHECKOUT) =================
exports.criarPreferencia = async (req, res) => {
  const { valor } = req.body;
  const usuarioId = req.usuario.id;
  const usuarioNome = req.usuario.nome;
  const usuarioEmail = req.usuario.email;

  if (!valor || valor <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  try {
    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
        items: [
          {
            id: `recarga-${usuarioId}-${Date.now()}`,
            title: "Recarga BusTap",
            description: `Recarga de saldo no valor de R$${valor.toFixed(2)}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: parseFloat(valor),
          },
        ],
        payer: {
          name: usuarioNome,
          email: usuarioEmail,
        },
        payment_methods: {
          installments: 1, // sem parcelamento para recarga
        },
        back_urls: {
            success: `http://localhost:8100/recarga/sucesso`,
            failure: `http://localhost:8100/recarga/falha`,
            pending: `http://localhost:8100/recarga/pendente`,
        },
        notification_url: `${process.env.BACKEND_URL}/pagamentos/webhook`,
        metadata: {
          usuario_id: usuarioId,
          tipo: "recarga",
          valor: parseFloat(valor),
        },
        external_reference: `recarga-${usuarioId}-${Date.now()}`,
      },
    });

    res.json({
      preferenceId: resultado.id,
      checkoutUrl: resultado.init_point,       // produção
      checkoutUrlSandbox: resultado.sandbox_init_point, // testes
    });
  } catch (error) {
    console.error("Erro ao criar preferência MP:", error);
    res.status(500).json({ erro: "Erro ao criar pagamento" });
  }
};

// ================= WEBHOOK (NOTIFICAÇÃO DO MP) =================
exports.webhook = async (req, res) => {
  const { type, data } = req.body;

  // Responde imediatamente pro MP (ele exige resposta rápida)
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

    // Evita processar o mesmo pagamento duas vezes
    const [jaProcessado] = await db.query(
      "SELECT id FROM pagamentos_recarga WHERE payment_id_mp = ?",
      [String(paymentId)]
    );

    if (jaProcessado.length > 0) return;

    // Atualiza saldo e registra pagamento em uma transação
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
        [usuarioId, String(paymentId), valor]
      );

      await conn.commit();
      console.log(`✅ Saldo atualizado: usuário ${usuarioId} +R$${valor}`);
    } catch (err) {
      await conn.rollback();
      console.error("Erro na transação do webhook:", err);
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Erro ao processar webhook MP:", error);
  }
};

// ================= CONSULTAR SALDO ATUALIZADO =================
exports.getSaldo = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT saldo FROM usuarios WHERE id = ?",
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json({ saldo: parseFloat(rows[0].saldo) });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar saldo" });
  }
};