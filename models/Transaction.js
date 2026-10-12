
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  player_id:     { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ["DEPOSIT", "BET", "CASHOUT", "WITHDRAWAL"], required: true },
  status:        { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "COMPLETED" },
  mpesa_receipt: { type: String },
  phone:         { type: String },
  multiplier:    { type: Number },
  timestamp:     { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
