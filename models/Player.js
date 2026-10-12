
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    phone:    { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    balance:  { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", playerSchema);
