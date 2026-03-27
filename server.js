const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public"), { index: false }));

/* =========================
   UPLOADS
========================= */
const uploadsDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeOriginal = String(file.originalname || "file").replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginal}`);
  }
});

const upload = multer({ storage });

/* =========================
   IN-MEMORY DATA
========================= */
const ADMIN_EMAIL = "admin@tursimajstor.bg";
const ADMIN_PASSWORD = "admin123";

const BOOST_PLANS = {
  3: { days: 3, price: 9, name: "Mini Boost" },
  7: { days: 7, price: 19, name: "Standard Boost" },
  30: { days: 30, price: 49, name: "Power Boost" }
};

let users = [
  {
    id: 1,
    name: "Админ",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    description: "Системен администратор",
    profileImage: "",
    coverImage: "",
    showPhone: false,
    phone: "",
    workCities: "",
    workingHours: "",
    website: "",
    facebook: "",
    instagram: "",
    youtube: "",
    videoUrl: "",
    faq: "",
    services: "",
    isBlocked: false
  }
];

let jobs = [
  {
    id: 1,
    title: "Боядисване на офис",
    description: "Търся човек за боядисване на офис.",
    city: "Плевен",
    budget: 300,
    category: "Строителство",
    subcategory: "Боядисване",
    ownerEmail: "client@example.com",
    type: "job",
    imageUrl: "",
    gallery: [],
    isPromoted: false,
    promotedUntil: null,
    isHidden: false,
    createdAt: new Date().toLocaleString("bg-BG")
  }
];

let applications = [];
let favorites = [];
let inboxMessages = [];
let notifications = [];
let posts = [];
let completedProjects = [];
let portfolioItems = [];
let reports = [];
let ads = [];

/* =========================
   HELPERS
========================= */
function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function getNextId(arr) {
  return Array.isArray(arr) && arr.length
    ? Math.max(...arr.map(item => Number(item.id) || 0)) + 1
    : 1;
}

function isAdminEmail(email = "") {
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    description: user.description || "",
    profileImage: user.profileImage || "",
    coverImage: user.coverImage || "",
    showPhone: !!user.showPhone,
    phone: user.phone || "",
    workCities: user.workCities || "",
    workingHours: user.workingHours || "",
    services: user.services || "",
    website: user.website || "",
    facebook: user.facebook || "",
    instagram: user.instagram || "",
    youtube: user.youtube || "",
    videoUrl: user.videoUrl || "",
    faq: user.faq || "",
    isBlocked: !!user.isBlocked
  };
}

function normalizeJobPromotion(job) {
  if (!job) return job;

  if (
    job.isPromoted &&
    job.promotedUntil &&
    new Date(job.promotedUntil) <= new Date()
  ) {
    job.isPromoted = false;
    job.promotedUntil = null;
  }

  return job;
}

function isJobPromoted(job) {
  return !!(
    job &&
    job.isPromoted &&
    job.promotedUntil &&
    new Date(job.promotedUntil) > new Date()
  );
}

function sortJobsForMarketplace(items) {
  items.forEach(normalizeJobPromotion);

  return items.sort((a, b) => {
    const aPromoted = isJobPromoted(a);
    const bPromoted = isJobPromoted(b);

    if (aPromoted && !bPromoted) return -1;
    if (!aPromoted && bPromoted) return 1;

    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

function createNotification({ userEmail, type, title, text, link }) {
  if (!userEmail) return;

  notifications.unshift({
    id: getNextId(notifications),
    userEmail: normalizeEmail(userEmail),
    type: type || "general",
    title: title || "Ново известие",
    text: text || "",
    link: link || "/notifications-page",
    isRead: false,
    createdAt: new Date().toLocaleString("bg-BG")
  });
}

function getBoostPlan(days) {
  return BOOST_PLANS[Number(days)] || null;
}

function requireAdmin(req, res, next) {
  const requesterEmail =
    String(
      req.query.requesterEmail ||
      req.body?.requesterEmail ||
      req.headers["x-admin-email"] ||
      ""
    ).trim().toLowerCase();

  console.log("ADMIN CHECK:", {
    method: req.method,
    url: req.originalUrl,
    queryEmail: req.query.requesterEmail || "",
    bodyEmail: req.body?.requesterEmail || "",
    headerEmail: req.headers["x-admin-email"] || "",
    finalEmail: requesterEmail
  });

  if (requesterEmail !== "admin@tursimajstor.bg") {
    return res.status(403).json({ message: "Нямаш достъп." });
  }

  next();
}

function updateEmailAcrossCollections(oldEmail, newEmail) {
  const oldNormalized = normalizeEmail(oldEmail);
  const newNormalized = normalizeEmail(newEmail);

  users.forEach(user => {
    if (normalizeEmail(user.email) === oldNormalized) user.email = newNormalized;
  });

  jobs.forEach(job => {
    if (normalizeEmail(job.ownerEmail) === oldNormalized) job.ownerEmail = newNormalized;
  });

  applications.forEach(app => {
    if (normalizeEmail(app.email) === oldNormalized) app.email = newNormalized;
  });

  favorites.forEach(fav => {
    if (normalizeEmail(fav.userEmail) === oldNormalized) fav.userEmail = newNormalized;
  });

  inboxMessages.forEach(msg => {
    if (normalizeEmail(msg.senderEmail) === oldNormalized) msg.senderEmail = newNormalized;
    if (normalizeEmail(msg.receiverEmail) === oldNormalized) msg.receiverEmail = newNormalized;
  });

  notifications.forEach(item => {
    if (normalizeEmail(item.userEmail) === oldNormalized) item.userEmail = newNormalized;
  });

  posts.forEach(post => {
    if (normalizeEmail(post.authorEmail) === oldNormalized) post.authorEmail = newNormalized;
  });

  completedProjects.forEach(item => {
    if (normalizeEmail(item.workerEmail) === oldNormalized) item.workerEmail = newNormalized;
    if (normalizeEmail(item.ownerEmail) === oldNormalized) item.ownerEmail = newNormalized;
  });

  portfolioItems.forEach(item => {
    if (normalizeEmail(item.ownerEmail) === oldNormalized) item.ownerEmail = newNormalized;
  });

  reports.forEach(item => {
    if (normalizeEmail(item.reporterEmail) === oldNormalized) item.reporterEmail = newNormalized;
    if (normalizeEmail(item.targetEmail) === oldNormalized) item.targetEmail = newNormalized;
  });
}

/* =========================
   PAGE ROUTES
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/account-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "account.html"));
});

app.get("/jobs-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "jobs.html"));
});

app.get("/job/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "job-details.html"));
});

app.get("/favorites-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favorites.html"));
});

app.get("/my-jobs-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-jobs.html"));
});

app.get("/applications-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "applications.html"));
});

app.get("/inbox-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "inbox.html"));
});

app.get("/notifications-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "notifications.html"));
});

app.get("/feed-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "feed.html"));
});

app.get("/profile/:email", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/my-notes-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-notes.html"));
});

app.get("/admin-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* =========================
   AUTH
========================= */
app.post("/register", upload.single("profileImage"), (req, res) => {
  const {
    name,
    email,
    password,
    role,
    description,
    phone,
    showPhone,
    workCities,
    workingHours,
    services,
    coverImage,
    website,
    facebook,
    instagram,
    youtube,
    videoUrl,
    faq
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Попълни всички задължителни полета." });
  }

  const normalizedEmail = normalizeEmail(email);

  if (users.some(u => normalizeEmail(u.email) === normalizedEmail)) {
    return res.status(400).json({ message: "Имейлът вече съществува." });
  }

  const newUser = {
    id: getNextId(users),
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: normalizedEmail === normalizeEmail(ADMIN_EMAIL) ? "admin" : (role || "personal"),
    description: description || "",
    profileImage: req.file ? `/uploads/${req.file.filename}` : "",
    coverImage: coverImage || "",
    showPhone: showPhone === "true" || showPhone === true,
    phone: phone || "",
    workCities: workCities || "",
    workingHours: workingHours || "",
    services: services || "",
    website: website || "",
    facebook: facebook || "",
    instagram: instagram || "",
    youtube: youtube || "",
    videoUrl: videoUrl || "",
    faq: faq || "",
    isBlocked: false
  };

  users.push(newUser);

  res.json({
    message: "Регистрация успешна ✅",
    user: publicUser(newUser)
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u =>
      normalizeEmail(u.email) === normalizeEmail(email) &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Невалидни данни." });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Профилът е блокиран." });
  }

  res.json({
    message: "Вход успешен ✅",
    user: publicUser(user)
  });
});

/* =========================
   PROFILE
========================= */
app.get("/api/profile/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const user = users.find(u => normalizeEmail(u.email) === email);

  const userPosts = posts.filter(p => normalizeEmail(p.authorEmail) === email);
  const userJobs = jobs.filter(j => normalizeEmail(j.ownerEmail) === email);
  const userPortfolio = portfolioItems.filter(p => normalizeEmail(p.ownerEmail) === email);
  const userCompletedProjects = completedProjects.filter(c => normalizeEmail(c.workerEmail) === email);

  res.json({
    user: user
      ? publicUser(user)
      : {
          name: "Потребител",
          email,
          role: "personal",
          description: "",
          profileImage: "",
          coverImage: "",
          showPhone: false,
          phone: "",
          workCities: "",
          workingHours: "",
          services: "",
          website: "",
          facebook: "",
          instagram: "",
          youtube: "",
          videoUrl: "",
          faq: "",
          isBlocked: false
        },
    posts: userPosts,
    jobs: userJobs,
    portfolio: userPortfolio,
    completedProjects: userCompletedProjects,
    reviews: [],
    rating: { average: 0, count: 0 }
  });
});

app.put(
  "/api/profile/:email",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImageFile", maxCount: 1 }
  ]),
  (req, res) => {
    const currentEmail = normalizeEmail(decodeURIComponent(req.params.email));
    const user = users.find(u => normalizeEmail(u.email) === currentEmail);

    if (!user) {
      return res.status(404).json({ message: "Потребителят не е намерен." });
    }

    const {
      name,
      email,
      description,
      phone,
      showPhone,
      coverImage,
      workCities,
      workingHours,
      services,
      website,
      facebook,
      instagram,
      youtube,
      videoUrl,
      faq
    } = req.body;

    const newEmail = email ? normalizeEmail(email) : currentEmail;

    if (newEmail !== currentEmail) {
      const exists = users.find(u => normalizeEmail(u.email) === newEmail);
      if (exists) {
        return res.status(400).json({ message: "Имейлът вече се използва." });
      }
      updateEmailAcrossCollections(currentEmail, newEmail);
    }

    user.name = name || user.name;
    user.email = newEmail;
    user.description = description || "";
    user.phone = phone || "";
    user.showPhone = showPhone === "true" || showPhone === true;
    user.workCities = workCities || "";
    user.workingHours = workingHours || "";
    user.services = services || "";
    user.website = website || "";
    user.facebook = facebook || "";
    user.instagram = instagram || "";
    user.youtube = youtube || "";
    user.videoUrl = videoUrl || "";
    user.faq = faq || "";

    if (req.files?.profileImage?.[0]) {
      user.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.coverImageFile?.[0]) {
      user.coverImage = `/uploads/${req.files.coverImageFile[0].filename}`;
    } else {
      user.coverImage = coverImage || user.coverImage || "";
    }

    res.json({
      message: "Профилът е обновен ✅",
      user: publicUser(user)
    });
  }
);

/* =========================
   JOBS
========================= */
app.get("/jobs", (req, res) => {
  const visibleJobs = jobs.filter(job => !job.isHidden);
  res.json(sortJobsForMarketplace([...visibleJobs]));
});

app.get("/my-jobs/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const items = jobs.filter(job => normalizeEmail(job.ownerEmail) === email);
  res.json(sortJobsForMarketplace([...items]));
});

app.post(
  "/jobs",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 8 }
  ]),
  (req, res) => {
    const {
      title,
      description,
      city,
      budget,
      category,
      subcategory,
      ownerEmail,
      type
    } = req.body;

    if (!title || !description || !city || !category || !ownerEmail) {
      return res.status(400).json({ message: "Попълни всички задължителни полета." });
    }

    const imageFile = req.files?.image?.[0] || null;
    const galleryFiles = req.files?.gallery || [];

    const newJob = {
      id: getNextId(jobs),
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      budget: budget ? Number(budget) : 0,
      category: category.trim(),
      subcategory: subcategory || "",
      ownerEmail: normalizeEmail(ownerEmail),
      type: type || "job",
      imageUrl: imageFile ? `/uploads/${imageFile.filename}` : "",
      gallery: galleryFiles.map(file => `/uploads/${file.filename}`),
      isPromoted: false,
      promotedUntil: null,
      isHidden: false,
      createdAt: new Date().toLocaleString("bg-BG")
    };

    jobs.push(newJob);

    res.json({
      message: "Обявата е публикувана ✅",
      job: newJob
    });
  }
);

app.get("/api/jobs/:id", (req, res) => {
  const jobId = Number(req.params.id);
  const job = jobs.find(j => Number(j.id) === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  const owner = users.find(u => normalizeEmail(u.email) === normalizeEmail(job.ownerEmail));

  const related = sortJobsForMarketplace(
    jobs.filter(j =>
      Number(j.id) !== jobId &&
      !j.isHidden &&
      j.category === job.category
    ).slice()
  ).slice(0, 4);

  res.json({
    job,
    owner: owner ? publicUser(owner) : null,
    related
  });
});

app.put(
  "/api/jobs/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 8 }
  ]),
  (req, res) => {
    const jobId = Number(req.params.id);
    const job = jobs.find(j => Number(j.id) === jobId);

    if (!job) {
      return res.status(404).json({ message: "Обявата не е намерена." });
    }

    const {
      requesterEmail,
      title,
      description,
      city,
      budget,
      category,
      subcategory,
      type
    } = req.body;

    if (normalizeEmail(requesterEmail) !== normalizeEmail(job.ownerEmail)) {
      return res.status(403).json({ message: "Нямаш право да редактираш тази обява." });
    }

    job.title = title || job.title;
    job.description = description || job.description;
    job.city = city || job.city;
    job.budget = budget ? Number(budget) : 0;
    job.category = category || job.category;
    job.subcategory = subcategory || "";
    job.type = type || job.type;

    const imageFile = req.files?.image?.[0] || null;
    const galleryFiles = req.files?.gallery || [];

    if (imageFile) {
      job.imageUrl = `/uploads/${imageFile.filename}`;
    }

    if (galleryFiles.length) {
      job.gallery = galleryFiles.map(file => `/uploads/${file.filename}`);
    }

    res.json({
      message: "Обявата е обновена ✅",
      job
    });
  }
);

app.delete("/api/jobs/:id", (req, res) => {
  const jobId = Number(req.params.id);
  const requesterEmail = normalizeEmail(req.query.email || "");

  const job = jobs.find(j => Number(j.id) === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (normalizeEmail(job.ownerEmail) !== requesterEmail) {
    return res.status(403).json({ message: "Нямаш право да изтриеш тази обява." });
  }

  jobs = jobs.filter(j => Number(j.id) !== jobId);
  applications = applications.filter(a => Number(a.jobId) !== jobId);
  favorites = favorites.filter(f => Number(f.jobId) !== jobId);
  completedProjects = completedProjects.filter(c => Number(c.jobId) !== jobId);

  res.json({ message: "Обявата е изтрита ✅" });
});

app.get("/jobs/recommended/:email", (req, res) => {
  const email = normalizeEmail(req.params.email);
  const user = users.find(u => normalizeEmail(u.email) === email);

  if (!user) return res.json([]);

  const skills = String(user.services || "")
    .toLowerCase()
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const cityText = String(user.workCities || "").toLowerCase();
  const professionText = String(user.role || "").toLowerCase();

  const scored = jobs
    .filter(job => !job.isHidden)
    .map(job => {
      let aiScore = 0;
      const aiReasons = [];

      if (cityText && String(job.city || "").toLowerCase().includes(cityText)) {
        aiScore += 20;
        aiReasons.push("В твоя град");
      }

      if (
        professionText &&
        String(job.category || "").toLowerCase().includes(professionText)
      ) {
        aiScore += 15;
        aiReasons.push("Съвпада по профил");
      }

      if (
        skills.some(skill =>
          String(job.subcategory || "").toLowerCase().includes(skill) ||
          String(job.description || "").toLowerCase().includes(skill)
        )
      ) {
        aiScore += 30;
        aiReasons.push("Съвпада с умения");
      }

      if (job.budget) {
        aiScore += 5;
      }

      return { ...job, aiScore, aiReasons };
    })
    .filter(job => job.aiScore > 0)
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 6);

  res.json(scored);
});

/* =========================
   BOOST
========================= */
app.get("/api/boost-plans", (req, res) => {
  res.json(Object.values(BOOST_PLANS));
});

app.post("/api/jobs/:id/boost", (req, res) => {
  const jobId = Number(req.params.id);
  const { requesterEmail, days } = req.body;

  const job = jobs.find(j => Number(j.id) === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (normalizeEmail(requesterEmail) !== normalizeEmail(job.ownerEmail)) {
    return res.status(403).json({ message: "Нямаш право да boost-неш тази обява." });
  }

  const plan = getBoostPlan(days);
  if (!plan) {
    return res.status(400).json({ message: "Невалиден пакет." });
  }

  const now = new Date();
  const baseDate =
    job.promotedUntil && new Date(job.promotedUntil) > now
      ? new Date(job.promotedUntil)
      : now;

  const nextExpire = new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

  job.isPromoted = true;
  job.promotedUntil = nextExpire.toISOString();

  res.json({
    message: `Обявата е промотирана за ${plan.days} дни ⭐`,
    job
  });
});

/* =========================
   FAVORITES
========================= */
app.get("/favorites/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const items = favorites
    .filter(f => normalizeEmail(f.userEmail) === email)
    .map(f => jobs.find(j => Number(j.id) === Number(f.jobId)))
    .filter(Boolean);

  res.json(items);
});

app.get("/favorites/check", (req, res) => {
  const email = normalizeEmail(req.query.email || "");
  const jobId = Number(req.query.jobId);

  const isFavorite = favorites.some(
    f => normalizeEmail(f.userEmail) === email && Number(f.jobId) === jobId
  );

  res.json({ isFavorite });
});

app.post("/favorites/toggle", (req, res) => {
  const { userEmail, jobId } = req.body;

  if (!userEmail || !jobId) {
    return res.status(400).json({ message: "Липсват данни." });
  }

  const index = favorites.findIndex(
    f =>
      normalizeEmail(f.userEmail) === normalizeEmail(userEmail) &&
      Number(f.jobId) === Number(jobId)
  );

  if (index >= 0) {
    favorites.splice(index, 1);
    return res.json({
      isFavorite: false,
      message: "Премахнато от любими 💔"
    });
  }

  favorites.push({
    id: getNextId(favorites),
    userEmail: normalizeEmail(userEmail),
    jobId: Number(jobId),
    createdAt: new Date().toLocaleString("bg-BG")
  });

  res.json({
    isFavorite: true,
    message: "Добавено в любими ❤️"
  });
});

/* =========================
   MESSAGES / INBOX
========================= */
app.post("/messages/contact", (req, res) => {
  const {
    jobId,
    senderEmail,
    senderName,
    receiverEmail,
    subject,
    text
  } = req.body;

  if (!jobId || !senderEmail || !receiverEmail || !text) {
    return res.status(400).json({ message: "Липсват данни за съобщението." });
  }

  const message = {
    id: getNextId(inboxMessages),
    jobId: Number(jobId),
    senderEmail: normalizeEmail(senderEmail),
    senderName: senderName || "Потребител",
    receiverEmail: normalizeEmail(receiverEmail),
    subject: subject || "Ново съобщение",
    text,
    isRead: false,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  inboxMessages.unshift(message);

  createNotification({
    userEmail: receiverEmail,
    type: "message_new",
    title: "Ново съобщение",
    text: `${message.senderName} ти изпрати съобщение.`,
    link: "/inbox-page"
  });

  res.json({ message: "Изпратено ✅", inboxMessage: message });
});

app.get("/messages/inbox/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const items = inboxMessages.filter(
    msg => normalizeEmail(msg.receiverEmail) === email
  );

  res.json(items);
});

app.get("/messages/sent/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const items = inboxMessages.filter(
    msg => normalizeEmail(msg.senderEmail) === email
  );

  res.json(items);
});

app.put("/messages/:id/read", (req, res) => {
  const messageId = Number(req.params.id);
  const { requesterEmail } = req.body;

  const message = inboxMessages.find(m => Number(m.id) === messageId);

  if (!message) {
    return res.status(404).json({ message: "Съобщението не е намерено." });
  }

  if (normalizeEmail(requesterEmail) !== normalizeEmail(message.receiverEmail)) {
    return res.status(403).json({ message: "Нямаш право." });
  }

  message.isRead = true;

  res.json({
    message: "Съобщението е маркирано като прочетено ✅",
    inboxMessage: message
  });
});

/* =========================
   APPLICATIONS
========================= */
app.post("/apply", upload.single("cvFile"), (req, res) => {
  const { jobId, name, email, message } = req.body;

  if (!jobId || !name || !message) {
    return res.status(400).json({ message: "Попълни всички задължителни полета." });
  }

  const job = jobs.find(j => Number(j.id) === Number(jobId));

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  const alreadyApplied = applications.find(
    a =>
      Number(a.jobId) === Number(jobId) &&
      normalizeEmail(a.email) === normalizeEmail(email)
  );

  if (alreadyApplied) {
    return res.status(400).json({ message: "Вече си кандидатствал." });
  }

  const appItem = {
    id: getNextId(applications),
    jobId: Number(jobId),
    name,
    email: normalizeEmail(email),
    message,
    cvUrl: req.file ? `/uploads/${req.file.filename}` : "",
    status: "Чака одобрение",
    createdAt: new Date().toLocaleString("bg-BG")
  };

  applications.push(appItem);

  createNotification({
    userEmail: job.ownerEmail,
    type: "application_new",
    title: "Нова кандидатура",
    text: `${name} кандидатства по "${job.title}".`,
    link: "/applications-page"
  });

  res.json({
    message: "Кандидатурата е изпратена ✅",
    application: appItem
  });
});

app.get("/applications/:jobId", (req, res) => {
  const jobId = Number(req.params.jobId);
  const requesterEmail = normalizeEmail(req.query.email || "");

  const job = jobs.find(j => Number(j.id) === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (normalizeEmail(job.ownerEmail) !== requesterEmail) {
    return res.status(403).json({ message: "Нямаш право да виждаш кандидатурите." });
  }

  res.json(applications.filter(a => Number(a.jobId) === jobId));
});

app.get("/my-applications/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const items = applications
    .filter(a => normalizeEmail(a.email) === email)
    .map(a => {
      const job = jobs.find(j => Number(j.id) === Number(a.jobId));
      return {
        ...a,
        jobTitle: job?.title || "Неизвестна обява",
        jobCity: job?.city || "",
        jobCategory: job?.category || "",
        jobSubcategory: job?.subcategory || "",
        jobType: job?.type || "job"
      };
    });

  res.json(items);
});

app.put("/applications/:applicationId/status", (req, res) => {
  const applicationId = Number(req.params.applicationId);
  const { requesterEmail, status } = req.body;

  const appItem = applications.find(a => Number(a.id) === applicationId);

  if (!appItem) {
    return res.status(404).json({ message: "Кандидатурата не е намерена." });
  }

  const job = jobs.find(j => Number(j.id) === Number(appItem.jobId));

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (normalizeEmail(requesterEmail) !== normalizeEmail(job.ownerEmail)) {
    return res.status(403).json({ message: "Нямаш право." });
  }

  appItem.status = status || appItem.status;

  createNotification({
    userEmail: appItem.email,
    type: "application_status",
    title: "Промяна по кандидатура",
    text: `Кандидатурата ти по "${job.title}" е със статус: ${appItem.status}.`,
    link: `/job/${job.id}`
  });

  res.json({
    message: "Статусът е обновен ✅",
    application: appItem
  });
});

/* =========================
   NOTIFICATIONS
========================= */
app.get("/notifications/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  res.json(notifications.filter(n => normalizeEmail(n.userEmail) === email));
});

app.get("/notifications/unread-count/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const unreadCount = notifications.filter(
    n => normalizeEmail(n.userEmail) === email && !n.isRead
  ).length;

  res.json({ unreadCount });
});

app.get("/notifications/latest/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const limit = Number(req.query.limit || 3);

  const items = notifications
    .filter(n => normalizeEmail(n.userEmail) === email && !n.isRead)
    .slice(0, limit);

  res.json(items);
});

app.put("/notifications/:id/read", (req, res) => {
  const notificationId = Number(req.params.id);
  const { requesterEmail } = req.body;

  const item = notifications.find(n => Number(n.id) === notificationId);

  if (!item) {
    return res.status(404).json({ message: "Известието не е намерено." });
  }

  if (normalizeEmail(requesterEmail) !== normalizeEmail(item.userEmail)) {
    return res.status(403).json({ message: "Нямаш право." });
  }

  item.isRead = true;
  res.json({ message: "Известието е прочетено ✅", notification: item });
});

app.put("/notifications/read-all/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  notifications.forEach(item => {
    if (normalizeEmail(item.userEmail) === email) {
      item.isRead = true;
    }
  });

  res.json({ message: "Всички известия са маркирани като прочетени ✅" });
});

/* =========================
   POSTS / FEED
========================= */
app.get("/posts", (req, res) => {
  res.json(posts);
});

app.post("/posts", upload.single("image"), (req, res) => {
  const { authorName, authorEmail, text } = req.body;

  if (!authorName || !text) {
    return res.status(400).json({ message: "Липсват данни за публикацията." });
  }

  const post = {
    id: getNextId(posts),
    authorName,
    authorEmail: normalizeEmail(authorEmail || ""),
    text,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toLocaleString("bg-BG")
  };

  posts.unshift(post);

  res.json({
    message: "Публикацията е създадена ✅",
    post
  });
});

app.post("/posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);
  const { userEmail } = req.body;

  const post = posts.find(p => Number(p.id) === postId);
  if (!post) {
    return res.status(404).json({ message: "Публикацията не е намерена." });
  }

  const normalized = normalizeEmail(userEmail);
  const alreadyLiked = post.likedBy.includes(normalized);

  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(x => x !== normalized);
  } else {
    post.likedBy.push(normalized);
  }

  post.likes = post.likedBy.length;

  res.json({
    message: alreadyLiked ? "Лайкът е премахнат 💔" : "Публикацията е харесана ❤️",
    likes: post.likes,
    liked: !alreadyLiked
  });
});

app.post("/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const { authorName, authorEmail, text } = req.body;

  const post = posts.find(p => Number(p.id) === postId);
  if (!post) {
    return res.status(404).json({ message: "Публикацията не е намерена." });
  }

  const comment = {
    id: getNextId(post.comments),
    authorName,
    authorEmail: normalizeEmail(authorEmail),
    text,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  post.comments.push(comment);

  res.status(201).json({
    message: "Коментарът е добавен ✅",
    comment
  });
});

/* =========================
   COMPLETED PROJECTS
========================= */
app.post("/completed-projects", (req, res) => {
  const { requesterEmail, jobId, workerEmail, workerName } = req.body;

  const job = jobs.find(j => Number(j.id) === Number(jobId));
  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (normalizeEmail(requesterEmail) !== normalizeEmail(job.ownerEmail)) {
    return res.status(403).json({ message: "Нямаш право." });
  }

  const item = {
    id: getNextId(completedProjects),
    jobId: Number(jobId),
    workerEmail: normalizeEmail(workerEmail),
    workerName: workerName || "Потребител",
    ownerEmail: normalizeEmail(requesterEmail),
    jobTitle: job.title,
    category: job.category,
    subcategory: job.subcategory || "",
    city: job.city,
    completedAt: new Date().toLocaleString("bg-BG")
  };

  completedProjects.unshift(item);

  createNotification({
    userEmail: workerEmail,
    type: "project_completed",
    title: "Завършен проект",
    text: `Проектът "${job.title}" е маркиран като завършен.`,
    link: `/profile/${encodeURIComponent(workerEmail)}`
  });

  res.json({
    message: "Проектът е маркиран като завършен ✅",
    completedProject: item
  });
});

app.get("/completed-projects/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  res.json(completedProjects.filter(c => normalizeEmail(c.workerEmail) === email));
});

app.get("/completed-projects/check", (req, res) => {
  const jobId = Number(req.query.jobId);
  const workerEmail = normalizeEmail(req.query.workerEmail || "");

  const exists = completedProjects.some(
    c => Number(c.jobId) === jobId && normalizeEmail(c.workerEmail) === workerEmail
  );

  res.json({ exists });
});

/* =========================
   PORTFOLIO
========================= */
app.post("/portfolio", upload.single("image"), (req, res) => {
  const { ownerEmail, title, description, link } = req.body;

  if (!ownerEmail || !title) {
    return res.status(400).json({ message: "Липсват данни." });
  }

  const item = {
    id: getNextId(portfolioItems),
    ownerEmail: normalizeEmail(ownerEmail),
    title,
    description: description || "",
    link: link || "",
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    createdAt: new Date().toLocaleString("bg-BG")
  };

  portfolioItems.unshift(item);

  res.json({
    message: "Портфолиото е добавено ✅",
    item
  });
});

app.get("/portfolio/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  res.json(portfolioItems.filter(p => normalizeEmail(p.ownerEmail) === email));
});

app.delete("/portfolio/:id", (req, res) => {
  const portfolioId = Number(req.params.id);
  const requesterEmail = normalizeEmail(req.query.email || "");

  const item = portfolioItems.find(p => Number(p.id) === portfolioId);
  if (!item) {
    return res.status(404).json({ message: "Елементът не е намерен." });
  }

  if (normalizeEmail(item.ownerEmail) !== requesterEmail) {
    return res.status(403).json({ message: "Нямаш право." });
  }

  portfolioItems = portfolioItems.filter(p => Number(p.id) !== portfolioId);

  res.json({ message: "Елементът е изтрит ✅" });
});

/* =========================
   REPORTS
========================= */
app.post("/reports", (req, res) => {
  const {
    reporterEmail,
    targetType,
    targetId,
    targetEmail,
    reason
  } = req.body;

  if (!reporterEmail || !targetType || !reason) {
    return res.status(400).json({ message: "Липсват данни за доклада." });
  }

  const report = {
    id: getNextId(reports),
    reporterEmail: normalizeEmail(reporterEmail),
    targetType: targetType || "general",
    targetId: targetId || "",
    targetEmail: targetEmail ? normalizeEmail(targetEmail) : "",
    reason: reason || "",
    status: "pending",
    createdAt: new Date().toLocaleString("bg-BG")
  };

  reports.unshift(report);

  res.json({
    message: "Докладът е изпратен ✅",
    report
  });
});

/* =========================
   ADMIN STATS
========================= */
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  res.json({
    jobs: jobs.length,
    applications: applications.length,
    activeProfiles: users.filter(u => !u.isBlocked).length,
    posts: posts.length,
    pendingReports: reports.filter(r => r.status === "pending").length,
    ads: ads.length
  });
});

/* =========================
   ADMIN JOBS
========================= */
app.get("/api/admin/jobs", requireAdmin, (req, res) => {
  res.json({ jobs });
});

app.put("/api/admin/jobs/:id/toggle-visibility", requireAdmin, (req, res) => {
  const job = jobs.find(j => Number(j.id) === Number(req.params.id));

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  job.isHidden = !job.isHidden;

  res.json({
    message: job.isHidden ? "Обявата е скрита ✅" : "Обявата е показана ✅",
    job
  });
});

app.delete("/api/admin/jobs/:id", requireAdmin, (req, res) => {
  const jobId = Number(req.params.id);

  const exists = jobs.some(j => Number(j.id) === jobId);
  if (!exists) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  jobs = jobs.filter(j => Number(j.id) !== jobId);
  favorites = favorites.filter(f => Number(f.jobId) !== jobId);
  applications = applications.filter(a => Number(a.jobId) !== jobId);
  completedProjects = completedProjects.filter(c => Number(c.jobId) !== jobId);

  res.json({ message: "Обявата е изтрита ✅" });
});

app.put("/api/admin/jobs/bulk-hide", requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : [];

  jobs.forEach(job => {
    if (ids.includes(Number(job.id))) {
      job.isHidden = true;
    }
  });

  res.json({ message: "Избраните обяви са скрити ✅" });
});

app.delete("/api/admin/jobs/bulk-delete", requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : [];

  jobs = jobs.filter(j => !ids.includes(Number(j.id)));
  favorites = favorites.filter(f => !ids.includes(Number(f.jobId)));
  applications = applications.filter(a => !ids.includes(Number(a.jobId)));
  completedProjects = completedProjects.filter(c => !ids.includes(Number(c.jobId)));

  res.json({ message: "Избраните обяви са изтрити ✅" });
});

/* =========================
   ADMIN USERS
========================= */
app.get("/api/admin/users", requireAdmin, (req, res) => {
  res.json({ users: users.map(publicUser) });
});

app.put("/api/admin/users/:email/toggle-block", requireAdmin, (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const user = users.find(u => normalizeEmail(u.email) === email);

  if (!user) {
    return res.status(404).json({ message: "Потребителят не е намерен." });
  }

  if (isAdminEmail(user.email)) {
    return res.status(400).json({ message: "Админ профилът не може да бъде блокиран." });
  }

  user.isBlocked = !user.isBlocked;

  res.json({
    message: user.isBlocked ? "Профилът е блокиран ✅" : "Профилът е отблокиран ✅",
    user: publicUser(user)
  });
});

/* =========================
   ADMIN POSTS
========================= */
app.get("/api/admin/posts", requireAdmin, (req, res) => {
  res.json({ posts });
});

app.delete("/api/admin/posts/:id", requireAdmin, (req, res) => {
  const postId = Number(req.params.id);
  const exists = posts.some(p => Number(p.id) === postId);

  if (!exists) {
    return res.status(404).json({ message: "Публикацията не е намерена." });
  }

  posts = posts.filter(p => Number(p.id) !== postId);

  res.json({ message: "Публикацията е изтрита ✅" });
});

/* =========================
   ADMIN REPORTS
========================= */
app.get("/api/admin/reports", requireAdmin, (req, res) => {
  res.json({ reports });
});

app.put("/api/admin/reports/:id/resolve", requireAdmin, (req, res) => {
  const report = reports.find(r => Number(r.id) === Number(req.params.id));

  if (!report) {
    return res.status(404).json({ message: "Докладът не е намерен." });
  }

  report.status = "resolved";

  res.json({
    message: "Докладът е маркиран като решен ✅",
    report
  });
});

/* =========================
   ADMIN ADS
========================= */
app.get("/api/admin/ads", requireAdmin, (req, res) => {
  res.json({ ads });
});

app.post("/api/admin/ads", upload.single("image"), (req, res) => {
  const requesterEmail = String(
    req.body?.requesterEmail ||
    req.headers["x-admin-email"] ||
    req.query?.requesterEmail ||
    ""
  ).trim().toLowerCase();

  console.log("CREATE AD requesterEmail:", requesterEmail);
  console.log("CREATE AD body:", req.body);

  if (requesterEmail !== "admin@tursimajstor.bg") {
    return res.status(403).json({ message: "Нямаш достъп." });
  }

  const { title, text, link, type } = req.body;

  if (!title || !text) {
    return res.status(400).json({
      message: "Заглавието и текстът са задължителни."
    });
  }

  const ad = {
    id: getNextId(ads),
    title: title.trim(),
    text: text.trim(),
    link: link ? link.trim() : "",
    type: type || "primary",
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    isActive: true,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  ads.unshift(ad);

  res.json({
    message: "Рекламата е създадена ✅",
    ad
  });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});