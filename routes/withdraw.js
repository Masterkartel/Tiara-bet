
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Player = require("../models/Player");
const Transaction = require("../models/Transaction");
const { MIN_WITHDRAWAL } = require("../config/constants");

router.post("/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ error: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}.` });
    }

    const player = await Player.findById(req.playerId);
    if (!player) return res.status(404).json({ error: "Player not found." });
    if (player.balance < amount) return res.status(400).json({ error: "Insufficient balance." });

    player.balance -= amount;
    await player.save();

    const withdrawal = await Transaction.create({
      player_id: player._id,
      amount,
      type: "WITHDRAWAL",
      status: "PENDING",
      phone: player.phone,
    });

    res.json({
      success: true,
      withdrawalId: withdrawal._id,
      balance: player.balance,
      message: "Withdrawal submitted. Awaiting approval.",
    });
  } catch (err) {
    console.error("withdraw error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
