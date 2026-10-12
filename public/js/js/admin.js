const adminKeyInput = document.getElementById("adminKey");
const tbody = document.querySelector("#withdrawTable tbody");
const msg = document.getElementById("adminMsg");

document.getElementById("loadBtn").onclick = loadPending;

async function loadPending() {
  const key = adminKeyInput.value;
  tbody.innerHTML = "";
  msg.textContent = "";
  try {
    const res = await fetch("/api/admin/withdrawals/pending", {
      headers: { "x-admin-key": key },
    });
    if (!res.ok) throw new Error("Unauthorized or failed.");
    const rows = await res.json();

    if (rows.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5'>No pending withdrawals.</td></tr>";
      return;
    }

    rows.forEach((w) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${w.player_id?.username || "-"}</td>
        <td>${w.phone || w.player_id?.phone || "-"}</td>
        <td>KES ${w.amount.toFixed(2)}</td>
        <td>${new Date(w.timestamp).toLocaleString()}</td>
        <td>
          <button class="approve" data-id="${w._id}" data-action="complete">Complete</button>
          <button class="reject" data-id="${w._id}" data-action="reject">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button").forEach((b) => {
      b.onclick = async () => {
        const id = b.dataset.id;
        const action = b.dataset.action;
        await fetch(`/api/admin/withdrawals/${id}/${action}`, {
          method: "POST",
          headers: { "x-admin-key": key },
        });
        loadPending();
      };
    });
  } catch (e) {
    msg.textContent = e.message;
  }
}
