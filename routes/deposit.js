
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Player = require("../models/Player");
const mpesa = require("../services/MpesaService");

router.post("/deposit", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Enter a valid amount." });
    }

    const player = await Player.findById(req.playerId);
    if (!player) return res.status(404).json({ error: "Player not found." });

    const result = await mpesa.stkPush({
      phone: player.phone,
      amount,
      accountReference: `DEP-${player._id.toString().slice(-6)}`,
      description: "Crash Game Deposit",
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("deposit error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.errorMessage || "STK Push failed." });
  }
});

module.exports = router;
