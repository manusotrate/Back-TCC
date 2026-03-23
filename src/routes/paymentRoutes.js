const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verificarToken = require("../middlewares/authMiddleware");

<<<<<<< HEAD
// Cria preferência de pagamento (requer login)
router.post("/pagamentos/preferencia", verificarToken, paymentController.criarPreferencia);

// Pagamento com débito (requer login)
router.post("/pagamentos/debito", verificarToken, paymentController.pagarComDebito);

// Webhook do Mercado Pago (sem autenticação — chamado pelo MP)
=======
router.post("/pagamentos/pix", verificarToken, paymentController.criarPagamentoPix);
router.post("/pagamentos/debito", verificarToken, paymentController.criarPagamentoDebito);
router.get("/pagamentos/status/:paymentId", verificarToken, paymentController.consultarPagamento);
>>>>>>> cf64ba535304f348ca950249a76c8c912e7e7d56
router.post("/pagamentos/webhook", paymentController.webhook);
router.get("/usuario/saldo", verificarToken, paymentController.getSaldo);

module.exports = router;