const ADMIN_EMAIL = "admin@tursimajstor.bg";

const adminDeniedBox = document.getElementById("adminDeniedBox");
const adminMainWrap = document.getElementById("adminMainWrap");

const adminStatsGrid = document.getElementById("adminStatsGrid");

/* tabs */
const adminTabJobs = document.getElementById("adminTabJobs");
const adminTabUsers = document.getElementById("adminTabUsers");
const adminTabPosts = document.getElementById("adminTabPosts");
const adminTabReports = document.getElementById("adminTabReports");
const adminTabAds = document.getElementById("adminTabAds");

const adminJobsPanel = document.getElementById("adminJobsPanel");
const adminUsersPanel = document.getElementById("adminUsersPanel");
const adminPostsPanel = document.getElementById("adminPostsPanel");
const adminReportsPanel = document.getElementById("adminReportsPanel");
const adminAdsPanel = document.getElementById("adminAdsPanel");

/* jobs */
const adminJobsInfo = document.getElementById("adminJobsInfo");
const adminJobsList = document.getElementById("adminJobsList");
const adminJobsSearch = document.getElementById("adminJobsSearch");
const adminJobsTypeFilter = document.getElementById("adminJobsTypeFilter");
const adminJobsStatusFilter = document.getElementById("adminJobsStatusFilter");
const adminJobsSortFilter = document.getElementById("adminJobsSortFilter");
const bulkHideJobsBtn = document.getElementById("bulkHideJobsBtn");
const bulkDeleteJobsBtn = document.getElementById("bulkDeleteJobsBtn");

/* users */
const adminUsersInfo = document.getElementById("adminUsersInfo");
const adminUsersList = document.getElementById("adminUsersList");
const adminUsersSearch = document.getElementById("adminUsersSearch");
const adminUsersRoleFilter = document.getElementById("adminUsersRoleFilter");
const adminUsersStatusFilter = document.getElementById("adminUsersStatusFilter");
const adminUsersSortFilter = document.getElementById("adminUsersSortFilter");

/* posts */
const adminPostsInfo = document.getElementById("adminPostsInfo");
const adminPostsList = document.getElementById("adminPostsList");
const adminPostsSearch = document.getElementById("adminPostsSearch");
const adminPostsSortFilter = document.getElementById("adminPostsSortFilter");

/* reports */
const adminReportsInfo = document.getElementById("adminReportsInfo");
const adminReportsList = document.getElementById("adminReportsList");
const adminReportsSearch = document.getElementById("adminReportsSearch");
const adminReportsTypeFilter = document.getElementById("adminReportsTypeFilter");
const adminReportsStatusFilter = document.getElementById("adminReportsStatusFilter");

/* ads */
const adminAdsStatus = document.getElementById("adminAdsStatus");
const adminAdsList = document.getElementById("adminAdsList");
const createAdBtn = document.getElementById("createAdBtn");

/* modal */
const adminConfirmModal = document.getElementById("adminConfirmModal");
const adminConfirmBackdrop = document.getElementById("adminConfirmBackdrop");
const adminConfirmCloseBtn = document.getElementById("adminConfirmCloseBtn");
const adminConfirmCancelBtn = document.getElementById("adminConfirmCancelBtn");
const adminConfirmOkBtn = document.getElementById("adminConfirmOkBtn");
const adminConfirmTitle = document.getElementById("adminConfirmTitle");
const adminConfirmText = document.getElementById("adminConfirmText");

let adminStats = null;
let adminJobs = [];
let adminUsers = [];
let adminPosts = [];
let adminReports = [];
let adminAds = [];
let activeAdminTab = "jobs";
let selectedJobIds = new Set();
let confirmAction = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeEmailLocal(email = "") {
  return String(email || "").trim().toLowerCase();
}

function getCurrentAdminUser() {
  return typeof getCurrentUser === "function" ? getCurrentUser() : null;
}

