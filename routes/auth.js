
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Player = require("../models/Player");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizePhone(input) {
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

router.post("/register", async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    if (!username || !phone || !password) {
      return res.status(400).json({ error: "All fields required." });
    }
    const normalized = normalizePhone(phone);
    const exists = await Player.findOne({ $or: [{ username }, { phone: normalized }] });
    if (exists) return res.status(400).json({ error: "Username or phone already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const player = await Player.create({
      username,
      phone: normalized,
      password: hashed,
      balance: 0,
    });

    const token = jwt.sign({ id: player._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, player: { id: player._id, username, phone: normalized, balance: player.balance } });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const normalized = normalizePhone(phone);
    const player = await Player.findOne({ phone: normalized });
    if (!player) return res.status(400).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, player.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign({ id: player._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, player: { id: player._id, username: player.username, phone: player.phone, balance: player.balance } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/me", auth, async (req, res) => {
  const player = await Player.findById(req.playerId).select("-password");
  res.json({ player });
});

module.exports = router;
