const express = require("express");
const router = express.Router();

const ticketController = require("../controllers/ticketController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/tickets", verificarToken, ticketController.getTickets);
router.post("/tickets/comprar", verificarToken, ticketController.comprarTicket);

module.exports = router;