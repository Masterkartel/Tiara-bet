const API = "/api";

document.querySelectorAll(".tab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".form").forEach((f) => f.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab + "Form").classList.add("active");
  };
});

document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  const phone = document.getElementById("loginPhone").value;
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("loginError");
  err.textContent = "";
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("token", data.token);
    localStorage.setItem("player", JSON.stringify(data.player));
    window.location.href = "/game.html";
  } catch (e) {
    err.textContent = e.message;
  }
};

document.getElementById("registerForm").onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value;
  const phone    = document.getElementById("regPhone").value;
  const password = document.getElementById("regPassword").value;
  const err = document.getElementById("regError");
  err.textContent = "";
  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("token", data.token);
    localStorage.setItem("player", JSON.stringify(data.player));
    window.location.href = "/game.html";
  } catch (e) {
    err.textContent = e.message;
  }
};
