
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const Transaction = require("../models/Transaction");
const Player = require("../models/Player");

router.get("/admin/withdrawals/pending", adminAuth, async (req, res) => {
  const pending = await Transaction.find({ type: "WITHDRAWAL", status: "PENDING" })
    .populate("player_id", "username phone")
    .sort({ timestamp: 1 });
  res.json(pending);
});

router.post("/admin/withdrawals/:id/complete", adminAuth, async (req, res) => {
  const w = await Transaction.findById(req.params.id);
  if (!w || w.status !== "PENDING") return res.status(404).json({ error: "Not found." });
  w.status = "COMPLETED";
  await w.save();
  res.json({ success: true });
});

router.post("/admin/withdrawals/:id/reject", adminAuth, async (req, res) => {
  const w = await Transaction.findById(req.params.id);
  if (!w || w.status !== "PENDING") return res.status(404).json({ error: "Not found." });

  const player = await Player.findById(w.player_id);
  if (player) {
    player.balance += w.amount;
    await player.save();
  }
  w.status = "FAILED";
  await w.save();
  res.json({ success: true });
});

module.exports = router;
