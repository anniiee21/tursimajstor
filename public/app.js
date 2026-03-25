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
  if (role === "personal") return "Личен профил";
  if (role === "freelancer") return "Свободна практика";
  if (role === "company") return "Фирма";
  if (role === "client") return "Личен профил";
  if (role === "worker") return "Свободна практика";
  return role || "Потребител";
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

function renderAuthDropdown() {
  return `
    <div id="userInfo"></div>

    <div class="auth-tabs">
      <button id="loginTabBtn" class="auth-tab active" type="button">Вход</button>
      <button id="registerTabBtn" class="auth-tab" type="button">Регистрация</button>
    </div>

    <div id="loginFormBox" class="auth-box">
      <input id="loginEmail" placeholder="Имейл">
      <input id="loginPassword" type="password" placeholder="Парола">
      <button type="button" onclick="login()">Влез</button>
    </div>

    <div id="registerFormBox" class="auth-box hidden">
      <label for="regRole">Тип профил</label>
      <select id="regRole">
        <option value="personal">Личен профил</option>
        <option value="freelancer">Свободна практика</option>
        <option value="company">Фирма</option>
      </select>

      <div id="registerDynamicFields"></div>

      <input id="regEmail" placeholder="Имейл за връзка">
      <input id="regPassword" type="password" placeholder="Парола">

      <label for="regPhone">Телефон за връзка</label>
      <input id="regPhone" placeholder="Телефон за връзка">

      <label class="small-checkbox">
        <input type="checkbox" id="regShowPhone">
        Покажи телефона в профила
      </label>

      <label for="regProfileImage">Снимка / Лого</label>
      <input type="file" id="regProfileImage" accept="image/*">

      <button type="button" onclick="register()">Регистрация</button>
    </div>

    <button type="button" onclick="logout()" class="danger-btn">Изход</button>
  `;
}

function renderRegisterFields(role = "personal") {
  const box = document.getElementById("registerDynamicFields");
  if (!box) return;

  if (role === "company") {
    box.innerHTML = `
      <label for="regName">Име на фирма</label>
      <input id="regName" placeholder="Име на фирма">

      <label for="regContactName">Лице за контакт (по желание)</label>
      <input id="regContactName" placeholder="Име на контактно лице">

      <label for="regCompanyId">ЕИК (по желание)</label>
      <input id="regCompanyId" placeholder="ЕИК">

      <label for="regManager">Представител / МОЛ (по желание)</label>
      <input id="regManager" placeholder="Представител / МОЛ">

      <label for="regDescription">Описание на фирмата</label>
      <textarea id="regDescription" placeholder="Представи дейността, услугите и опита на фирмата"></textarea>
    `;
    return;
  }

  if (role === "freelancer") {
    box.innerHTML = `
      <label for="regName">Име и фамилия</label>
      <input id="regName" placeholder="Име и фамилия">

      <label for="regProfession">Професия / Специалност</label>
      <input id="regProfession" placeholder="Пример: Уеб дизайнер, счетоводител, преводач">

      <label for="regDescription">Описание</label>
      <textarea id="regDescription" placeholder="Представи се, опита си и какво предлагаш"></textarea>
    `;
    return;
  }

  box.innerHTML = `
    <label for="regName">Име и фамилия</label>
    <input id="regName" placeholder="Име и фамилия">

    <label for="regDescription">Кратко представяне (по желание)</label>
    <textarea id="regDescription" placeholder="Няколко думи за теб"></textarea>
  `;
}

function bindRegisterRoleChange() {
  const regRole = document.getElementById("regRole");
  if (!regRole) return;

  renderRegisterFields(regRole.value || "personal");
  regRole.onchange = () => renderRegisterFields(regRole.value || "personal");
}

