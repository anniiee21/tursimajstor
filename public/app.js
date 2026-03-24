function showStatus(element, message, type = "success") {
  if (!element) return;
  element.className = "status-box " + (type === "success" ? "status-success" : "status-error");
  element.textContent = message;
}

function clearStatus(element) {
  if (!element) return;
  element.className = "status-box";
  element.textContent = "";
}

function roleLabel(role) {
  if (role === "client") return "Клиент";
  if (role === "worker") return "Изпълнител";
  return role;
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

function logout() {
  localStorage.removeItem("currentUser");
  updateHeaderUser();
  location.reload();
}

function updateHeaderUser() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userInfo = document.getElementById("userInfo");
  const loginFormBox = document.getElementById("loginFormBox");
  const registerFormBox = document.getElementById("registerFormBox");
  const loginTabBtn = document.getElementById("loginTabBtn");
  const registerTabBtn = document.getElementById("registerTabBtn");

  const user = getCurrentUser();

  if (!userMenuBtn) return;

  if (!user) {
    userMenuBtn.textContent = "Вход";

    if (userInfo) userInfo.innerHTML = "";

    if (loginFormBox) loginFormBox.classList.remove("hidden");
    if (registerFormBox) registerFormBox.classList.add("hidden");

    if (loginTabBtn) loginTabBtn.classList.add("active");
    if (registerTabBtn) registerTabBtn.classList.remove("active");

    return;
  }

  userMenuBtn.textContent = user.name;

  if (userInfo) {
    userInfo.innerHTML = `
      <div><strong>${user.name}</strong></div>
      <div>${user.email}</div>
      <div class="role-badge">${roleLabel(user.role)}</div>
      <hr>
    `;
  }

  if (loginFormBox) loginFormBox.classList.add("hidden");
  if (registerFormBox) registerFormBox.classList.add("hidden");

  if (loginTabBtn) loginTabBtn.classList.remove("active");
  if (registerTabBtn) registerTabBtn.classList.remove("active");
}

async function login() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Грешка при вход.");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(data.user));
  updateHeaderUser();

  const userDropdown = document.getElementById("userDropdown");
  if (userDropdown) userDropdown.classList.add("hidden");

  location.reload();
}

async function register() {
  const name = document.getElementById("regName")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value.trim();
  const role = document.getElementById("regRole")?.value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Грешка при регистрация.");
    return;
  }

  alert("Регистрацията е успешна ✅");
}

document.addEventListener("DOMContentLoaded", () => {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  const loginTabBtn = document.getElementById("loginTabBtn");
  const registerTabBtn = document.getElementById("registerTabBtn");

  const loginFormBox = document.getElementById("loginFormBox");
  const registerFormBox = document.getElementById("registerFormBox");

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!userDropdown.contains(e.target) && e.target !== userMenuBtn) {
        userDropdown.classList.add("hidden");
      }
    });
  }

  if (loginTabBtn && registerTabBtn && loginFormBox && registerFormBox) {
    loginTabBtn.addEventListener("click", () => {
      loginTabBtn.classList.add("active");
      registerTabBtn.classList.remove("active");

      loginFormBox.classList.remove("hidden");
      registerFormBox.classList.add("hidden");
    });

    registerTabBtn.addEventListener("click", () => {
      registerTabBtn.classList.add("active");
      loginTabBtn.classList.remove("active");

      registerFormBox.classList.remove("hidden");
      loginFormBox.classList.add("hidden");
    });
  }

  updateHeaderUser();
});

function updateRoleVisibility() {
  const currentUser = getCurrentUser();
  const applicationsNavLink = document.getElementById("applicationsNavLink");

  if (applicationsNavLink) {
    if (!currentUser || currentUser.role !== "client") {
      applicationsNavLink.classList.add("hidden");
    } else {
      applicationsNavLink.classList.remove("hidden");
    }
  }
}

updateRoleVisibility();