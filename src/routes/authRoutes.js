const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/cadastro", authController.cadastro);
router.post("/login", authController.login);
router.get("/usuario", verificarToken, authController.getUsuario);
router.get("/validar-token", verificarToken, authController.validarToken);

module.exports = router;