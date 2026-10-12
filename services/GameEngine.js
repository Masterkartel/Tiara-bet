
const GameRound   = require("../models/GameRound");
const Player      = require("../models/Player");
const Transaction = require("../models/Transaction");
const { generateSeedAndHash, generateCrashPoint } = require("./ProvablyFairService");
const {
  ROUND_INTERVAL_MS,
  GROWTH_FACTOR,
  MAX_CRASH_MULTIPLIER,
  MIN_BET,
} = require("../config/constants");

class GameEngine {
  constructor(io) {
    this.io = io;
    this.bets = {};
    this.crashPoint = 0;
    this.multiplier = 1;
    this.running = false;
    this.currentRound = null;
    this.tickInterval = null;
    this.countdownInterval = null;
  }

  start() {
    this.startCountdown();
  }

  startCountdown() {
    let seconds = ROUND_INTERVAL_MS / 1000;
    this.io.emit("countdown", { seconds });
    this.countdownInterval = setInterval(() => {
      seconds -= 1;
      this.io.emit("countdown", { seconds });
      if (seconds <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.runGameLoop();
      }
    }, 1000);
  }

  async runGameLoop() {
    this.running = true;
    this.multiplier = 1;
    this.bets = {};

    const { seed, hash } = generateSeedAndHash();
    this.crashPoint = generateCrashPoint(seed, MAX_CRASH_MULTIPLIER);

    this.currentRound = new GameRound({
      round_id: Date.now().toString(),
      seed,
      hash,
      crash_point: this.crashPoint,
      player_bets: [],
    });
    await this.currentRound.save();

    this.io.emit("round_start", {
      roundId: this.currentRound.round_id,
      hash,
    });

    const startTime = Date.now();
    this.tickInterval = setInterval(async () => {
      const elapsed = (Date.now() - startTime) / 1000;
      this.multiplier = 1 + elapsed * GROWTH_FACTOR;
      this.io.emit("multiplier_update", { multiplier: this.multiplier.toFixed(2) });

      if (this.multiplier >= this.crashPoint) {
        clearInterval(this.tickInterval);
        this.tickInterval = null;
        this.io.emit("round_end", { crashPoint: this.crashPoint.toFixed(2) });
        await this.currentRound.save();
        this.running = false;
        setTimeout(() => this.startCountdown(), 2000);
      }
    }, 100);
  }

  async placeBet(socket, { playerId, amount }) {
    try {
      if (this.running) {
        return socket.emit("bet_error", { message: "Round already in progress. Wait for the next one." });
      }
      if (!amount || amount < MIN_BET) {
        return socket.emit("bet_error", { message: `Minimum bet is KES ${MIN_BET}.` });
      }

      const player = await Player.findById(playerId);
      if (!player) return socket.emit("bet_error", { message: "Player not found." });
      if (player.balance < amount) return socket.emit("bet_error", { message: "Insufficient balance." });

      player.balance -= amount;
      await player.save();

      this.bets[playerId] = { amount, cashoutMultiplier: null };

      if (!this.currentRound) {
        this.currentRound = new GameRound({
          round_id: Date.now().toString(),
          player_bets: [],
        });
      }
      this.currentRound.player_bets.push({
        player_id: player._id,
        amount,
        multiplier: 1,
        cashed_out: false,
      });
      await this.currentRound.save();

      await Transaction.create({
        player_id: player._id,
        amount,
        type: "BET",
        status: "COMPLETED",
      });

      socket.emit("bet_placed", { amount, balance: player.balance });
    } catch (err) {
      console.error("placeBet error:", err);
      socket.emit("bet_error", { message: "Could not place bet." });
    }
  }

  async cashOut(socket, { playerId }) {
    try {
      const bet = this.bets[playerId];
      if (!bet) return socket.emit("bet_error", { message: "No active bet." });
      if (bet.cashoutMultiplier !== null) return socket.emit("bet_error", { message: "Already cashed out." });
      if (!this.running) return socket.emit("bet_error", { message: "Round not running." });
      if (this.multiplier >= this.crashPoint) return socket.emit("bet_error", { message: "Too late." });

      const player = await Player.findById(playerId);
      const cashoutMultiplier = this.multiplier;
      const payout = bet.amount * cashoutMultiplier;

      player.balance += payout;
      await player.save();

      bet.cashoutMultiplier = cashoutMultiplier;

      const betInRound = this.currentRound.player_bets.find(
        (b) => b.player_id.toString() === playerId.toString()
      );
      if (betInRound) {
        betInRound.cashed_out = true;
        betInRound.multiplier = cashoutMultiplier;
        await this.currentRound.save();
      }

      await Transaction.create({
        player_id: player._id,
        amount: payout,
        type: "CASHOUT",
        status: "COMPLETED",
        multiplier: cashoutMultiplier,
      });

      socket.emit("cashed_out", {
        payout: payout.toFixed(2),
        multiplier: cashoutMultiplier.toFixed(2),
        balance: player.balance,
      });
    } catch (err) {
      console.error("cashOut error:", err);
      socket.emit("bet_error", { message: "Could not cash out." });
    }
  }
}

module.exports = GameEngine;
