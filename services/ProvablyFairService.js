
const crypto = require("crypto");

function generateSeedAndHash() {
  const seed = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  return { seed, hash };
}

function generateCrashPoint(seed, maxMultiplier) {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16);
  const point = (num % (maxMultiplier * 100)) / 100 + 1;
  return Math.max(1.0, point);
}

module.exports = { generateSeedAndHash, generateCrashPoint };
