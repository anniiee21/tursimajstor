(function () {
  const APP = {
    notificationInterval: null,
    notificationsPollingStarted: false,
    darkModeKey: "tm_dark_mode",
    currentUserKey: "currentUser",
    lastNotificationCountKey: "lastNotificationCount"
  };

  /* =========================
     BASIC HELPERS
  ========================= */

  function $(id) {
    return document.getElementById(id);
  }

  function normalizeEmail(email = "") {
    return String(email || "").trim().toLowerCase();
  }

  function roleLabel(role) {
    if (role === "personal" || role === "client") return "Личен профил";
    if (role === "freelancer" || role === "worker") return "Свободна практика";
    if (role === "professional") return "Професионален профил";
    if (role === "company") return "Фирма";
    return role || "Потребител";
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showStatus(element, message, type = "success") {
    if (!element) return;
    element.className = "status-box " + (type === "success" ? "status-success" : "status-error");
    element.textContent = message || "";
  }

  function clearStatus(element) {
    if (!element) return;
    element.className = "status-box";
    element.textContent = "";
  }

  function safeReload() {
    window.location.reload();
  }

  /* =========================
     LOCAL STORAGE / USER
  ========================= */

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(APP.currentUserKey);
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
    localStorage.setItem(APP.currentUserKey, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(APP.currentUserKey);
    localStorage.removeItem(APP.lastNotificationCountKey);
    window.location.href = "/";
  }

  function setNotificationCountInStorage(count) {
    localStorage.setItem(APP.lastNotificationCountKey, String(Number(count || 0)));
  }

  function getNotificationCountFromStorage() {
    return Number(localStorage.getItem(APP.lastNotificationCountKey) || "0");
  }

  /* =========================
     TOASTS
  ========================= */

  function ensureToastContainer() {
    let container = $("toastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function showToast(message, type = "info", title = "") {
    const container = ensureToastContainer();
    const toast = document.createElement("div");

    let toastTitle = title;
    if (!toastTitle) {
      if (type === "success") toastTitle = "Успешно";
      else if (type === "error") toastTitle = "Грешка";
      else toastTitle = "Информация";
    }

    toast.className = `app-toast app-toast-${type}`;
    toast.innerHTML = `
      <div class="app-toast-title">${escapeHtml(toastTitle)}</div>
      <div class="app-toast-text">${escapeHtml(message || "")}</div>
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

  /* =========================
     DARK MODE
  ========================= */

  function isDarkModeEnabled() {
    return localStorage.getItem(APP.darkModeKey) === "1";
  }

  function applyDarkModeState() {
    const enabled = isDarkModeEnabled();
    document.body.classList.toggle("dark-mode", enabled);

    const btn = $("themeToggleBtn");
    if (btn) {
      btn.textContent = enabled ? "☀️" : "🌙";
      btn.setAttribute("aria-label", enabled ? "Светъл режим" : "Тъмен режим");
      btn.title = enabled ? "Светъл режим" : "Тъмен режим";
    }
  }

  function toggleDarkMode() {
    const enabled = isDarkModeEnabled();
    localStorage.setItem(APP.darkModeKey, enabled ? "0" : "1");
    applyDarkModeState();
    showToast(enabled ? "Светлият режим е включен." : "Тъмният режим е включен.", "success");
  }

  function ensureThemeToggleButton() {
    const navbar = document.querySelector(".navbar");
    const userMenu = document.querySelector(".user-menu");
    if (!navbar || !userMenu) return;

    let actionsWrap = document.querySelector(".header-actions-right");
    if (!actionsWrap) {
      actionsWrap = document.createElement("div");
      actionsWrap.className = "header-actions-right";
      navbar.insertBefore(actionsWrap, userMenu);
      actionsWrap.appendChild(userMenu);
    }

    let themeBtn = $("themeToggleBtn");
    if (!themeBtn) {
      themeBtn = document.createElement("button");
      themeBtn.id = "themeToggleBtn";
      themeBtn.className = "theme-toggle-btn";
      themeBtn.type = "button";
      themeBtn.addEventListener("click", toggleDarkMode);
      actionsWrap.insertBefore(themeBtn, userMenu);
    }

    applyDarkModeState();
  }

  /* =========================
     BREADCRUMBS
  ========================= */

  function getBreadcrumbsForPath() {
    const path = window.location.pathname;

    if (path === "/") {
      return [{ label: "Начало", href: "/" }];
    }

    const map = [
      { match: /^\/jobs-page$/, items: [{ label: "Начало", href: "/" }, { label: "Обяви" }] },
      { match: /^\/my-jobs-page$/, items: [{ label: "Начало", href: "/" }, { label: "Моите обяви" }] },
      { match: /^\/favorites-page$/, items: [{ label: "Начало", href: "/" }, { label: "Любими" }] },
      { match: /^\/inbox-page$/, items: [{ label: "Начало", href: "/" }, { label: "Поща" }] },
      { match: /^\/notifications-page$/, items: [{ label: "Начало", href: "/" }, { label: "Известия" }] },
      { match: /^\/applications-page$/, items: [{ label: "Начало", href: "/" }, { label: "Кандидатури" }] },
      { match: /^\/feed-page$/, items: [{ label: "Начало", href: "/" }, { label: "Новини" }] },
      { match: /^\/account-page$/, items: [{ label: "Начало", href: "/" }, { label: "Акаунт" }] },
      { match: /^\/profile\/.+$/, items: [{ label: "Начало", href: "/" }, { label: "Профил" }] },
      { match: /^\/job\/.+$/, items: [{ label: "Начало", href: "/" }, { label: "Обяви", href: "/jobs-page" }, { label: "Детайли" }] }
    ];

    const found = map.find(entry => entry.match.test(path));
    return found ? found.items : [{ label: "Начало", href: "/" }];
  }

  function renderBreadcrumbs() {
    if (window.location.pathname === "/") return;
    if (document.querySelector(".breadcrumbs")) return;

    const container = document.querySelector(".container");
    if (!container) return;

    const crumbs = getBreadcrumbsForPath();
    if (!crumbs.length) return;

    const nav = document.createElement("nav");
    nav.className = "breadcrumbs";
    nav.setAttribute("aria-label", "Breadcrumb");

    nav.innerHTML = crumbs
      .map((item, index) => {
        const isLast = index === crumbs.length - 1;
        const content = item.href && !isLast
          ? `<a href="${item.href}">${escapeHtml(item.label)}</a>`
          : `<span>${escapeHtml(item.label)}</span>`;

        if (index === 0) return content;
        return `<span>›</span>${content}`;
      })
      .join("");

    container.insertBefore(nav, container.firstChild);
  }

  /* =========================
     EMPTY STATES
  ========================= */

  function createEmptyStateHTML({
    icon = "📭",
    title = "Няма съдържание",
    text = "Все още няма данни.",
    buttonText = "",
    buttonHref = "",
    buttonClass = "job-card-btn"
  } = {}) {
    const buttonHtml = buttonText
      ? (buttonHref
          ? `<a href="${buttonHref}" class="${buttonClass}">${escapeHtml(buttonText)}</a>`
          : `<button type="button" class="${buttonClass}">${escapeHtml(buttonText)}</button>`)
      : "";

    return `
      <div class="empty-state-box">
        <div class="empty-state-icon">${icon}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
        ${buttonHtml}
      </div>
    `;
  }

  /* =========================
     SKELETONS
  ========================= */

  function injectSkeletonStyles() {
    if ($("tmSkeletonStyles")) return;

    const style = document.createElement("style");
    style.id = "tmSkeletonStyles";
    style.textContent = `
      .skeleton-card{
        border-radius:18px;
        border:1px solid var(--border);
        background:var(--card-solid);
        padding:18px;
        min-height:160px;
      }
      .skeleton-line,
      .skeleton-image,
      .skeleton-pill{
        position:relative;
        overflow:hidden;
        background:rgba(148,163,184,.18);
      }
      .skeleton-line::after,
      .skeleton-image::after,
      .skeleton-pill::after{
        content:"";
        position:absolute;
        inset:0;
        transform:translateX(-100%);
        background:linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
        animation:tmShimmer 1.2s infinite;
      }
      body.dark-mode .skeleton-line::after,
      body.dark-mode .skeleton-image::after,
      body.dark-mode .skeleton-pill::after{
        background:linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
      }
      .skeleton-image{
        width:100%;
        height:180px;
        border-radius:16px;
        margin-bottom:14px;
      }
      .skeleton-line{
        height:14px;
        border-radius:999px;
        margin-bottom:10px;
      }
      .skeleton-line.title{height:22px;width:68%;}
      .skeleton-line.short{width:40%;}
      .skeleton-line.medium{width:72%;}
      .skeleton-line.long{width:100%;}
      .skeleton-pill{
        width:90px;
        height:26px;
        border-radius:999px;
        margin-bottom:12px;
      }
      @keyframes tmShimmer{
        100%{transform:translateX(100%);}
      }
    `;
    document.head.appendChild(style);
  }

  function buildSkeletonCard() {
    return `
      <div class="skeleton-card">
        <div class="skeleton-pill"></div>
        <div class="skeleton-line title"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-image"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-line medium"></div>
      </div>
    `;
  }

  function showSkeletons(container, count = 3) {
    if (!container) return;
    injectSkeletonStyles();
    container.innerHTML = Array.from({ length: count }, buildSkeletonCard).join("");
  }

  /* =========================
     AUTH DROPDOWN
  ========================= */

  function renderAuthDropdown() {
    const currentUser = getCurrentUser();

    if (currentUser) {
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
          <a href="/profile/${encodeURIComponent(currentUser.email)}" class="header-action-link">Моят профил</a>
          <a href="/my-jobs-page" class="header-action-link">Моите обяви</a>
          <a href="/favorites-page" class="header-action-link">Любими</a>
          <a href="/inbox-page" class="header-action-link">Поща</a>
          <a href="/notifications-page" class="header-action-link inbox-link-wrapper">
            Известия
            <span id="dropdownNotificationBadge" class="inbox-badge hidden">0</span>
          </a>
          <button type="button" id="headerEditProfileBtn" class="header-action-btn">Редактирай профил</button>
          <button type="button" id="logoutBtn" class="danger-btn">Изход</button>
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
        <button type="button" id="loginBtn">Влез</button>
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

        <button type="button" id="registerBtn">Регистрация</button>
      </div>
    `;
  }

  function renderRegisterFields(role = "personal") {
    const box = $("registerDynamicFields");
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
    const regRole = $("regRole");
    if (!regRole) return;

    renderRegisterFields(regRole.value || "personal");
    regRole.onchange = () => renderRegisterFields(regRole.value || "personal");
  }

  function bindAuthTabs() {
    const loginTabBtn = $("loginTabBtn");
    const registerTabBtn = $("registerTabBtn");
    const loginFormBox = $("loginFormBox");
    const registerFormBox = $("registerFormBox");

    if (!loginTabBtn || !registerTabBtn || !loginFormBox || !registerFormBox) return;

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

  function bindHeaderEditProfileButton() {
    const btn = $("headerEditProfileBtn");
    const currentUser = getCurrentUser();

    if (btn && currentUser?.email) {
      btn.onclick = () => {
        window.location.href = `/profile/${encodeURIComponent(currentUser.email)}?edit=1`;
      };
    }
  }

  function bindHeaderLogoutButton() {
    const btn = $("logoutBtn");
    if (btn) btn.onclick = logout;
  }

  /* =========================
     LOGIN / REGISTER
  ========================= */

  async function login() {
    const email = $("loginEmail")?.value.trim();
    const password = $("loginPassword")?.value.trim();

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Грешка при вход.", "error");
        return;
      }

      setCurrentUser(data.user);
      localStorage.removeItem(APP.lastNotificationCountKey);
      showToast("Входът е успешен ✅", "success");
      safeReload();
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      showToast("Стана грешка при вход.", "error");
    }
  }

  async function register() {
    try {
      const name = $("regName")?.value.trim() || "";
      const email = $("regEmail")?.value.trim() || "";
      const password = $("regPassword")?.value.trim() || "";
      const role = $("regRole")?.value || "personal";
      const description = $("regDescription")?.value.trim() || "";
      const phone = $("regPhone")?.value.trim() || "";
      const showPhone = $("regShowPhone")?.checked || false;
      const profileImage = $("regProfileImage")?.files?.[0] || null;

      const contactName = $("regContactName")?.value.trim() || "";
      const companyId = $("regCompanyId")?.value.trim() || "";
      const manager = $("regManager")?.value.trim() || "";
      const profession = $("regProfession")?.value.trim() || "";

      if (!name || !email || !password) {
        showToast("Попълни име, имейл и парола.", "error");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("description", description);
      formData.append("phone", phone);
      formData.append("showPhone", String(showPhone));
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
        showToast(data.message || "Грешка при регистрация.", "error");
        return;
      }

      showToast("Регистрацията е успешна ✅", "success");
      safeReload();
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      showToast("Стана грешка при регистрация.", "error");
    }
  }

  function bindAuthActions() {
    const loginBtn = $("loginBtn");
    const registerBtn = $("registerBtn");

    if (loginBtn) loginBtn.onclick = login;
    if (registerBtn) registerBtn.onclick = register;
  }

  /* =========================
     NOTIFICATIONS
  ========================= */

  function renderNotificationPreviewItem(item) {
    return `
      <a href="${item.link || "/notifications-page"}" class="dropdown-preview-item">
        <div class="dropdown-preview-title">${escapeHtml(item.title || "Известие")}</div>
        <div class="dropdown-preview-meta">${escapeHtml(item.text || "")}</div>
        <div class="dropdown-preview-date">${escapeHtml(item.createdAt || "")}</div>
      </a>
    `;
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

      const dropdownBadge = $("dropdownNotificationBadge");
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

      const previewWrap = $("dropdownNotificationPreview");
      const previewList = $("dropdownPreviewList");

      if (previewWrap && previewList) {
        if (Array.isArray(latestData) && latestData.length) {
          previewWrap.classList.remove("hidden");
          previewList.innerHTML = latestData.map(renderNotificationPreviewItem).join("");
        } else {
          previewWrap.classList.add("hidden");
          previewList.innerHTML = "";
        }
      }

      if (!silent && unreadCount > previousCount) {
        const diff = unreadCount - previousCount;
        showToast(
          diff === 1 ? "Имаш 1 ново известие." : `Имаш ${diff} нови известия.`,
          "success",
          "Ново известие"
        );
      }

      setNotificationCountInStorage(unreadCount);
    } catch (error) {
      console.error("NOTIFICATION BADGE ERROR:", error);
    }
  }

  function startNotificationsPolling() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email || APP.notificationsPollingStarted) return;

    APP.notificationsPollingStarted = true;

    setTimeout(() => {
      updateNotificationBadge({ silent: true });
    }, 1000);

    APP.notificationInterval = setInterval(() => {
      updateNotificationBadge({ silent: false });
    }, 10000);
  }

  /* =========================
     HEADER USER RENDER
  ========================= */

  function updateHeaderUser() {
    const userMenuBtn = $("userMenuBtn");
    const userDropdown = $("userDropdown");

    if (!userMenuBtn || !userDropdown) return;

    userDropdown.innerHTML = renderAuthDropdown();

    const userInfo = $("userInfo");
    const loginFormBox = $("loginFormBox");
    const registerFormBox = $("registerFormBox");
    const loginTabBtn = $("loginTabBtn");
    const registerTabBtn = $("registerTabBtn");

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
      bindAuthActions();
      return;
    }

    userMenuBtn.textContent = user.name || "Профил";

    if (userInfo) {
      userInfo.innerHTML = `
        ${user.profileImage ? `<img src="${user.profileImage}" alt="Профил" class="mini-profile-image">` : ""}
        <div><strong>${escapeHtml(user.name || "Потребител")}</strong></div>
        <div>${escapeHtml(user.email || "")}</div>
        <div class="role-badge">${escapeHtml(roleLabel(user.role))}</div>
        <hr>
      `;
    }

    bindHeaderEditProfileButton();
    bindHeaderLogoutButton();
    updateNotificationBadge({ silent: true });
    startNotificationsPolling();
  }

  /* =========================
     ROLE VISIBILITY
  ========================= */

  function updateRoleVisibility() {
    const currentUser = getCurrentUser();
    const applicationsNavLink = $("applicationsNavLink");

    if (applicationsNavLink) {
      if (!currentUser) applicationsNavLink.classList.add("hidden");
      else applicationsNavLink.classList.remove("hidden");
    }
  }

  /* =========================
     MOBILE MENU / DROPDOWN
  ========================= */

  function bindMobileMenu() {
    const mobileMenuBtn = $("mobileMenuBtn");
    const navLinks = $("navLinks");

    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("show");
      });
    }
  }

  function bindUserDropdown() {
    const userMenuBtn = $("userMenuBtn");
    const userDropdown = $("userDropdown");

    if (!userMenuBtn || !userDropdown) return;

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

  /* =========================
     AUTO SAVE HELPERS
  ========================= */

  function createAutosaveKey(formId) {
    return `tm_autosave_${window.location.pathname}_${formId}`;
  }

  function enableFormAutosave(formOrSelector, fields = []) {
    const form = typeof formOrSelector === "string"
      ? document.querySelector(formOrSelector)
      : formOrSelector;

    if (!form || !fields.length) return;

    const storageKey = createAutosaveKey(form.id || form.getAttribute("data-autosave-id") || "form");

    function saveDraft() {
      const payload = {};

      fields.forEach((fieldId) => {
        const el = document.getElementById(fieldId);
        if (!el) return;

        if (el.type === "checkbox") payload[fieldId] = !!el.checked;
        else payload[fieldId] = el.value;
      });

      localStorage.setItem(storageKey, JSON.stringify(payload));
    }

    function restoreDraft() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;

        const payload = JSON.parse(raw);
        if (!payload || typeof payload !== "object") return;

        fields.forEach((fieldId) => {
          const el = document.getElementById(fieldId);
          if (!el || !(fieldId in payload)) return;

          if (el.type === "checkbox") el.checked = !!payload[fieldId];
          else if (!el.value) el.value = payload[fieldId] || "";
        });
      } catch (error) {
        console.error("AUTOSAVE RESTORE ERROR:", error);
      }
    }

    restoreDraft();

    fields.forEach((fieldId) => {
      const el = document.getElementById(fieldId);
      if (!el) return;

      el.addEventListener("input", saveDraft);
      el.addEventListener("change", saveDraft);
    });

    form.addEventListener("submit", () => {
      localStorage.removeItem(storageKey);
    });
  }

  /* =========================
     GLOBAL API
  ========================= */

  window.showStatus = showStatus;
  window.clearStatus = clearStatus;
  window.roleLabel = roleLabel;
  window.normalizeEmail = normalizeEmail;
  window.getCurrentUser = getCurrentUser;
  window.setCurrentUser = setCurrentUser;
  window.logout = logout;
  window.showToast = showToast;
  window.updateHeaderUser = updateHeaderUser;
  window.updateRoleVisibility = updateRoleVisibility;
  window.login = login;
  window.register = register;
  window.enableFormAutosave = enableFormAutosave;
  window.createEmptyStateHTML = createEmptyStateHTML;
  window.showSkeletons = showSkeletons;
  window.applyDarkModeState = applyDarkModeState;
  window.toggleDarkMode = toggleDarkMode;

  /* =========================
     INIT
  ========================= */

  document.addEventListener("DOMContentLoaded", () => {
    ensureThemeToggleButton();
    applyDarkModeState();
    renderBreadcrumbs();
    bindMobileMenu();
    bindUserDropdown();
    updateHeaderUser();
    bindAuthTabs();
    bindRegisterRoleChange();
    bindAuthActions();
    updateRoleVisibility();
  });
})();