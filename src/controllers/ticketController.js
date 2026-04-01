const db = require("../banco/database");
const { v4: uuidv4 } = require("uuid");

// ================= BUSCAR TICKETS DO USUÁRIO =================
exports.getTickets = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const [rows] = await db.query(
      `SELECT 
        id,
        codigo,
        distancia_km,
        valor,
        ativação,
        status
       FROM tickets
       WHERE usuarios_id = ? AND status = 'ativo'
       ORDER BY ativação DESC`,
      [usuarioId]
    );

    res.json({ tickets: rows });
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({ erro: "Erro ao buscar tickets" });
  }
};

// ================= COMPRAR TICKET =================
exports.comprarTicket = async (req, res) => {
  const { distancia_km, valor } = req.body;
  const usuarioId = req.usuario.id;

  if (!distancia_km || !valor) {
    return res.status(400).json({ erro: "Distância (km) e valor são obrigatórios" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica saldo
    const [rows] = await conn.query(
      "SELECT saldo FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const saldoAtual = parseFloat(rows[0].saldo);
    if (saldoAtual < valor) {
      await conn.rollback();
      return res.status(400).json({ erro: "Saldo insuficiente" });
    }

    // Cria viagem genérica se não existir
    let viagemId = 1;
    const [viagens] = await conn.query("SELECT id FROM viagens LIMIT 1");
    if (viagens.length === 0) {
      const [novaViagem] = await conn.query(
        "INSERT INTO viagens (origem, destino, distancia_km) VALUES ('Origem', 'Destino', ?)",
        [distancia_km]
      );
      viagemId = novaViagem.insertId;
    } else {
      viagemId = viagens[0].id;
    }

    // Insere o ticket
    const codigo = uuidv4();

    await conn.query(
      `INSERT INTO tickets (codigo, distancia_km, valor, ativação, status, viagens_id, usuarios_id)
       VALUES (?, ?, ?, NOW(), 'ativo', ?, ?)`,
      [codigo, distancia_km, valor, viagemId, usuarioId]
    );

    // Desconta saldo
    await conn.query(
      "UPDATE usuarios SET saldo = saldo - ? WHERE id = ?",
      [valor, usuarioId]
    );

    await conn.commit();

    // Retorna saldo atualizado
    const [saldoAtualizado] = await conn.query(
      "SELECT saldo FROM usuarios WHERE id = ?",
      [usuarioId]
    );

    res.status(201).json({
      mensagem: "Ticket comprado com sucesso!",
      saldo: parseFloat(saldoAtualizado[0].saldo),
    });
  } catch (error) {
    await conn.rollback();
    console.error("Erro ao comprar ticket:", error);
    res.status(500).json({ erro: "Erro ao comprar ticket" });
  } finally {
    conn.release();
  }
};