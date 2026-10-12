
require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const registerGameSocket = require("./sockets/gameSocket");

const authRoutes = require("./routes/auth");
const depositRoutes = require("./routes/deposit");
const mpesaCallbackRoutes = require("./routes/mpesaCallback");
const withdrawRoutes = require("./routes/withdraw");
const adminRoutes = require("./routes/adminWithdrawals");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", authRoutes);
app.use("/api", depositRoutes);
app.use("/api", mpesaCallbackRoutes);
app.use("/api", withdrawRoutes);
app.use("/api", adminRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

const start = async () => {
  await connectDB();
  registerGameSocket(io);
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
