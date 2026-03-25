const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/pagamentos/pix", verificarToken, paymentController.criarPagamentoPix);
router.post("/pagamentos/debito", verificarToken, paymentController.criarPagamentoDebito);
router.get("/pagamentos/status/:paymentId", verificarToken, paymentController.consultarPagamento);
router.post("/pagamentos/webhook", paymentController.webhook);
router.get("/usuario/saldo", verificarToken, paymentController.getSaldo);

module.exports = router;