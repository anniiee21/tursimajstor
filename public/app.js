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
  if (role === "professional") return "Професионален профил";
  if (role === "company") return "Фирма";
  if (role === "admin") return "Админ";
  if (role === "client") return "Личен профил";
  if (role === "worker") return "Свободна практика";
  return role || "Потребител";
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function isAdminEmail(email = "") {
  return normalizeEmail(email) === "admin@tursimajstor.bg";
}

function isAdminUser(user) {
  return !!user && (user.role === "admin" || isAdminEmail(user.email));
}

function canOpenPublicProfile(email = "") {
  return !isAdminEmail(email);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    console.error("CURRENT USER PARSE ERROR:", error);
    return null;
  }
}

function setCurrentUser(user) {
  if (!user) return;
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  }
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem("siteTheme") || "light";
  applyTheme(savedTheme);

  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;

  btn.onclick = () => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    localStorage.setItem("siteTheme", nextTheme);
    applyTheme(nextTheme);
  };
}

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("lastNotificationCount");
  location.href = "/";
}

function createEmptyStateHTML({
  icon = "📭",
  title = "Няма съдържание",
  text = "",
  buttonText = "",
  buttonHref = "#"
} = {}) {
  return `
    <div class="empty-state-box">
      <div class="empty-state-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${buttonText ? `<a href="${buttonHref}" class="job-card-btn">${buttonText}</a>` : ""}
    </div>
  `;
}

function showSkeletons(container, count = 3) {
  if (!container) return;

  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="job-market-card" style="opacity:0.72;">
      <div style="height:18px;background:var(--border);border-radius:8px;width:42%;margin-bottom:12px;"></div>
      <div style="height:14px;background:var(--border);border-radius:8px;width:78%;margin-bottom:8px;"></div>
      <div style="height:14px;background:var(--border);border-radius:8px;width:64%;margin-bottom:16px;"></div>
      <div style="height:140px;background:var(--border);border-radius:14px;margin-bottom:16px;"></div>
      <div style="height:14px;background:var(--border);border-radius:8px;width:100%;margin-bottom:8px;"></div>
      <div style="height:14px;background:var(--border);border-radius:8px;width:88%;margin-bottom:8px;"></div>
      <div style="height:14px;background:var(--border);border-radius:8px;width:70%;"></div>
    </div>
  `).join("");
}

function renderAuthDropdown() {
  const currentUser = getCurrentUser();

  if (currentUser) {
    const isAdmin = isAdminUser(currentUser);

    return `
      <div id="userInfo"></div>

      <div id="dropdownNotificationPreview" class="dropdown-message-preview hidden">
        <div class="dropdown-preview-head">
          <strong>Нови известия</strong>
        </div>
        <div id="dropdownPreviewList"></div>
        <a href="/notifications-page" class="dropdown-preview-link">Виж всички известия</a>
      </div>

      <div class="header-user-actions">
        ${!isAdmin ? `<a href="/profile/${encodeURIComponent(currentUser.email)}" class="header-action-link">Моят профил</a>` : ""}
        ${isAdmin ? `<a href="/admin-page" class="header-action-link">🛡 Админ панел</a>` : ""}
        <a href="/my-jobs-page" class="header-action-link">Моите обяви</a>
        <a href="/favorites-page" class="header-action-link">Любими</a>
        <a href="/inbox-page" class="header-action-link">Поща</a>
        <a href="/notifications-page" class="header-action-link inbox-link-wrapper">
          Известия
          <span id="dropdownNotificationBadge" class="inbox-badge hidden">0</span>
        </a>
        <a href="/my-notes-page" class="header-action-link">Моите бележки</a>
        ${!isAdmin ? `<button type="button" id="headerEditProfileBtn" class="header-action-btn">Редактирай профил</button>` : ""}
        <button type="button" onclick="logout()" class="danger-btn">Изход</button>
      </div>
    `;
  }

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
        <option value="professional">Професионален профил</option>
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

  if (role === "freelancer" || role === "professional") {
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

function bindHeaderEditProfileButton() {
  const btn = document.getElementById("headerEditProfileBtn");
  const currentUser = getCurrentUser();

  if (btn && currentUser?.email && !isAdminUser(currentUser)) {
    btn.onclick = () => {
      window.location.href = `/profile/${encodeURIComponent(currentUser.email)}?edit=1`;
    };
  }
}

function ensureToastContainer() {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  return container;
}

function showToast(message, type = "info") {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `app-toast app-toast-${type}`;
  toast.innerHTML = `
    <div class="app-toast-title">${type === "success" ? "Ново известие" : "Информация"}</div>
    <div class="app-toast-text">${message}</div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function renderNotificationPreviewItem(item) {
  return `
    <a href="${item.link || "/notifications-page"}" class="dropdown-preview-item">
      <div class="dropdown-preview-title">${item.title || "Известие"}</div>
      <div class="dropdown-preview-meta">${item.text || ""}</div>
      <div class="dropdown-preview-date">${item.createdAt || ""}</div>
    </a>
  `;
}

function setNotificationCountInStorage(count) {
  localStorage.setItem("lastNotificationCount", String(count));
}

function getNotificationCountFromStorage() {
  return Number(localStorage.getItem("lastNotificationCount") || "0");
}

async function updateNotificationBadge({ silent = false } = {}) {
  const currentUser = getCurrentUser();
  if (!currentUser?.email) return;

  try {
    const [countRes, latestRes] = await Promise.all([
      fetch(`/notifications/unread-count/${encodeURIComponent(currentUser.email)}`),
      fetch(`/notifications/latest/${encodeURIComponent(currentUser.email)}?limit=3`)
    ]);

    const countData = await countRes.json();
    const latestData = await latestRes.json();

    const unreadCount = Number(countData.unreadCount || 0);
    const previousCount = getNotificationCountFromStorage();

    const dropdownBadge = document.getElementById("dropdownNotificationBadge");
    if (dropdownBadge) {
      if (unreadCount > 0) {
        dropdownBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        dropdownBadge.classList.remove("hidden");
      } else {
        dropdownBadge.textContent = "0";
        dropdownBadge.classList.add("hidden");
      }
    }

    const notificationLinks = document.querySelectorAll('#navLinks a[href="/notifications-page"]');
    notificationLinks.forEach(link => {
      const oldBadge = link.querySelector(".nav-inbox-badge");
      if (oldBadge) oldBadge.remove();

      if (unreadCount > 0) {
        const badge = document.createElement("span");
        badge.className = "nav-inbox-badge";
        badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        link.appendChild(badge);
      }
    });

    const previewWrap = document.getElementById("dropdownNotificationPreview");
    const previewList = document.getElementById("dropdownPreviewList");

    if (previewWrap && previewList) {
      if (latestData && latestData.length) {
        previewWrap.classList.remove("hidden");
        previewList.innerHTML = latestData.map(renderNotificationPreviewItem).join("");
      } else {
        previewWrap.classList.add("hidden");
        previewList.innerHTML = "";
      }
    }

    if (!silent && unreadCount > previousCount) {
      const diff = unreadCount - previousCount;
      showToast(diff === 1 ? "Имаш 1 ново известие." : `Имаш ${diff} нови известия.`, "success");
    }

    setNotificationCountInStorage(unreadCount);
  } catch (error) {
    console.error("NOTIFICATION BADGE ERROR:", error);
  }
}

let notificationsPollingStarted = false;

function startNotificationsPolling() {
  const currentUser = getCurrentUser();
  if (!currentUser?.email || notificationsPollingStarted) return;

  notificationsPollingStarted = true;

  setTimeout(() => {
    updateNotificationBadge({ silent: true });
  }, 1000);

  setInterval(() => {
    updateNotificationBadge({ silent: false });
  }, 10000);
}

function updateHeaderUser() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (!userMenuBtn || !userDropdown) return;

  userDropdown.innerHTML = renderAuthDropdown();

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
    bindRegisterRoleChange();
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

  bindHeaderEditProfileButton();
  updateNotificationBadge({ silent: true });
  startNotificationsPolling();
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

  setCurrentUser(data.user);
  localStorage.removeItem("lastNotificationCount");

  if (isAdminUser(data.user)) {
    location.href = "/admin-page";
    return;
  }

  location.reload();
}