function updateHeaderUser() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (!userMenuBtn || !userDropdown) return;

  if (!userDropdown.innerHTML.trim()) {
    userDropdown.innerHTML = renderAuthDropdown();
  }

  bindRegisterRoleChange();

  const userInfo = document.getElementById("userInfo");
  const loginFormBox = document.getElementById("loginFormBox");
  const registerFormBox = document.getElementById("registerFormBox");
  const loginTabBtn = document.getElementById("loginTabBtn");
  const registerTabBtn = document.getElementById("registerTabBtn");

  const user = getCurrentUser();

  if (!user) {
    userMenuBtn.textContent = "Вход";

    if (userInfo) userInfo.innerHTML = "";
    if (loginFormBox) loginFormBox.classList.remove("hidden");
    if (registerFormBox) registerFormBox.classList.add("hidden");
    if (loginTabBtn) loginTabBtn.classList.add("active");
    if (registerTabBtn) registerTabBtn.classList.remove("active");

    bindAuthTabs();
    return;
  }

  userMenuBtn.textContent = user.name || "Профил";

  if (userInfo) {
    userInfo.innerHTML = `
      ${user.profileImage ? `<img src="${user.profileImage}" alt="Профил" class="mini-profile-image">` : ""}
      <div><strong>${user.name || "Потребител"}</strong></div>
      <div>${user.email || ""}</div>
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
  try {
    const role = document.getElementById("regRole")?.value || "personal";
    const name = document.getElementById("regName")?.value.trim() || "";
    const email = document.getElementById("regEmail")?.value.trim() || "";
    const password = document.getElementById("regPassword")?.value.trim() || "";
    const description = document.getElementById("regDescription")?.value.trim() || "";
    const phone = document.getElementById("regPhone")?.value.trim() || "";
    const showPhone = document.getElementById("regShowPhone")?.checked || false;
    const profileImageInput = document.getElementById("regProfileImage");
    const profileImage = profileImageInput && profileImageInput.files ? profileImageInput.files[0] : null;

    const contactName = document.getElementById("regContactName")?.value.trim() || "";
    const companyId = document.getElementById("regCompanyId")?.value.trim() || "";
    const manager = document.getElementById("regManager")?.value.trim() || "";
    const profession = document.getElementById("regProfession")?.value.trim() || "";

    if (!name || !email || !password || !role) {
      alert("Попълни име, имейл, парола и тип профил.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);
    formData.append("description", description);
    formData.append("phone", phone);
    formData.append("showPhone", showPhone);
    formData.append("contactName", contactName);
    formData.append("companyId", companyId);
    formData.append("manager", manager);
    formData.append("profession", profession);

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    const res = await fetch("/register", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Грешка при регистрация.");
      return;
    }

    alert("Регистрацията е успешна ✅");
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    alert("Стана грешка при регистрацията.");
  }
}

function updateRoleVisibility() {
  const currentUser = getCurrentUser();
  const applicationsNavLink = document.getElementById("applicationsNavLink");

  if (applicationsNavLink) {
    if (!currentUser) {
      applicationsNavLink.classList.add("hidden");
    } else {
      applicationsNavLink.classList.remove("hidden");
    }
  }
}

function bindAuthTabs() {
  const loginTabBtn = document.getElementById("loginTabBtn");
  const registerTabBtn = document.getElementById("registerTabBtn");
  const loginFormBox = document.getElementById("loginFormBox");
  const registerFormBox = document.getElementById("registerFormBox");

  if (loginTabBtn && registerTabBtn && loginFormBox && registerFormBox) {
    loginTabBtn.onclick = () => {
      loginTabBtn.classList.add("active");
      registerTabBtn.classList.remove("active");
      loginFormBox.classList.remove("hidden");
      registerFormBox.classList.add("hidden");
    };

    registerTabBtn.onclick = () => {
      registerTabBtn.classList.add("active");
      loginTabBtn.classList.remove("active");
      registerFormBox.classList.remove("hidden");
      loginFormBox.classList.add("hidden");
      bindRegisterRoleChange();
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

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

  updateHeaderUser();
  bindAuthTabs();
  bindRegisterRoleChange();
  updateRoleVisibility();
});