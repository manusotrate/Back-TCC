const express = require("express");
const cors = require("cors");

const authRoutes = require("../src/routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", authRoutes);

module.exports = app;