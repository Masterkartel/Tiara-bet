
const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const Transaction = require("../models/Transaction");

router.post("/mpesa/callback", async (req, res) => {
  try {
    const callbackData = req.body?.Body?.stkCallback;
    if (!callbackData) return res.json({ ResultCode: 0, ResultDesc: "Accepted" });

    console.log("M-Pesa callback:", JSON.stringify(callbackData, null, 2));

    if (callbackData.ResultCode === 0) {
      const items = callbackData.CallbackMetadata.Item;
      const amount  = items.find((i) => i.Name === "Amount").Value;
      const receipt = items.find((i) => i.Name === "MpesaReceiptNumber").Value;
      const phone   = String(items.find((i) => i.Name === "PhoneNumber").Value);

      const player = await Player.findOne({ phone });
      if (player) {
        player.balance += Number(amount);
        await player.save();

        await Transaction.create({
          player_id: player._id,
          amount: Number(amount),
          type: "DEPOSIT",
          status: "COMPLETED",
          mpesa_receipt: receipt,
          phone,
        });

        console.log(`Credited KES ${amount} to ${player.username}`);
      } else {
        console.warn(`No player found for phone ${phone}`);
      }
    }
  } catch (err) {
    console.error("callback error:", err);
  }
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

module.exports = router;
