
const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  player_id:  { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  amount:     { type: Number },
  multiplier: { type: Number, default: 1 },
  cashed_out: { type: Boolean, default: false },
});

const roundSchema = new mongoose.Schema({
  round_id:    { type: String, required: true, unique: true },
  seed:        { type: String },
  hash:        { type: String },
  crash_point: { type: Number },
  player_bets: [betSchema],
  created_at:  { type: Date, default: Date.now },
});

module.exports = mongoose.model("GameRound", roundSchema);
