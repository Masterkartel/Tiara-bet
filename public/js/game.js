const token = localStorage.getItem("token");
if (!token) window.location.href = "/index.html";

const player = JSON.parse(localStorage.getItem("player") || "{}");
document.getElementById("userName").textContent = player.username || "";
document.getElementById("balance").textContent = (player.balance || 0).toFixed(2);

document.getElementById("logoutBtn").onclick = () => {
  localStorage.clear();
  window.location.href = "/index.html";
};

document.querySelectorAll(".quick-bets button").forEach((b) => {
  b.onclick = () => (document.getElementById("betAmount").value = b.dataset.amt);
});

const socket = io();

const multEl      = document.getElementById("multiplier");
const statusEl    = document.getElementById("status");
const countEl     = document.getElementById("countdown");
const betBtn      = document.getElementById("betBtn");
const cashBtn     = document.getElementById("cashBtn");
const betMsg      = document.getElementById("betMsg");
const balanceEl   = document.getElementById("balance");

let canBet = false;
let hasActiveBet = false;

function setBalance(v) {
  balanceEl.textContent = Number(v).toFixed(2);
  player.balance = v;
  localStorage.setItem("player", JSON.stringify(player));
}

socket.on("countdown", ({ seconds }) => {
  canBet = true;
  countEl.textContent = `Next round in ${seconds}s`;
  statusEl.textContent = "Place your bet!";
  multEl.textContent = "1.00x";
  multEl.classList.remove("crashed");
  betBtn.disabled = false;
  cashBtn.disabled = true;
  betMsg.textContent = "";
});

socket.on("round_start", () => {
  canBet = false;
  countEl.textContent = "";
  statusEl.textContent = "Round running...";
  betBtn.disabled = true;
});

socket.on("multiplier_update", ({ multiplier }) => {
  multEl.textContent = `${multiplier}x`;
});

socket.on("round_end", ({ crashPoint }) => {
  multEl.textContent = `${crashPoint}x`;
  multEl.classList.add("crashed");
  statusEl.textContent = "Crashed!";
  cashBtn.disabled = true;
  betBtn.disabled = true;
  hasActiveBet = false;
});

socket.on("bet_placed", ({ amount, balance }) => {
  hasActiveBet = true;
  setBalance(balance);
  betMsg.textContent = `Bet placed: KES ${amount}`;
  betMsg.classList.add("success");
  cashBtn.disabled = false;
});

socket.on("cashed_out", ({ payout, multiplier, balance }) => {
  hasActiveBet = false;
  setBalance(balance);
  betMsg.textContent = `Cashed out at ${multiplier}x — KES ${payout}`;
  cashBtn.disabled = true;
});

socket.on("bet_error", ({ message }) => {
  betMsg.textContent = message;
  betMsg.classList.remove("success");
});

betBtn.onclick = () => {
  const amount = Number(document.getElementById("betAmount").value);
  betMsg.textContent = "";
  socket.emit("place_bet", { playerId: player.id, amount });
};

cashBtn.onclick = () => {
  socket.emit("cash_out", { playerId: player.id });
};