function isAdminUser() {
  const currentUser = getCurrentAdminUser();
  return normalizeEmailLocal(currentUser?.email) === normalizeEmailLocal(ADMIN_EMAIL);
}

function debounce(fn, delay = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function openConfirmModal({ title, text, onConfirm }) {
  confirmAction = typeof onConfirm === "function" ? onConfirm : null;
  adminConfirmTitle.textContent = title || "Сигурен ли си?";
  adminConfirmText.textContent = text || "Потвърди действието.";
  adminConfirmModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeConfirmModal() {
  adminConfirmModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  confirmAction = null;
}

function switchAdminTab(tabName) {
  activeAdminTab = tabName;

  [adminTabJobs, adminTabUsers, adminTabPosts, adminTabReports, adminTabAds].forEach(btn => {
    btn.classList.remove("active");
  });

  [adminJobsPanel, adminUsersPanel, adminPostsPanel, adminReportsPanel, adminAdsPanel].forEach(panel => {
    panel.classList.add("hidden");
  });

  if (tabName === "jobs") {
    adminTabJobs.classList.add("active");
    adminJobsPanel.classList.remove("hidden");
  }
  if (tabName === "users") {
    adminTabUsers.classList.add("active");
    adminUsersPanel.classList.remove("hidden");
  }
  if (tabName === "posts") {
    adminTabPosts.classList.add("active");
    adminPostsPanel.classList.remove("hidden");
  }
  if (tabName === "reports") {
    adminTabReports.classList.add("active");
    adminReportsPanel.classList.remove("hidden");
  }
  if (tabName === "ads") {
    adminTabAds.classList.add("active");
    adminAdsPanel.classList.remove("hidden");
  }
}

/* =========================
   API
========================= */
async function adminFetch(url, options = {}) {
  const currentUser = getCurrentAdminUser();
  const requesterEmail = currentUser?.email || "";
  const method = (options.method || "GET").toUpperCase();

  let finalUrl = url;
  const finalOptions = { ...options };

  if (method === "GET") {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl += `${separator}requesterEmail=${encodeURIComponent(requesterEmail)}`;
    finalOptions.headers = {
      ...(finalOptions.headers || {}),
      "x-admin-email": requesterEmail
    };
  } else if (finalOptions.body instanceof FormData) {
    if (!finalOptions.body.has("requesterEmail")) {
      finalOptions.body.append("requesterEmail", requesterEmail);
    }

    finalOptions.headers = {
      ...(finalOptions.headers || {}),
      "x-admin-email": requesterEmail
    };
  } else {
    const currentHeaders = finalOptions.headers || {};
    finalOptions.headers = {
      "Content-Type": "application/json",
      "x-admin-email": requesterEmail,
      ...currentHeaders
    };

    let parsedBody = {};
    try {
      parsedBody = finalOptions.body ? JSON.parse(finalOptions.body) : {};
    } catch {
      parsedBody = {};
    }

    finalOptions.body = JSON.stringify({
      ...parsedBody,
      requesterEmail
    });
  }

  const res = await fetch(finalUrl, finalOptions);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Admin request failed");
  }

  return data;
}

/* =========================
   STATS
========================= */
function renderStats() {
  if (!adminStats) {
    adminStatsGrid.innerHTML = `<div class="empty">Няма статистика.</div>`;
    return;
  }

  adminStatsGrid.innerHTML = `
    <div class="quick-action-card">
      <div class="quick-action-icon">📦</div>
      <h3>${Number(adminStats.jobs || 0)}</h3>
      <p>Обяви</p>
    </div>

    <div class="quick-action-card">
      <div class="quick-action-icon">📝</div>
      <h3>${Number(adminStats.applications || 0)}</h3>
      <p>Кандидатури</p>
    </div>

    <div class="quick-action-card">
      <div class="quick-action-icon">👤</div>
      <h3>${Number(adminStats.activeProfiles || 0)}</h3>
      <p>Активни профили</p>
    </div>

    <div class="quick-action-card">
      <div class="quick-action-icon">📰</div>
      <h3>${Number(adminStats.posts || 0)}</h3>
      <p>Публикации</p>
    </div>

    <div class="quick-action-card">
      <div class="quick-action-icon">🚩</div>
      <h3>${Number(adminStats.pendingReports || 0)}</h3>
      <p>Чакащи доклади</p>
    </div>

    <div class="quick-action-card">
      <div class="quick-action-icon">📢</div>
      <h3>${Number(adminStats.ads || 0)}</h3>
      <p>Реклами</p>
    </div>
  `;
}

async function loadAdminStats() {
  adminStats = await adminFetch("/api/admin/stats");
  renderStats();
}

/* =========================
   JOBS
========================= */
function toggleJobSelection(jobId) {
  const normalizedId = Number(jobId);
  if (selectedJobIds.has(normalizedId)) {
    selectedJobIds.delete(normalizedId);
  } else {
    selectedJobIds.add(normalizedId);
  }
  renderAdminJobs();
}

function getFilteredAdminJobs() {
  const searchValue = (adminJobsSearch.value || "").trim().toLowerCase();
  const typeValue = adminJobsTypeFilter.value;
  const statusValue = adminJobsStatusFilter.value;
  const sortValue = adminJobsSortFilter.value;

  let filtered = adminJobs.filter(job => {
    const title = (job.title || "").toLowerCase();
    const description = (job.description || "").toLowerCase();
    const city = (job.city || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      title.includes(searchValue) ||
      description.includes(searchValue) ||
      city.includes(searchValue);

    const matchesType = !typeValue || job.type === typeValue;

    const matchesStatus =
      !statusValue ||
      (statusValue === "visible" && !job.isHidden) ||
      (statusValue === "hidden" && !!job.isHidden) ||
      (statusValue === "premium" && !!job.isPromoted);

    return matchesSearch && matchesType && matchesStatus;
  });

  filtered.sort((a, b) => {
    const aId = Number(a.id) || 0;
    const bId = Number(b.id) || 0;
    return sortValue === "oldest" ? aId - bId : bId - aId;
  });

  return filtered;
}

function renderAdminJobs() {
  const filtered = getFilteredAdminJobs();
  adminJobsInfo.textContent = `Общо: ${filtered.length} | Избрани: ${selectedJobIds.size}`;

  if (!filtered.length) {
    adminJobsList.innerHTML = `<div class="empty">Няма намерени обяви.</div>`;
    return;
  }

  adminJobsList.innerHTML = filtered.map(job => `
    <div class="application-status-card ${job.isHidden ? "rejected-card" : ""}">
      <div class="application-card-top">
        <div>
          <h3 class="application-card-title">
            <label style="display:flex; align-items:center; gap:10px; margin:0;">
              <input
                type="checkbox"
                style="width:auto; margin:0;"
                ${selectedJobIds.has(Number(job.id)) ? "checked" : ""}
                onchange="toggleJobSelection(${Number(job.id)})"
              >
              <span>${escapeHtml(job.title || "Без заглавие")}</span>
            </label>
          </h3>

          <div class="application-card-meta">
            <span>📍 ${escapeHtml(job.city || "")}</span>
            <span>🏷 ${escapeHtml(job.category || "")}${job.subcategory ? " / " + escapeHtml(job.subcategory) : ""}</span>
            <span>📌 ${escapeHtml(job.type || "job")}</span>
            <span>👤 ${escapeHtml(job.ownerEmail || "")}</span>
          </div>
        </div>

        <div class="application-status-badge ${job.isHidden ? "status-rejected" : "status-approved"}">
          ${job.isHidden ? "Скрита" : "Видима"}
        </div>
      </div>

      <div class="application-card-body">
        <h4>Описание</h4>
        <p>${escapeHtml(job.description || "")}</p>
      </div>

      <div class="application-action-buttons">
        <a href="/job/${job.id}" class="job-card-btn">Отвори</a>
        <button type="button" class="secondary-btn" onclick="toggleJobVisibility(${job.id})">
          ${job.isHidden ? "Покажи" : "Скрий"}
        </button>
        <button type="button" class="danger-btn" onclick="deleteAdminJob(${job.id})">Изтрий</button>
      </div>
    </div>
  `).join("");
}

async function loadAdminJobs() {
  const data = await adminFetch("/api/admin/jobs");
  adminJobs = Array.isArray(data.jobs) ? data.jobs : [];
  renderAdminJobs();
}

async function toggleJobVisibility(jobId) {
  const job = adminJobs.find(item => Number(item.id) === Number(jobId));
  if (!job) return;

  const actionText = job.isHidden ? "покажеш" : "скриеш";

  openConfirmModal({
    title: "Промяна на видимост",
    text: `Сигурен ли си, че искаш да ${actionText} тази обява?`,
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/jobs/${jobId}/toggle-visibility`, {
          method: "PUT",
          body: JSON.stringify({})
        });

        if (typeof showToast === "function") {
          showToast("Обявата е обновена ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

async function deleteAdminJob(jobId) {
  openConfirmModal({
    title: "Изтриване на обява",
    text: "Сигурен ли си, че искаш да изтриеш тази обява?",
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/jobs/${jobId}`, {
          method: "DELETE",
          body: JSON.stringify({})
        });

        selectedJobIds.delete(Number(jobId));

        if (typeof showToast === "function") {
          showToast("Обявата е изтрита ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

async function bulkHideSelectedJobs() {
  const ids = [...selectedJobIds];
  if (!ids.length) {
    if (typeof showToast === "function") showToast("Няма избрани обяви.", "error");
    return;
  }

  openConfirmModal({
    title: "Скриване на избрани обяви",
    text: `Сигурен ли си, че искаш да скриеш ${ids.length} обяви?`,
    onConfirm: async () => {
      try {
        await adminFetch("/api/admin/jobs/bulk-hide", {
          method: "PUT",
          body: JSON.stringify({ ids })
        });

        selectedJobIds.clear();

        if (typeof showToast === "function") {
          showToast("Избраните обяви са скрити ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

async function bulkDeleteSelectedJobs() {
  const ids = [...selectedJobIds];
  if (!ids.length) {
    if (typeof showToast === "function") showToast("Няма избрани обяви.", "error");
    return;
  }

  openConfirmModal({
    title: "Изтриване на избрани обяви",
    text: `Сигурен ли си, че искаш да изтриеш ${ids.length} обяви?`,
    onConfirm: async () => {
      try {
        await adminFetch("/api/admin/jobs/bulk-delete", {
          method: "DELETE",
          body: JSON.stringify({ ids })
        });

        selectedJobIds.clear();

        if (typeof showToast === "function") {
          showToast("Избраните обяви са изтрити ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

/* =========================
   USERS
========================= */
function getFilteredAdminUsers() {
  const searchValue = (adminUsersSearch.value || "").trim().toLowerCase();
  const roleValue = adminUsersRoleFilter.value;
  const statusValue = adminUsersStatusFilter.value;
  const sortValue = adminUsersSortFilter.value;

  let filtered = adminUsers.filter(user => {
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = (user.role || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      role.includes(searchValue);

    const matchesRole = !roleValue || user.role === roleValue;

    const matchesStatus =
      !statusValue ||
      (statusValue === "active" && !user.isBlocked) ||
      (statusValue === "blocked" && !!user.isBlocked);

    return matchesSearch && matchesRole && matchesStatus;
  });

  filtered.sort((a, b) => {
    const aId = Number(a.id) || 0;
    const bId = Number(b.id) || 0;
    return sortValue === "oldest" ? aId - bId : bId - aId;
  });

  return filtered;
}

function renderAdminUsers() {
  const filtered = getFilteredAdminUsers();
  adminUsersInfo.textContent = `Общо: ${filtered.length} профила`;

  if (!filtered.length) {
    adminUsersList.innerHTML = `<div class="empty">Няма намерени профили.</div>`;
    return;
  }

  adminUsersList.innerHTML = filtered.map(user => `
    <div class="application-status-card ${user.isBlocked ? "rejected-card" : ""}">
      <div class="application-card-top">
        <div>
          <h3 class="application-card-title">${escapeHtml(user.name || "Потребител")}</h3>
          <div class="application-card-meta">
            <span>✉️ ${escapeHtml(user.email || "")}</span>
            <span>🏷 ${escapeHtml(user.role || "")}</span>
          </div>
        </div>

        <div class="application-status-badge ${user.isBlocked ? "status-rejected" : "status-approved"}">
          ${user.isBlocked ? "Блокиран" : "Активен"}
        </div>
      </div>

      <div class="application-card-body">
        <h4>Описание</h4>
        <p>${escapeHtml(user.description || "Няма описание.")}</p>
      </div>

      <div class="application-action-buttons">
        <a href="/profile/${encodeURIComponent(user.email)}" class="job-card-btn">Профил</a>
        ${normalizeEmailLocal(user.email) !== normalizeEmailLocal(ADMIN_EMAIL) ? `
          <button type="button" class="secondary-btn" onclick="toggleUserBlock('${encodeURIComponent(user.email)}')">
            ${user.isBlocked ? "Отблокирай" : "Блокирай"}
          </button>
        ` : ""}
      </div>
    </div>
  `).join("");
}

async function loadAdminUsers() {
  const data = await adminFetch("/api/admin/users");
  adminUsers = Array.isArray(data.users) ? data.users : [];
  renderAdminUsers();
}

async function toggleUserBlock(encodedEmail) {
  const email = decodeURIComponent(encodedEmail);
  const user = adminUsers.find(item => normalizeEmailLocal(item.email) === normalizeEmailLocal(email));
  if (!user) return;

  const actionText = user.isBlocked ? "отблокираш" : "блокираш";

  openConfirmModal({
    title: "Промяна на статус",
    text: `Сигурен ли си, че искаш да ${actionText} този профил?`,
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/users/${encodeURIComponent(email)}/toggle-block`, {
          method: "PUT",
          body: JSON.stringify({})
        });

        if (typeof showToast === "function") {
          showToast("Профилът е обновен ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

/* =========================
   POSTS
========================= */
function getFilteredAdminPosts() {
  const searchValue = (adminPostsSearch.value || "").trim().toLowerCase();
  const sortValue = adminPostsSortFilter.value;

  let filtered = adminPosts.filter(post => {
    const text = (post.text || "").toLowerCase();
    const authorName = (post.authorName || "").toLowerCase();
    const authorEmail = (post.authorEmail || "").toLowerCase();

    return (
      !searchValue ||
      text.includes(searchValue) ||
      authorName.includes(searchValue) ||
      authorEmail.includes(searchValue)
    );
  });

  filtered.sort((a, b) => {
    const aId = Number(a.id) || 0;
    const bId = Number(b.id) || 0;
    return sortValue === "oldest" ? aId - bId : bId - aId;
  });

  return filtered;
}

function renderAdminPosts() {
  const filtered = getFilteredAdminPosts();
  adminPostsInfo.textContent = `Общо: ${filtered.length} публикации`;

  if (!filtered.length) {
    adminPostsList.innerHTML = `<div class="empty">Няма публикации.</div>`;
    return;
  }

  adminPostsList.innerHTML = filtered.map(post => `
    <div class="application-status-card">
      <div class="application-card-top">
        <div>
          <h3 class="application-card-title">${escapeHtml(post.authorName || "Потребител")}</h3>
          <div class="application-card-meta">
            <span>✉️ ${escapeHtml(post.authorEmail || "")}</span>
            <span>🕒 ${escapeHtml(post.createdAt || "")}</span>
          </div>
        </div>

        <div class="application-status-badge status-approved">
          Активна
        </div>
      </div>

      <div class="application-card-body">
        <h4>Публикация</h4>
        <p>${escapeHtml(post.text || "")}</p>
      </div>

      <div class="application-action-buttons">
        <button type="button" class="danger-btn" onclick="deleteAdminPost(${post.id})">Изтрий</button>
      </div>
    </div>
  `).join("");
}

async function loadAdminPosts() {
  const data = await adminFetch("/api/admin/posts");
  adminPosts = Array.isArray(data.posts) ? data.posts : [];
  renderAdminPosts();
}

async function deleteAdminPost(postId) {
  openConfirmModal({
    title: "Изтриване на публикация",
    text: "Сигурен ли си, че искаш да изтриеш тази публикация?",
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/posts/${postId}`, {
          method: "DELETE",
          body: JSON.stringify({})
        });

        if (typeof showToast === "function") {
          showToast("Публикацията е изтрита ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

/* =========================
   REPORTS
========================= */
function getFilteredAdminReports() {
  const searchValue = (adminReportsSearch.value || "").trim().toLowerCase();
  const typeValue = adminReportsTypeFilter.value;
  const statusValue = adminReportsStatusFilter.value;

  return adminReports.filter(item => {
    const reason = (item.reason || "").toLowerCase();
    const type = (item.targetType || "").toLowerCase();
    const reporterEmail = (item.reporterEmail || "").toLowerCase();
    const targetEmail = (item.targetEmail || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      reason.includes(searchValue) ||
      type.includes(searchValue) ||
      reporterEmail.includes(searchValue) ||
      targetEmail.includes(searchValue);

    const matchesType = !typeValue || item.targetType === typeValue;
    const matchesStatus = !statusValue || item.status === statusValue;

    return matchesSearch && matchesType && matchesStatus;
  });
}

function renderAdminReports() {
  const filtered = getFilteredAdminReports();
  adminReportsInfo.textContent = `Общо: ${filtered.length} доклада`;

  if (!filtered.length) {
    adminReportsList.innerHTML = `<div class="empty">Няма доклади.</div>`;
    return;
  }

  adminReportsList.innerHTML = filtered.map(report => `
    <div class="application-status-card ${report.status === "pending" ? "pending-card" : "approved-card"}">
      <div class="application-card-top">
        <div>
          <h3 class="application-card-title">${escapeHtml(report.targetType || "Доклад")}</h3>
          <div class="application-card-meta">
            <span>🚩 От: ${escapeHtml(report.reporterEmail || "")}</span>
            <span>🎯 Към: ${escapeHtml(report.targetEmail || report.targetId || "")}</span>
            <span>🕒 ${escapeHtml(report.createdAt || "")}</span>
          </div>
        </div>

        <div class="application-status-badge ${report.status === "pending" ? "status-pending" : "status-approved"}">
          ${report.status === "pending" ? "Чака" : "Решен"}
        </div>
      </div>

      <div class="application-card-body">
        <h4>Причина</h4>
        <p>${escapeHtml(report.reason || "Няма причина.")}</p>
      </div>

      <div class="application-action-buttons">
        ${report.status === "pending"
          ? `<button type="button" class="secondary-btn" onclick="resolveAdminReport(${report.id})">Маркирай като решен</button>`
          : ""}
      </div>
    </div>
  `).join("");
}

async function loadAdminReports() {
  const data = await adminFetch("/api/admin/reports");
  adminReports = Array.isArray(data.reports) ? data.reports : [];
  renderAdminReports();
}

async function resolveAdminReport(reportId) {
  openConfirmModal({
    title: "Решаване на доклад",
    text: "Сигурен ли си, че искаш да маркираш този доклад като решен?",
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/reports/${reportId}/resolve`, {
          method: "PUT",
          body: JSON.stringify({})
        });

        if (typeof showToast === "function") {
          showToast("Докладът е обновен ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

/* =========================
   ADS
========================= */
function renderAdminAds() {
  if (!adminAds.length) {
    adminAdsList.innerHTML = `<div class="empty">Няма реклами.</div>`;
    return;
  }

  adminAdsList.innerHTML = adminAds.map(ad => `
    <div class="application-status-card">
      <div class="application-card-top">
        <div>
          <h3 class="application-card-title">${escapeHtml(ad.title || "Реклама")}</h3>
          <div class="application-card-meta">
            <span>🏷 ${escapeHtml(ad.type || "primary")}</span>
            <span>🕒 ${escapeHtml(ad.createdAt || "")}</span>
          </div>
        </div>

        <div class="application-status-badge ${ad.isActive ? "status-approved" : "status-rejected"}">
          ${ad.isActive ? "Активна" : "Изключена"}
        </div>
      </div>

      <div class="application-card-body">
        <h4>Текст</h4>
        <p>${escapeHtml(ad.text || "")}</p>
        ${ad.link ? `<p><strong>Линк:</strong> ${escapeHtml(ad.link)}</p>` : ""}
        ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="Ad" class="job-image">` : ""}
      </div>

      <div class="application-action-buttons">
        <button type="button" class="secondary-btn" onclick="toggleAdminAd(${ad.id})">
          ${ad.isActive ? "Изключи" : "Активирай"}
        </button>
        <button type="button" class="danger-btn" onclick="deleteAdminAd(${ad.id})">Изтрий</button>
      </div>
    </div>
  `).join("");
}

async function loadAdminAds() {
  const data = await adminFetch("/api/admin/ads");
  adminAds = Array.isArray(data.ads) ? data.ads : [];
  renderAdminAds();
}

async function createAdminAd() {
  clearStatus(adminAdsStatus);

  try {
    const title = document.getElementById("adTitle").value.trim();
    const text = document.getElementById("adText").value.trim();
    const link = document.getElementById("adLink").value.trim();
    const type = document.getElementById("adType").value;
    const imageFile = document.getElementById("adImage").files[0];

    if (!title || !text) {
      showStatus(adminAdsStatus, "Заглавието и текстът са задължителни.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("text", text);
    formData.append("link", link);
    formData.append("type", type);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const data = await adminFetch("/api/admin/ads", {
      method: "POST",
      body: formData
    });

    showStatus(adminAdsStatus, data.message || "Рекламата е създадена ✅", "success");

    document.getElementById("adTitle").value = "";
    document.getElementById("adText").value = "";
    document.getElementById("adLink").value = "";
    document.getElementById("adType").value = "primary";
    document.getElementById("adImage").value = "";

    if (typeof showToast === "function") {
      showToast(data.message || "Рекламата е създадена ✅", "success");
    }

    await refreshAdminData();
  } catch (error) {
    showStatus(adminAdsStatus, error.message || "Грешка при създаване.", "error");
  }
}

async function toggleAdminAd(adId) {
  openConfirmModal({
    title: "Промяна на статус на реклама",
    text: "Сигурен ли си, че искаш да промениш статуса на тази реклама?",
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/ads/${adId}/toggle`, {
          method: "PUT",
          body: JSON.stringify({})
        });

        if (typeof showToast === "function") {
          showToast("Рекламата е обновена ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

async function deleteAdminAd(adId) {
  openConfirmModal({
    title: "Изтриване на реклама",
    text: "Сигурен ли си, че искаш да изтриеш тази реклама?",
    onConfirm: async () => {
      try {
        await adminFetch(`/api/admin/ads/${adId}`, {
          method: "DELETE",
          body: JSON.stringify({})
        });

        if (typeof showToast === "function") {
          showToast("Рекламата е изтрита ✅", "success");
        }

        await refreshAdminData();
      } catch (error) {
        if (typeof showToast === "function") {
          showToast(error.message || "Грешка.", "error");
        }
      }
    }
  });
}

/* =========================
   REFRESH
========================= */
async function refreshAdminData() {
  await Promise.all([
    loadAdminStats(),
    loadAdminJobs(),
    loadAdminUsers(),
    loadAdminPosts(),
    loadAdminReports(),
    loadAdminAds()
  ]);
}

/* =========================
   INIT
========================= */
window.toggleJobSelection = toggleJobSelection;
window.toggleJobVisibility = toggleJobVisibility;
window.deleteAdminJob = deleteAdminJob;
window.toggleUserBlock = toggleUserBlock;
window.deleteAdminPost = deleteAdminPost;
window.resolveAdminReport = resolveAdminReport;
window.toggleAdminAd = toggleAdminAd;
window.deleteAdminAd = deleteAdminAd;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAppShell === "function") {
    initAppShell();
  } else {
    if (typeof updateHeaderUser === "function") updateHeaderUser();
    if (typeof updateRoleVisibility === "function") updateRoleVisibility();
  }

  if (!isAdminUser()) {
    adminDeniedBox.classList.remove("hidden");
    adminMainWrap.classList.add("hidden");
    return;
  }

  adminDeniedBox.classList.add("hidden");
  adminMainWrap.classList.remove("hidden");

  adminTabJobs.addEventListener("click", () => switchAdminTab("jobs"));
  adminTabUsers.addEventListener("click", () => switchAdminTab("users"));
  adminTabPosts.addEventListener("click", () => switchAdminTab("posts"));
  adminTabReports.addEventListener("click", () => switchAdminTab("reports"));
  adminTabAds.addEventListener("click", () => switchAdminTab("ads"));

  const debouncedJobsRender = debounce(renderAdminJobs, 220);
  adminJobsSearch.addEventListener("input", debouncedJobsRender);
  adminJobsTypeFilter.addEventListener("change", renderAdminJobs);
  adminJobsStatusFilter.addEventListener("change", renderAdminJobs);
  adminJobsSortFilter.addEventListener("change", renderAdminJobs);

  const debouncedUsersRender = debounce(renderAdminUsers, 220);
  adminUsersSearch.addEventListener("input", debouncedUsersRender);
  adminUsersRoleFilter.addEventListener("change", renderAdminUsers);
  adminUsersStatusFilter.addEventListener("change", renderAdminUsers);
  adminUsersSortFilter.addEventListener("change", renderAdminUsers);

  const debouncedPostsRender = debounce(renderAdminPosts, 220);
  adminPostsSearch.addEventListener("input", debouncedPostsRender);
  adminPostsSortFilter.addEventListener("change", renderAdminPosts);

  const debouncedReportsRender = debounce(renderAdminReports, 220);
  adminReportsSearch.addEventListener("input", debouncedReportsRender);
  adminReportsTypeFilter.addEventListener("change", renderAdminReports);
  adminReportsStatusFilter.addEventListener("change", renderAdminReports);

  bulkHideJobsBtn.addEventListener("click", bulkHideSelectedJobs);
  bulkDeleteJobsBtn.addEventListener("click", bulkDeleteSelectedJobs);

  createAdBtn.addEventListener("click", createAdminAd);

  adminConfirmBackdrop.addEventListener("click", closeConfirmModal);
  adminConfirmCloseBtn.addEventListener("click", closeConfirmModal);
  adminConfirmCancelBtn.addEventListener("click", closeConfirmModal);
  adminConfirmOkBtn.addEventListener("click", async () => {
    const action = confirmAction;
    closeConfirmModal();
    if (typeof action === "function") {
      await action();
    }
  }); 

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeConfirmModal();
    }
  });

  switchAdminTab("jobs");
  await refreshAdminData();
});