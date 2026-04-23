const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/pagamentos/pix", verificarToken, paymentController.criarPagamentoPix);
router.post("/pagamentos/debito", verificarToken, paymentController.criarPagamentoDebito);
router.get("/pagamentos/status/:paymentId", verificarToken, paymentController.consultarPagamento);
// Usar parser raw para validar assinatura HMAC do webhook
router.post(
	"/pagamentos/webhook",
	express.raw({ type: "application/json" }),
	paymentController.webhook
);
router.get("/usuario/saldo", verificarToken, paymentController.getSaldo);

module.exports = router;