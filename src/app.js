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

// Configure CORS: use `APP_URL` in production, otherwise permissive for local dev
const corsOptions = process.env.APP_URL ? { origin: process.env.APP_URL } : {};
app.use(cors(corsOptions));

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

// Healthcheck and root route so Azure/Render show a simple response
app.get('/health', (req, res) => res.sendStatus(200));
app.get('/', (req, res) => res.send('Back-TCC API is running'));

module.exports = app;