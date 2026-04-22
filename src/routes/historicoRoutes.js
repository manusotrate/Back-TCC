const express = require("express");
const router = express.Router();

const historicoController = require("../controllers/historicoController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/historico", verificarToken, historicoController.getHistorico);
router.post("/tickets/usar", verificarToken, historicoController.usarTicket);

module.exports = router;