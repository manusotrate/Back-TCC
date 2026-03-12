const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const verificarToken = require("../middlewares/authMiddleware");

// Cria preferência de pagamento (requer login)
router.post("/pagamentos/preferencia", verificarToken, paymentController.criarPreferencia);

// Webhook do Mercado Pago (sem autenticação — chamado pelo MP)
router.post("/pagamentos/webhook", paymentController.webhook);

// Busca saldo atualizado do usuário (requer login)
router.get("/usuario/saldo", verificarToken, paymentController.getSaldo);

module.exports = router;