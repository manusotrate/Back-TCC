const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const historicoRoutes = require("./routes/historicoRoutes"); // ← NOVO

const app = express();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());

app.use("/", authRoutes);
app.use("/", paymentRoutes);
app.use("/", ticketRoutes);
app.use("/", historicoRoutes); // ← NOVO

module.exports = app;