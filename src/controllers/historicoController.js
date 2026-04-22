const db = require("../banco/database");

// ================= BUSCAR HISTÓRICO DO USUÁRIO =================
exports.getHistorico = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const [rows] = await db.query(
      `SELECT 
        h.id,
        h.origem,
        h.destino,
        h.distancia_km,
        h.usado_em
       FROM historico_viagens h
       WHERE h.usuarios_id = ?
       ORDER BY h.usado_em DESC`,
      [usuarioId]
    );

    res.json({ historico: rows });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
};

// ================= USAR TICKET (marca como usado e salva histórico) =================
exports.usarTicket = async (req, res) => {
  const { ticket_id, origem, destino } = req.body;
  const usuarioId = req.usuario.id;

  if (!ticket_id || !origem || !destino) {
    return res.status(400).json({ erro: "ticket_id, origem e destino são obrigatórios" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica se o ticket pertence ao usuário e está ativo
    const [tickets] = await conn.query(
      `SELECT id, distancia_km, status FROM tickets
       WHERE id = ? AND usuarios_id = ? AND status = 'ativo'`,
      [ticket_id, usuarioId]
    );

    if (tickets.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: "Ticket não encontrado ou já utilizado" });
    }

    const ticket = tickets[0];

    // Marca ticket como usado
    await conn.query(
      "UPDATE tickets SET status = 'usado' WHERE id = ?",
      [ticket_id]
    );

    // Salva no histórico
    await conn.query(
      `INSERT INTO historico_viagens (usuarios_id, ticket_id, origem, destino, distancia_km)
       VALUES (?, ?, ?, ?, ?)`,
      [usuarioId, ticket_id, origem, destino, ticket.distancia_km]
    );

    await conn.commit();

    res.json({
      mensagem: "Ticket utilizado com sucesso!",
      distancia_km: ticket.distancia_km,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Erro ao usar ticket:", error);
    res.status(500).json({ erro: "Erro ao usar ticket" });
  } finally {
    conn.release();
  }
};