const token = localStorage.getItem("token");
if (!token) window.location.href = "/index.html";
const player = JSON.parse(localStorage.getItem("player") || "{}");

const balanceEl = document.getElementById("balance");
balanceEl.textContent = (player.balance || 0).toFixed(2);

document.getElementById("logoutBtn").onclick = () => {
  localStorage.clear();
  window.location.href = "/index.html";
};

async function refreshBalance() {
  const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
  if (res.ok) {
    const { player } = await res.json();
    balanceEl.textContent = player.balance.toFixed(2);
    localStorage.setItem("player", JSON.stringify(player));
  }
}
refreshBalance();

document.getElementById("depositBtn").onclick = async () => {
  const amount = Number(document.getElementById("depositAmount").value);
  const msg = document.getElementById("depositMsg");
  msg.classList.remove("success");
  msg.textContent = "Sending STK Push...";
  try {
    const res = await fetch("/api/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    msg.classList.add("success");
    msg.textContent = "STK Push sent. Enter your PIN on your phone.";
    setTimeout(refreshBalance, 8000);
    setTimeout(refreshBalance, 15000);
  } catch (e) {
    msg.classList.remove("success");
    msg.textContent = e.message;
  }
};

document.getElementById("withdrawBtn").onclick = async () => {
  const amount = Number(document.getElementById("withdrawAmount").value);
  const msg = document.getElementById("withdrawMsg");
  msg.classList.remove("success");
  msg.textContent = "Submitting...";
  try {
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    msg.classList.add("success");
    msg.textContent = data.message;
    balanceEl.textContent = data.balance.toFixed(2);
  } catch (e) {
    msg.classList.remove("success");
    msg.textContent = e.message;
  }
};
