const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");  

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/", paymentRoutes);

module.exports = app;