async function register() {
  try {
    const name = document.getElementById("regName")?.value.trim() || "";
    const email = document.getElementById("regEmail")?.value.trim() || "";
    const password = document.getElementById("regPassword")?.value.trim() || "";
    const role = document.getElementById("regRole")?.value || "personal";
    const description = document.getElementById("regDescription")?.value.trim() || "";
    const phone = document.getElementById("regPhone")?.value.trim() || "";
    const showPhone = document.getElementById("regShowPhone")?.checked || false;
    const profileImageInput = document.getElementById("regProfileImage");
    const profileImage = profileImageInput?.files?.[0] || null;

    const contactName = document.getElementById("regContactName")?.value.trim() || "";
    const companyId = document.getElementById("regCompanyId")?.value.trim() || "";
    const manager = document.getElementById("regManager")?.value.trim() || "";
    const profession = document.getElementById("regProfession")?.value.trim() || "";

    if (!name || !email || !password) {
      alert("Попълни име, имейл и парола.");
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
    location.reload();
  } catch (error) {
    console.error(error);
    alert("Стана грешка.");
  }
}

function updateRoleVisibility() {
  const currentUser = getCurrentUser();
  const applicationsNavLink = document.getElementById("applicationsNavLink");

  if (applicationsNavLink) {
    if (!currentUser || isAdminUser(currentUser)) {
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

function bindUserMenu() {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

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
}

function bindMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }
}

function initAppShell() {
  initThemeToggle();
  bindMobileMenu();
  bindUserMenu();
  updateHeaderUser();
  bindAuthTabs();
  bindRegisterRoleChange();
  updateRoleVisibility();
}

window.showStatus = showStatus;
window.clearStatus = clearStatus;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.updateHeaderUser = updateHeaderUser;
window.updateRoleVisibility = updateRoleVisibility;
window.showToast = showToast;
window.login = login;
window.register = register;
window.logout = logout;
window.initAppShell = initAppShell;
window.createEmptyStateHTML = createEmptyStateHTML;
window.showSkeletons = showSkeletons;
window.canOpenPublicProfile = canOpenPublicProfile;
window.isAdminUser = isAdminUser;
window.isAdminEmail = isAdminEmail;
window.normalizeEmail = normalizeEmail;
window.updateNotificationBadge = updateNotificationBadge;

document.addEventListener("DOMContentLoaded", () => {
  initAppShell();
});