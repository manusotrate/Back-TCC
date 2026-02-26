const express = require("express");
const cors = require("cors");
const authRoutes = require("../routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", authRoutes);

module.exports = app;
