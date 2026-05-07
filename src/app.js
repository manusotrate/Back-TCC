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

const allowedOrigins = ['http://localhost:8100', 'http://localhost:4200'];
if (process.env.APP_URL) {
  allowedOrigins.push(...String(process.env.APP_URL).split(',').map(s => s.trim()).filter(Boolean));
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
};

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