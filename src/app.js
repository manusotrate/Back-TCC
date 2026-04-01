const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");  
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

// Segurança HTTP headers
app.use(helmet());

// CORS: em produção restrinja para seu domínio
app.use(cors());

// Rate limiting básico
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 200, // limite de 200 requisições por IP por janela
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());

app.use("/", authRoutes);
app.use("/", paymentRoutes);
app.use("/", ticketRoutes);


module.exports = app;