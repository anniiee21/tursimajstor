const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"), { index: false }));

/* =========================
   FILE UPLOADS
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
    const safeName = String(file.originalname || "file").replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

/* =========================
   IN-MEMORY DATABASE
========================= */
const BOOST_PLANS = {
  3: { days: 3, price: 9, name: "Mini Boost" },
  7: { days: 7, price: 19, name: "Standard Boost" },
  30: { days: 30, price: 49, name: "Power Boost" }
};

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
    isApproved: true,
    isHidden: false,
    adminNote: ""
  },
  {
    id: 2,
    title: "Боядисване на стена",
    description: "Предлагам боядисване на стени, тавани и освежителни ремонти.",
    city: "София",
    budget: 300,
    category: "Строителство",
    subcategory: "Боядисване",
    ownerEmail: "worker@example.com",
    type: "service",
    imageUrl: "",
    gallery: [],
    isPromoted: false,
    promotedUntil: null,
    isApproved: true,
    isHidden: false,
    adminNote: ""
  }
];

let applications = [];
let users = [
  {
    id: 1,
    name: "Админ",
    email: "admin@tursimajstor.bg",
    password: "admin123",
    role: "admin",
    description: "Системен администратор",
    phone: "",
    showPhone: false,
    profileImage: "",
    contactName: "",
    companyId: "",
    manager: "",
    profession: "",
    coverImage: "",
    services: "",
    workCities: "",
    workingHours: "",
    website: "",
    facebook: "",
    instagram: "",
    youtube: "",
    videoUrl: "",
    faq: ""
  },
  {
    id: 2,
    name: "Client Example",
    email: "client@example.com",
    password: "123456",
    role: "personal",
    description: "Примерен клиент",
    phone: "",
    showPhone: false,
    profileImage: "",
    contactName: "",
    companyId: "",
    manager: "",
    profession: "Строителство",
    coverImage: "",
    services: "",
    workCities: "Плевен",
    workingHours: "",
    website: "",
    facebook: "",
    instagram: "",
    youtube: "",
    videoUrl: "",
    faq: ""
  },
  {
    id: 3,
    name: "Worker Example",
    email: "worker@example.com",
    password: "123456",
    role: "freelancer",
    description: "Предлагам ремонти и боядисване.",
    phone: "",
    showPhone: false,
    profileImage: "",
    contactName: "",
    companyId: "",
    manager: "",
    profession: "Строителство",
    coverImage: "",
    services: "Боядисване, Шпакловка",
    workCities: "София",
    workingHours: "",
    website: "",
    facebook: "",
    instagram: "",
    youtube: "",
    videoUrl: "",
    faq: ""
  }
];
let posts = [];
let inboxMessages = [];
let notifications = [];
let favorites = [];
let reviews = [];
let completedProjects = [];
let portfolioItems = [];
let reports = [];
let banners = [
  {
    id: 1,
    title: "Промотирай бизнеса си",
    text: "Покажи услугите си пред повече клиенти с premium обява.",
    buttonText: "Разгледай",
    buttonHref: "/jobs-page",
    placement: "job-details-sidebar",
    isActive: true,
    createdAt: new Date().toLocaleString("bg-BG")
  }
];

/* =========================
   HELPERS
========================= */
function getNextId(collection) {
  if (!Array.isArray(collection) || !collection.length) return 1;
  return Math.max(...collection.map(item => Number(item.id) || 0)) + 1;
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
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

function getRatingSummaryByEmail(userEmail) {
  const normalized = normalizeEmail(userEmail);
  const userReviews = reviews.filter(r => normalizeEmail(r.workerEmail) === normalized);

  if (!userReviews.length) {
    return {
      average: 0,
      count: 0
    };
  }

  const average =
    userReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
    userReviews.length;

  return {
    average: Number(average.toFixed(1)),
    count: userReviews.length
  };
}

function isJobPromoted(job) {
  return !!(
    job &&
    job.isPromoted &&
    job.promotedUntil &&
    new Date(job.promotedUntil) > new Date()
  );
}

function normalizeJobPromotion(job) {
  if (!job) return job;

  if (job.isPromoted && job.promotedUntil && new Date(job.promotedUntil) <= new Date()) {
    job.isPromoted = false;
    job.promotedUntil = null;
  }

  return job;
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

function getBoostPlan(days) {
  return BOOST_PLANS[Number(days)] || null;
}

function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    description: user.description || "",
    phone: user.phone || "",
    showPhone: !!user.showPhone,
    profileImage: user.profileImage || "",
    contactName: user.contactName || "",
    companyId: user.companyId || "",
    manager: user.manager || "",
    profession: user.profession || "",
    coverImage: user.coverImage || "",
    services: user.services || "",
    workCities: user.workCities || "",
    workingHours: user.workingHours || "",
    website: user.website || "",
    facebook: user.facebook || "",
    instagram: user.instagram || "",
    youtube: user.youtube || "",
    videoUrl: user.videoUrl || "",
    faq: user.faq || ""
  };
}

function updateEmailAcrossCollections(oldEmail, newEmail) {
  const oldNormalized = normalizeEmail(oldEmail);
  const newNormalized = normalizeEmail(newEmail);

  users.forEach(user => {
    if (normalizeEmail(user.email) === oldNormalized) {
      user.email = newNormalized;
    }
  });

  jobs.forEach(job => {
    if (normalizeEmail(job.ownerEmail) === oldNormalized) {
      job.ownerEmail = newNormalized;
    }
  });

  posts.forEach(post => {
    if (normalizeEmail(post.authorEmail) === oldNormalized) {
      post.authorEmail = newNormalized;
    }
  });

  applications.forEach(app => {
    if (normalizeEmail(app.email) === oldNormalized) {
      app.email = newNormalized;
    }
  });

  inboxMessages.forEach(msg => {
    if (normalizeEmail(msg.senderEmail) === oldNormalized) {
      msg.senderEmail = newNormalized;
    }
    if (normalizeEmail(msg.receiverEmail) === oldNormalized) {
      msg.receiverEmail = newNormalized;
    }
  });

  notifications.forEach(item => {
    if (normalizeEmail(item.userEmail) === oldNormalized) {
      item.userEmail = newNormalized;
    }
  });

  favorites.forEach(item => {
    if (normalizeEmail(item.userEmail) === oldNormalized) {
      item.userEmail = newNormalized;
    }
  });

  reviews.forEach(item => {
    if (normalizeEmail(item.workerEmail) === oldNormalized) {
      item.workerEmail = newNormalized;
    }
    if (normalizeEmail(item.reviewerEmail) === oldNormalized) {
      item.reviewerEmail = newNormalized;
    }
  });

  completedProjects.forEach(item => {
    if (normalizeEmail(item.workerEmail) === oldNormalized) {
      item.workerEmail = newNormalized;
    }
    if (normalizeEmail(item.ownerEmail) === oldNormalized) {
      item.ownerEmail = newNormalized;
    }
  });

  portfolioItems.forEach(item => {
    if (normalizeEmail(item.ownerEmail) === oldNormalized) {
      item.ownerEmail = newNormalized;
    }
  });

  reports.forEach(item => {
    if (normalizeEmail(item.reporterEmail) === oldNormalized) {
      item.reporterEmail = newNormalized;
    }
    if (normalizeEmail(item.targetEmail) === oldNormalized) {
      item.targetEmail = newNormalized;
    }
  });
}

function isAdminEmail(email = "") {
  return users.some(
    user => normalizeEmail(user.email) === normalizeEmail(email) && user.role === "admin"
  );
}

function getRequesterEmail(req) {
  return normalizeEmail(
    req.body?.requesterEmail ||
    req.query?.requesterEmail ||
    req.headers["x-requester-email"] ||
    ""
  );
}

function requireAdmin(req, res) {
  const requesterEmail = getRequesterEmail(req);

  if (!requesterEmail || !isAdminEmail(requesterEmail)) {
    res.status(403).json({
      message: "Нямаш достъп до admin секцията."
    });
    return null;
  }

  return requesterEmail;
}

function isJobVisibleToPublic(job) {
  if (!job) return false;
  normalizeJobPromotion(job);
  return job.isHidden !== true && job.isApproved !== false;
}

function isPostVisibleToPublic(post) {
  return !!post && post.isHidden !== true;
}

function getReportCountForTarget(targetType, matcher) {
  return reports.filter(
    item => item.targetType === targetType && item.status === "open" && matcher(item)
  ).length;
}

function getPublicBannersByPlacement(placement = "") {
  return banners.filter(item => {
    if (!item.isActive) return false;
    if (placement && item.placement !== placement) return false;
    return true;
  });
}

/* =========================
   PAGES
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/account-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "account.html"));
});

app.get("/applications-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "applications.html"));
});

app.get("/feed-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "feed.html"));
});

app.get("/my-jobs-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-jobs.html"));
});

app.get("/inbox-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "inbox.html"));
});

app.get("/notifications-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "notifications.html"));
});

app.get("/favorites-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favorites.html"));
});

app.get("/profile/:email", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/job/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "job-details.html"));
});

app.get("/jobs-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "jobs.html"));
});

app.get("/my-notes-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "my-notes.html"));
});

app.get("/admin-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* =========================
   JOBS
========================= */
app.get("/jobs", (req, res) => {
  const visibleJobs = jobs.filter(isJobVisibleToPublic);
  const sortedJobs = sortJobsForMarketplace([...visibleJobs]);
  res.json(sortedJobs);
});

app.get("/jobs/recommended/:email", (req, res) => {
  const { email } = req.params;

  try {
    const user = users.find(u => normalizeEmail(u.email) === normalizeEmail(email));

    if (!user) {
      return res.json([]);
    }

    const userCity = (user.workCities || "").toLowerCase();
    const userCategory = (user.profession || "").toLowerCase();
    const userSkills = (user.services || "")
      .toLowerCase()
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const visibleJobs = jobs.filter(isJobVisibleToPublic);

    const scored = visibleJobs.map(job => {
      let score = 0;
      let reasons = [];

      if (job.category && userCategory && job.category.toLowerCase().includes(userCategory)) {
        score += 40;
        reasons.push("Съвпада с твоята професия");
      }

      if (
        userSkills.some(skill =>
          (job.subcategory || "").toLowerCase().includes(skill) ||
          (job.description || "").toLowerCase().includes(skill)
        )
      ) {
        score += 25;
        reasons.push("Съвпада с твои умения");
      }

      if (job.city && userCity && job.city.toLowerCase().includes(userCity)) {
        score += 20;
        reasons.push("В твоя град");
      }

      if (job.budget) {
        score += 5;
      }

      return {
        ...job,
        aiScore: score,
        aiReasons: reasons
      };
    });

    const recommended = scored
      .filter(j => j.aiScore > 20)
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 6);

    res.json(recommended);
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json([]);
  }
});

app.get("/my-jobs/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const myJobs = jobs.filter(job => normalizeEmail(job.ownerEmail) === email);
  res.json(sortJobsForMarketplace([...myJobs]));
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
      return res.status(400).json({
        message: "Попълни всички задължителни полета."
      });
    }

    const imageFile = req.files?.image?.[0] || null;
    const galleryFiles = req.files?.gallery || [];

    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : "";
    const gallery = galleryFiles.map(file => `/uploads/${file.filename}`);

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
      imageUrl,
      gallery,
      isPromoted: false,
      promotedUntil: null,
      isApproved: true,
      isHidden: false,
      adminNote: ""
    };

    jobs.push(newJob);

    res.status(201).json({
      message: "Обявата е създадена успешно ✅",
      job: newJob
    });
  }
);

app.get("/api/jobs/:id", (req, res) => {
  const jobId = Number(req.params.id);
  const requesterEmail = normalizeEmail(req.query.requesterEmail || "");

  if (!Number.isFinite(jobId)) {
    return res.status(400).json({
      message: "Невалидно ID на обявата."
    });
  }

  const job = jobs.find(j => Number(j.id) === jobId);

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  const isOwner = requesterEmail && normalizeEmail(job.ownerEmail) === requesterEmail;
  const isAdmin = requesterEmail && isAdminEmail(requesterEmail);

  if (!isJobVisibleToPublic(job) && !isOwner && !isAdmin) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  normalizeJobPromotion(job);

  const owner =
    users.find(u => normalizeEmail(u.email) === normalizeEmail(job.ownerEmail)) || null;

  const related = sortJobsForMarketplace(
    jobs
      .filter(j => Number(j.id) !== jobId && j.category === job.category)
      .filter(isJobVisibleToPublic)
      .slice()
  ).slice(0, 4);

  res.json({
    job,
    owner: publicUser(owner),
    related,
    banners: {
      sidebar: getPublicBannersByPlacement("job-details-sidebar")
    }
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

    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({
        message: "Обявата не е намерена."
      });
    }

    if (!requesterEmail || normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
      return res.status(403).json({
        message: "Нямаш право да редактираш тази обява."
      });
    }

    if (!title || !description || !city || !category) {
      return res.status(400).json({
        message: "Попълни всички задължителни полета."
      });
    }

    job.title = title.trim();
    job.description = description.trim();
    job.city = city.trim();
    job.budget = budget ? Number(budget) : 0;
    job.category = category.trim();
    job.subcategory = subcategory || "";
    job.type = type || "job";

    const imageFile = req.files?.image?.[0] || null;
    const galleryFiles = req.files?.gallery || [];

    if (imageFile) {
      job.imageUrl = `/uploads/${imageFile.filename}`;
    }

    if (galleryFiles.length > 0) {
      job.gallery = galleryFiles.map(file => `/uploads/${file.filename}`);
    }

    res.json({
      message: "Обявата е обновена успешно ✅",
      job
    });
  }
);

app.delete("/api/jobs/:id", (req, res) => {
  const jobId = Number(req.params.id);
  const requesterEmail = req.query.email;

  const jobIndex = jobs.findIndex(j => j.id === jobId);

  if (jobIndex === -1) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (!requesterEmail || normalizeEmail(jobs[jobIndex].ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({
      message: "Нямаш право да изтриеш тази обява."
    });
  }

  const deletedJob = jobs[jobIndex];
  jobs.splice(jobIndex, 1);

  applications = applications.filter(app => app.jobId !== jobId);
  inboxMessages = inboxMessages.filter(msg => msg.jobId !== jobId);
  favorites = favorites.filter(item => item.jobId !== jobId);
  completedProjects = completedProjects.filter(item => item.jobId !== jobId);
  reports = reports.filter(item => !(item.targetType === "job" && Number(item.targetId) === jobId));

  res.json({
    message: "Обявата е изтрита успешно ✅",
    job: deletedJob
  });
});

/* =========================
   BOOST JOBS
========================= */
app.get("/api/boost-plans", (req, res) => {
  res.json(Object.values(BOOST_PLANS));
});

app.post("/api/jobs/:id/boost", (req, res) => {
  const jobId = Number(req.params.id);
  const { requesterEmail, days } = req.body;

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (!requesterEmail || normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({ message: "Нямаш право да промотираш тази обява." });
  }

  const selectedPlan = getBoostPlan(days);

  if (!selectedPlan) {
    return res.status(400).json({
      message: "Невалиден boost пакет. Избери 3, 7 или 30 дни."
    });
  }

  const now = new Date();
  const currentExpire =
    job.promotedUntil && new Date(job.promotedUntil) > now
      ? new Date(job.promotedUntil)
      : now;

  const newExpire = new Date(
    currentExpire.getTime() + selectedPlan.days * 24 * 60 * 60 * 1000
  );

  job.isPromoted = true;
  job.promotedUntil = newExpire.toISOString();

  res.json({
    message: `Обявата е промотирана за ${selectedPlan.days} дни ⭐`,
    planName: selectedPlan.name,
    price: selectedPlan.price,
    days: selectedPlan.days,
    promotedUntil: job.promotedUntil,
    job
  });
});

app.put("/api/jobs/:id/main-image", (req, res) => {
  const jobId = Number(req.params.id);
  const { requesterEmail, imageUrl } = req.body;

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (!requesterEmail || normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({ message: "Нямаш право да редактираш тази обява." });
  }

  const allImages = [job.imageUrl, ...(job.gallery || [])].filter(Boolean);

  if (!imageUrl || !allImages.includes(imageUrl)) {
    return res.status(400).json({ message: "Снимката не е намерена в тази обява." });
  }

  const oldMain = job.imageUrl;
  const filteredGallery = (job.gallery || []).filter(img => img !== imageUrl);

  if (oldMain && oldMain !== imageUrl) {
    filteredGallery.unshift(oldMain);
  }

  job.imageUrl = imageUrl;
  job.gallery = filteredGallery;

  res.json({
    message: "Основната снимка е сменена успешно ✅",
    job
  });
});

app.delete("/api/jobs/:id/gallery-image", (req, res) => {
  const jobId = Number(req.params.id);
  const { requesterEmail, imageUrl } = req.body;

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (!requesterEmail || normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({ message: "Нямаш право да редактираш тази обява." });
  }

  if (!imageUrl) {
    return res.status(400).json({ message: "Липсва снимка за изтриване." });
  }

  if (job.imageUrl === imageUrl) {
    if (job.gallery && job.gallery.length > 0) {
      job.imageUrl = job.gallery[0];
      job.gallery = job.gallery.slice(1);
    } else {
      job.imageUrl = "";
    }

    return res.json({
      message: "Основната снимка е изтрита успешно ✅",
      job
    });
  }

  const beforeLength = (job.gallery || []).length;
  job.gallery = (job.gallery || []).filter(img => img !== imageUrl);

  if (job.gallery.length === beforeLength) {
    return res.status(404).json({ message: "Снимката не е намерена в галерията." });
  }

  res.json({
    message: "Снимката е изтрита от галерията ✅",
    job
  });
});

app.put("/api/jobs/:id/reorder-gallery", (req, res) => {
  const jobId = Number(req.params.id);
  const { requesterEmail, orderedImages } = req.body;

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (!requesterEmail || normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({ message: "Нямаш право." });
  }

  if (!Array.isArray(orderedImages)) {
    return res.status(400).json({ message: "Невалиден списък." });
  }

  const mainImage = job.imageUrl;
  job.gallery = orderedImages.filter(img => img !== mainImage);

  res.json({
    message: "Редът на снимките е обновен ✅",
    job
  });
});

/* =========================
   FAVORITES
========================= */
app.get("/favorites/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const userFavorites = favorites
    .filter(item => normalizeEmail(item.userEmail) === email)
    .map(item => jobs.find(j => j.id === item.jobId) || null)
    .filter(Boolean)
    .filter(isJobVisibleToPublic);

  res.json(userFavorites);
});

app.get("/favorites/check", (req, res) => {
  const userEmail = req.query.email;
  const jobId = Number(req.query.jobId);

  if (!userEmail || !jobId) {
    return res.status(400).json({
      message: "Липсват данни."
    });
  }

  const exists = favorites.some(
    item => normalizeEmail(item.userEmail) === normalizeEmail(userEmail) && item.jobId === jobId
  );

  res.json({ isFavorite: exists });
});

app.post("/favorites/toggle", (req, res) => {
  const { userEmail, jobId } = req.body;

  if (!userEmail || !jobId) {
    return res.status(400).json({
      message: "Липсват данни."
    });
  }

  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  const existingIndex = favorites.findIndex(
    item => normalizeEmail(item.userEmail) === normalizeEmail(userEmail) && item.jobId === Number(jobId)
  );

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    return res.json({
      message: "Обявата е премахната от любими 💔",
      isFavorite: false
    });
  }

  favorites.push({
    id: getNextId(favorites),
    userEmail: normalizeEmail(userEmail),
    jobId: Number(jobId),
    createdAt: new Date().toLocaleString("bg-BG")
  });

  return res.json({
    message: "Обявата е добавена в любими ❤️",
    isFavorite: true
  });
});

/* =========================
   POSTS / FEED
========================= */
app.get("/posts", (req, res) => {
  const visiblePosts = posts.filter(isPostVisibleToPublic);
  res.json(visiblePosts);
});

app.post("/posts", upload.single("image"), (req, res) => {
  const { authorName, authorEmail, text } = req.body;

  if (!authorName || !text) {
    return res.status(400).json({
      message: "Липсват данни за публикацията."
    });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const newPost = {
    id: getNextId(posts),
    authorName,
    authorEmail: normalizeEmail(authorEmail || ""),
    text,
    imageUrl,
    likes: 0,
    likedBy: [],
    comments: [],
    isHidden: false,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  posts.unshift(newPost);

  res.json({
    message: "Публикацията е създадена ✅",
    post: newPost
  });
});

app.post("/posts/:id/like", (req, res) => {
  const postId = Number(req.params.id);
  const { userEmail } = req.body;

  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({
      message: "Публикацията не е намерена."
    });
  }

  if (!userEmail) {
    return res.status(400).json({
      message: "Липсва потребител."
    });
  }

  if (!post.likedBy) {
    post.likedBy = [];
  }

  const normalizedEmail = normalizeEmail(userEmail);
  const alreadyLiked = post.likedBy.includes(normalizedEmail);

  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(email => email !== normalizedEmail);
  } else {
    post.likedBy.push(normalizedEmail);

    if (post.authorEmail && normalizeEmail(post.authorEmail) !== normalizedEmail) {
      createNotification({
        userEmail: post.authorEmail,
        type: "post_like",
        title: "Нов лайк по публикация",
        text: `${normalizedEmail} хареса твоя публикация.`,
        link: "/feed-page"
      });
    }
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

  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({
      message: "Публикацията не е намерена."
    });
  }

  if (!authorName || !authorEmail || !text) {
    return res.status(400).json({
      message: "Липсват данни за коментара."
    });
  }

  if (!post.comments) {
    post.comments = [];
  }

  const newComment = {
    id: getNextId(post.comments),
    authorName,
    authorEmail: normalizeEmail(authorEmail),
    text,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  post.comments.push(newComment);

  if (post.authorEmail && normalizeEmail(post.authorEmail) !== normalizeEmail(authorEmail)) {
    createNotification({
      userEmail: post.authorEmail,
      type: "post_comment",
      title: "Нов коментар по публикация",
      text: `${authorName} коментира твоя публикация.`,
      link: "/feed-page"
    });
  }

  res.status(201).json({
    message: "Коментарът е добавен ✅",
    comment: newComment
  });
});

/* =========================
   REPORTS
========================= */
app.post("/report", (req, res) => {
  const {
    reporterEmail,
    targetType,
    targetId,
    targetEmail,
    reason,
    note
  } = req.body;

  if (!reporterEmail || !targetType || !reason) {
    return res.status(400).json({
      message: "Липсват данни за сигнала."
    });
  }

  if (!["job", "profile", "post"].includes(targetType)) {
    return res.status(400).json({
      message: "Невалиден тип сигнал."
    });
  }

  const newReport = {
    id: getNextId(reports),
    reporterEmail: normalizeEmail(reporterEmail),
    targetType,
    targetId: targetId ? Number(targetId) : null,
    targetEmail: targetEmail ? normalizeEmail(targetEmail) : "",
    reason: reason.trim(),
    note: note || "",
    status: "open",
    createdAt: new Date().toLocaleString("bg-BG")
  };

  reports.unshift(newReport);

  res.status(201).json({
    message: "Сигналът е изпратен успешно ✅",
    report: newReport
  });
});

/* =========================
   APPLICATIONS
========================= */
app.post("/apply", upload.single("cvFile"), (req, res) => {
  const { jobId, name, email, message } = req.body;

  if (!jobId || !name || !message) {
    return res.status(400).json({
      message: "Попълни всички задължителни полета!"
    });
  }

  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (!isJobVisibleToPublic(job)) {
    return res.status(400).json({
      message: "Не можеш да кандидатстваш по тази обява."
    });
  }

  if (email && normalizeEmail(job.ownerEmail) === normalizeEmail(email)) {
    return res.status(400).json({
      message: "Не можеш да кандидатстваш по собствената си обява."
    });
  }

  const alreadyApplied = applications.find(app =>
    app.jobId === Number(jobId) && normalizeEmail(app.email) === normalizeEmail(email)
  );

  if (alreadyApplied) {
    return res.status(400).json({
      message: "Вече си изпратил кандидатура по тази обява."
    });
  }

  const cvUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const application = {
    id: getNextId(applications),
    jobId: Number(jobId),
    name,
    email: normalizeEmail(email || ""),
    message,
    cvUrl,
    createdAt: new Date().toLocaleString("bg-BG"),
    status: "Чака одобрение"
  };

  applications.push(application);

  createNotification({
    userEmail: job.ownerEmail,
    type: "application_new",
    title: "Нова кандидатура",
    text: `${name} кандидатства по "${job.title}".`,
    link: "/applications-page"
  });

  res.json({
    message: "Кандидатурата е изпратена ✅",
    application
  });
});

app.get("/applications/:jobId", (req, res) => {
  const jobId = Number(req.params.jobId);
  const requesterEmail = req.query.email;

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (!requesterEmail || normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({
      message: "Нямаш право да виждаш тези кандидатури."
    });
  }

  const jobApplications = applications.filter(app => app.jobId === jobId);
  res.json(jobApplications);
});

app.put("/applications/:applicationId/status", (req, res) => {
  const applicationId = Number(req.params.applicationId);
  const { requesterEmail, status } = req.body;

  const validStatuses = ["Чака одобрение", "Одобрен", "Отказан"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Невалиден статус." });
  }

  const application = applications.find(app => app.id === applicationId);
  if (!application) {
    return res.status(404).json({ message: "Кандидатурата не е намерена." });
  }

  const job = jobs.find(j => j.id === application.jobId);
  if (!job) {
    return res.status(404).json({ message: "Обявата не е намерена." });
  }

  if (!requesterEmail || normalizeEmail(requesterEmail) !== normalizeEmail(job.ownerEmail)) {
    return res.status(403).json({ message: "Нямаш право да сменяш статуса." });
  }

  application.status = status;

  if (application.email) {
    createNotification({
      userEmail: application.email,
      type: "application_status",
      title: "Промяна по кандидатура",
      text: `Кандидатурата ти по "${job.title}" е със статус: ${status}.`,
      link: `/job/${job.id}`
    });
  }

  res.json({
    message: "Статусът е обновен успешно ✅",
    application
  });
});

app.get("/my-applications/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const userApplications = applications.filter(app => normalizeEmail(app.email) === email);

  const enriched = userApplications.map(appItem => {
    const job = jobs.find(j => j.id === appItem.jobId);

    return {
      id: appItem.id,
      jobId: job?.id || appItem.jobId,
      jobTitle: job?.title || "Неизвестна обява",
      jobCity: job?.city || "",
      jobCategory: job?.category || "",
      jobSubcategory: job?.subcategory || "",
      jobType: job?.type || "job",
      message: appItem.message || "",
      cvUrl: appItem.cvUrl || "",
      createdAt: appItem.createdAt || "",
      status: appItem.status || "Чака одобрение"
    };
  });

  res.json(enriched);
});

/* =========================
   COMPLETED PROJECTS
========================= */
app.post("/completed-projects", (req, res) => {
  const {
    requesterEmail,
    jobId,
    workerEmail,
    workerName
  } = req.body;

  if (!requesterEmail || !jobId || !workerEmail || !workerName) {
    return res.status(400).json({
      message: "Липсват данни за завършения проект."
    });
  }

  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({
      message: "Само авторът на обявата може да маркира проект като завършен."
    });
  }

  const approvedApplication = applications.find(app =>
    app.jobId === Number(jobId) &&
    normalizeEmail(app.email) === normalizeEmail(workerEmail) &&
    app.status === "Одобрен"
  );

  if (!approvedApplication) {
    return res.status(400).json({
      message: "Само одобрен кандидат може да бъде маркиран като завършен проект."
    });
  }

  const exists = completedProjects.find(item =>
    item.jobId === Number(jobId) &&
    normalizeEmail(item.workerEmail) === normalizeEmail(workerEmail)
  );

  if (exists) {
    return res.status(400).json({
      message: "Този проект вече е маркиран като завършен."
    });
  }

  const newCompletedProject = {
    id: getNextId(completedProjects),
    jobId: Number(jobId),
    workerEmail: normalizeEmail(workerEmail),
    workerName,
    ownerEmail: normalizeEmail(requesterEmail),
    jobTitle: job.title,
    category: job.category,
    subcategory: job.subcategory || "",
    city: job.city,
    completedAt: new Date().toLocaleString("bg-BG")
  };

  completedProjects.unshift(newCompletedProject);

  createNotification({
    userEmail: workerEmail,
    type: "project_completed",
    title: "Завършен проект",
    text: `Проектът "${job.title}" е маркиран като завършен.`,
    link: `/profile/${encodeURIComponent(workerEmail)}`
  });

  res.status(201).json({
    message: "Проектът е маркиран като завършен ✅",
    completedProject: newCompletedProject
  });
});

app.get("/completed-projects/check", (req, res) => {
  const jobId = Number(req.query.jobId);
  const workerEmail = req.query.workerEmail;

  if (!jobId || !workerEmail) {
    return res.status(400).json({
      message: "Липсват данни."
    });
  }

  const exists = completedProjects.some(item =>
    item.jobId === jobId && normalizeEmail(item.workerEmail) === normalizeEmail(workerEmail)
  );

  res.json({ exists });
});

app.get("/completed-projects/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const items = completedProjects.filter(item => normalizeEmail(item.workerEmail) === email);
  res.json(items);
});

/* =========================
   REVIEWS / RATINGS
========================= */
app.post("/reviews", (req, res) => {
  const {
    requesterEmail,
    jobId,
    workerEmail,
    workerName,
    rating,
    text
  } = req.body;

  if (!requesterEmail || !jobId || !workerEmail || !workerName || !rating) {
    return res.status(400).json({
      message: "Липсват данни за оценката."
    });
  }

  const numericRating = Number(rating);

  if (numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      message: "Оценката трябва да е между 1 и 5."
    });
  }

  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (normalizeEmail(job.ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({
      message: "Само авторът на обявата може да остави оценка."
    });
  }

  const completedProject = completedProjects.find(item =>
    item.jobId === Number(jobId) && normalizeEmail(item.workerEmail) === normalizeEmail(workerEmail)
  );

  if (!completedProject) {
    return res.status(400).json({
      message: "Можеш да оцениш само завършен проект."
    });
  }

  const existingReview = reviews.find(item =>
    item.jobId === Number(jobId) &&
    normalizeEmail(item.workerEmail) === normalizeEmail(workerEmail) &&
    normalizeEmail(item.reviewerEmail) === normalizeEmail(requesterEmail)
  );

  if (existingReview) {
    return res.status(400).json({
      message: "Вече си оставил оценка за тази обява."
    });
  }

  const reviewerUser = users.find(u => normalizeEmail(u.email) === normalizeEmail(requesterEmail));

  const newReview = {
    id: getNextId(reviews),
    jobId: Number(jobId),
    workerEmail: normalizeEmail(workerEmail),
    workerName,
    reviewerEmail: normalizeEmail(requesterEmail),
    reviewerName: reviewerUser?.name || requesterEmail,
    rating: numericRating,
    text: text || "",
    createdAt: new Date().toLocaleString("bg-BG")
  };

  reviews.unshift(newReview);

  createNotification({
    userEmail: workerEmail,
    type: "review_new",
    title: "Ново ревю",
    text: `Получил/а си нова оценка ${numericRating}/5 за "${job.title}".`,
    link: `/profile/${encodeURIComponent(workerEmail)}`
  });

  res.status(201).json({
    message: "Оценката е записана успешно ✅",
    review: newReview
  });
});

app.get("/reviews/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const userReviews = reviews.filter(item => normalizeEmail(item.workerEmail) === email);
  const summary = getRatingSummaryByEmail(email);

  res.json({
    average: summary.average,
    count: summary.count,
    reviews: userReviews
  });
});

app.get("/reviews/check", (req, res) => {
  const requesterEmail = req.query.requesterEmail;
  const jobId = Number(req.query.jobId);
  const workerEmail = req.query.workerEmail;

  if (!requesterEmail || !jobId || !workerEmail) {
    return res.status(400).json({
      message: "Липсват данни."
    });
  }

  const exists = reviews.some(item =>
    normalizeEmail(item.reviewerEmail) === normalizeEmail(requesterEmail) &&
    item.jobId === jobId &&
    normalizeEmail(item.workerEmail) === normalizeEmail(workerEmail)
  );

  res.json({ exists });
});

/* =========================
   PORTFOLIO
========================= */
app.post("/portfolio", upload.single("image"), (req, res) => {
  const {
    ownerEmail,
    title,
    description,
    link
  } = req.body;

  if (!ownerEmail || !title) {
    return res.status(400).json({
      message: "Заглавието е задължително."
    });
  }

  const user = users.find(u => normalizeEmail(u.email) === normalizeEmail(ownerEmail));

  if (!user) {
    return res.status(404).json({
      message: "Потребителят не е намерен."
    });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const newPortfolioItem = {
    id: getNextId(portfolioItems),
    ownerEmail: normalizeEmail(ownerEmail),
    title,
    description: description || "",
    link: link || "",
    imageUrl,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  portfolioItems.unshift(newPortfolioItem);

  res.status(201).json({
    message: "Портфолиото е добавено успешно ✅",
    item: newPortfolioItem
  });
});

app.get("/portfolio/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const items = portfolioItems.filter(item => normalizeEmail(item.ownerEmail) === email);
  res.json(items);
});

app.delete("/portfolio/:id", (req, res) => {
  const portfolioId = Number(req.params.id);
  const requesterEmail = req.query.email;

  const itemIndex = portfolioItems.findIndex(item => item.id === portfolioId);

  if (itemIndex === -1) {
    return res.status(404).json({
      message: "Елементът от портфолиото не е намерен."
    });
  }

  if (!requesterEmail || normalizeEmail(portfolioItems[itemIndex].ownerEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({
      message: "Нямаш право да изтриеш този елемент."
    });
  }

  const deletedItem = portfolioItems[itemIndex];
  portfolioItems.splice(itemIndex, 1);

  res.json({
    message: "Елементът от портфолиото е изтрит ✅",
    item: deletedItem
  });
});

/* =========================
   INTERNAL MESSAGES / INBOX
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

  if (!jobId || !senderEmail || !senderName || !receiverEmail || !text) {
    return res.status(400).json({
      message: "Липсват данни за запитването."
    });
  }

  if (normalizeEmail(senderEmail) === normalizeEmail(receiverEmail)) {
    return res.status(400).json({
      message: "Не можеш да изпратиш запитване до себе си."
    });
  }

  const job = jobs.find(j => j.id === Number(jobId));

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  const newMessage = {
    id: getNextId(inboxMessages),
    jobId: Number(jobId),
    senderEmail: normalizeEmail(senderEmail),
    senderName,
    receiverEmail: normalizeEmail(receiverEmail),
    subject: subject || `Запитване за обява: ${job.title}`,
    text,
    isRead: false,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  inboxMessages.unshift(newMessage);

  createNotification({
    userEmail: receiverEmail,
    type: "message_new",
    title: "Ново съобщение",
    text: `${senderName} ти изпрати запитване за "${job.title}".`,
    link: "/inbox-page"
  });

  res.status(201).json({
    message: "Запитването е изпратено успешно ✅",
    inboxMessage: newMessage
  });
});

app.get("/messages/inbox/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const items = inboxMessages.filter(msg => normalizeEmail(msg.receiverEmail) === email);

  const enriched = items.map(msg => {
    const job = jobs.find(j => j.id === msg.jobId);

    return {
      ...msg,
      jobTitle: job?.title || "Неизвестна обява"
    };
  });

  res.json(enriched);
});

app.get("/messages/sent/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const items = inboxMessages.filter(msg => normalizeEmail(msg.senderEmail) === email);

  const enriched = items.map(msg => {
    const job = jobs.find(j => j.id === msg.jobId);

    return {
      ...msg,
      jobTitle: job?.title || "Неизвестна обява"
    };
  });

  res.json(enriched);
});

app.put("/messages/:id/read", (req, res) => {
  const messageId = Number(req.params.id);
  const { requesterEmail } = req.body;

  const message = inboxMessages.find(msg => msg.id === messageId);

  if (!message) {
    return res.status(404).json({
      message: "Съобщението не е намерено."
    });
  }

  if (!requesterEmail || normalizeEmail(requesterEmail) !== normalizeEmail(message.receiverEmail)) {
    return res.status(403).json({
      message: "Нямаш право да маркираш това съобщение."
    });
  }

  message.isRead = true;

  res.json({
    message: "Съобщението е маркирано като прочетено ✅",
    inboxMessage: message
  });
});

/* =========================
   NOTIFICATIONS
========================= */
app.get("/notifications/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));
  const items = notifications.filter(n => normalizeEmail(n.userEmail) === email);
  res.json(items);
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

  const notification = notifications.find(n => n.id === notificationId);

  if (!notification) {
    return res.status(404).json({
      message: "Известието не е намерено."
    });
  }

  if (!requesterEmail || normalizeEmail(notification.userEmail) !== normalizeEmail(requesterEmail)) {
    return res.status(403).json({
      message: "Нямаш право да маркираш това известие."
    });
  }

  notification.isRead = true;

  res.json({
    message: "Известието е маркирано като прочетено ✅",
    notification
  });
});

app.put("/notifications/read-all/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  notifications.forEach(item => {
    if (normalizeEmail(item.userEmail) === email) {
      item.isRead = true;
    }
  });

  res.json({
    message: "Всички известия са маркирани като прочетени ✅"
  });
});

/* =========================
   USERS / AUTH / PROFILE
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
    contactName,
    companyId,
    manager,
    profession,
    coverImage,
    services,
    workCities,
    workingHours,
    website,
    facebook,
    instagram,
    youtube,
    videoUrl,
    faq
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: "Попълни всички задължителни полета за регистрация."
    });
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = users.find(user => normalizeEmail(user.email) === normalizedEmail);

  if (existingUser) {
    return res.status(400).json({
      message: "Вече има потребител с този имейл."
    });
  }

  const profileImage = req.file ? `/uploads/${req.file.filename}` : "";

  const newUser = {
    id: getNextId(users),
    name,
    email: normalizedEmail,
    password,
    role,
    description: description || "",
    phone: phone || "",
    showPhone: showPhone === "true" || showPhone === true,
    profileImage,
    contactName: contactName || "",
    companyId: companyId || "",
    manager: manager || "",
    profession: profession || "",
    coverImage: coverImage || "",
    services: services || "",
    workCities: workCities || "",
    workingHours: workingHours || "",
    website: website || "",
    facebook: facebook || "",
    instagram: instagram || "",
    youtube: youtube || "",
    videoUrl: videoUrl || "",
    faq: faq || ""
  };

  users.push(newUser);

  res.status(201).json({
    message: "Регистрацията е успешна ✅",
    user: publicUser(newUser)
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Въведи имейл и парола."
    });
  }

  const normalizedEmail = normalizeEmail(email);
  const user = users.find(
    u => normalizeEmail(u.email) === normalizedEmail && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Невалиден имейл или парола."
    });
  }

  res.json({
    message: "Входът е успешен ✅",
    user: publicUser(user)
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
    const {
      name,
      email,
      description,
      phone,
      showPhone,
      coverImage,
      services,
      workCities,
      workingHours,
      website,
      facebook,
      instagram,
      youtube,
      videoUrl,
      faq
    } = req.body;

    const user = users.find(u => normalizeEmail(u.email) === currentEmail);

    if (!user) {
      return res.status(404).json({
        message: "Потребителят не е намерен."
      });
    }

    const nextEmail = email ? normalizeEmail(email) : currentEmail;

    if (nextEmail !== currentEmail) {
      const existingUser = users.find(u => normalizeEmail(u.email) === nextEmail);
      if (existingUser) {
        return res.status(400).json({
          message: "Вече има потребител с този имейл."
        });
      }

      updateEmailAcrossCollections(currentEmail, nextEmail);
    }

    user.name = name || user.name;
    user.email = nextEmail;
    user.description = description || "";
    user.phone = phone || "";
    user.showPhone = showPhone === "true" || showPhone === true;
    user.services = services || "";
    user.workCities = workCities || "";
    user.workingHours = workingHours || "";
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
      user.coverImage = coverImage || "";
    }

    res.json({
      message: "Профилът е обновен ✅",
      user: publicUser(user)
    });
  }
);

app.get("/api/profile/:email", (req, res) => {
  const email = normalizeEmail(decodeURIComponent(req.params.email));

  const user = users.find(u => normalizeEmail(u.email) === email);

  const userPosts = posts
    .filter(p => normalizeEmail(p.authorEmail) === email)
    .filter(isPostVisibleToPublic);

  const userJobs = jobs
    .filter(j => normalizeEmail(j.ownerEmail) === email)
    .filter(job => job.isHidden !== true);

  const ratingInfo = getRatingSummaryByEmail(email);
  const userReviews = reviews.filter(item => normalizeEmail(item.workerEmail) === email);
  const userCompletedProjects = completedProjects.filter(item => normalizeEmail(item.workerEmail) === email);
  const userPortfolio = portfolioItems.filter(item => normalizeEmail(item.ownerEmail) === email);

  res.json({
    user: user
      ? publicUser(user)
      : {
          name: userPosts[0]?.authorName || "Неизвестен потребител",
          email,
          role: "personal",
          description: "",
          phone: "",
          showPhone: false,
          profileImage: "",
          contactName: "",
          companyId: "",
          manager: "",
          profession: "",
          coverImage: "",
          services: "",
          workCities: "",
          workingHours: "",
          website: "",
          facebook: "",
          instagram: "",
          youtube: "",
          videoUrl: "",
          faq: ""
        },
    posts: userPosts,
    jobs: userJobs,
    rating: ratingInfo,
    reviews: userReviews,
    completedProjects: userCompletedProjects,
    portfolio: userPortfolio,
    banners: {
      sidebar: getPublicBannersByPlacement("profile-sidebar")
    }
  });
});

/* =========================
   ADMIN API
========================= */
app.get("/api/admin/stats", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const totalJobs = jobs.length;
  const visibleJobs = jobs.filter(job => job.isHidden !== true && job.isApproved !== false).length;
  const hiddenJobs = jobs.filter(job => job.isHidden === true).length;
  const totalApplications = applications.length;
  const activeProfiles = users.filter(user => user.role !== "admin").length;
  const totalPosts = posts.length;
  const totalReports = reports.length;
  const activeBanners = banners.filter(item => item.isActive).length;

  res.json({
    totalJobs,
    visibleJobs,
    hiddenJobs,
    totalApplications,
    activeProfiles,
    totalPosts,
    totalReports,
    activeBanners
  });
});

app.get("/api/admin/jobs", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const result = [...jobs]
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    .map(job => ({
      ...job,
      reportCount: getReportCountForTarget("job", r => Number(r.targetId) === Number(job.id))
    }));

  res.json(result);
});

app.put("/api/admin/jobs/:id/moderation", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const jobId = Number(req.params.id);
  const { isApproved, isHidden, adminNote } = req.body;

  const job = jobs.find(j => Number(j.id) === jobId);

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (typeof isApproved === "boolean") {
    job.isApproved = isApproved;
  }

  if (typeof isHidden === "boolean") {
    job.isHidden = isHidden;
  }

  if (typeof adminNote === "string") {
    job.adminNote = adminNote;
  }

  res.json({
    message: "Обявата е обновена от admin ✅",
    job
  });
});

app.get("/api/admin/posts", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const result = [...posts]
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    .map(post => ({
      ...post,
      reportCount: getReportCountForTarget("post", r => Number(r.targetId) === Number(post.id))
    }));

  res.json(result);
});

app.put("/api/admin/posts/:id/moderation", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const postId = Number(req.params.id);
  const { isHidden } = req.body;

  const post = posts.find(p => Number(p.id) === postId);

  if (!post) {
    return res.status(404).json({
      message: "Публикацията не е намерена."
    });
  }

  if (typeof isHidden === "boolean") {
    post.isHidden = isHidden;
  }

  res.json({
    message: "Публикацията е обновена от admin ✅",
    post
  });
});

app.get("/api/admin/reports", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const enriched = [...reports]
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    .map(item => {
      let targetLabel = "Unknown target";

      if (item.targetType === "job") {
        const job = jobs.find(j => Number(j.id) === Number(item.targetId));
        targetLabel = job ? `Обява: ${job.title}` : `Обява #${item.targetId}`;
      }

      if (item.targetType === "profile") {
        targetLabel = `Профил: ${item.targetEmail}`;
      }

      if (item.targetType === "post") {
        const post = posts.find(p => Number(p.id) === Number(item.targetId));
        targetLabel = post ? `Публикация от ${post.authorName || post.authorEmail}` : `Пост #${item.targetId}`;
      }

      return {
        ...item,
        targetLabel
      };
    });

  res.json(enriched);
});

app.put("/api/admin/reports/:id/status", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const reportId = Number(req.params.id);
  const { status } = req.body;

  if (!["open", "resolved", "dismissed"].includes(status)) {
    return res.status(400).json({
      message: "Невалиден статус."
    });
  }

  const report = reports.find(r => Number(r.id) === reportId);

  if (!report) {
    return res.status(404).json({
      message: "Сигналът не е намерен."
    });
  }

  report.status = status;

  res.json({
    message: "Статусът на сигнала е обновен ✅",
    report
  });
});

app.get("/api/admin/banners", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const result = [...banners].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  res.json(result);
});

app.get("/api/banners/public", (req, res) => {
  const placement = String(req.query.placement || "").trim();

  const result = banners.filter(item => {
    if (!item.isActive) return false;
    if (placement && item.placement !== placement) return false;
    return true;
  });

  res.json(result);
});

app.post("/api/admin/banners", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const {
    title,
    text,
    buttonText,
    buttonHref,
    placement,
    isActive
  } = req.body;

  if (!title || !text || !placement) {
    return res.status(400).json({
      message: "Попълни заглавие, текст и позиция."
    });
  }

  const newBanner = {
    id: getNextId(banners),
    title: title.trim(),
    text: text.trim(),
    buttonText: buttonText || "Отвори",
    buttonHref: buttonHref || "/",
    placement: placement.trim(),
    isActive: isActive === true || isActive === "true",
    createdAt: new Date().toLocaleString("bg-BG")
  };

  banners.unshift(newBanner);

  res.status(201).json({
    message: "Банерът е добавен успешно ✅",
    banner: newBanner
  });
});

app.put("/api/admin/banners/:id", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const bannerId = Number(req.params.id);
  const banner = banners.find(item => Number(item.id) === bannerId);

  if (!banner) {
    return res.status(404).json({
      message: "Банерът не е намерен."
    });
  }

  const {
    title,
    text,
    buttonText,
    buttonHref,
    placement,
    isActive
  } = req.body;

  if (typeof title === "string") banner.title = title;
  if (typeof text === "string") banner.text = text;
  if (typeof buttonText === "string") banner.buttonText = buttonText;
  if (typeof buttonHref === "string") banner.buttonHref = buttonHref;
  if (typeof placement === "string") banner.placement = placement;
  if (typeof isActive === "boolean") banner.isActive = isActive;

  res.json({
    message: "Банерът е обновен успешно ✅",
    banner
  });
});

app.delete("/api/admin/banners/:id", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const bannerId = Number(req.params.id);
  const index = banners.findIndex(item => Number(item.id) === bannerId);

  if (index === -1) {
    return res.status(404).json({
      message: "Банерът не е намерен."
    });
  }

  const removed = banners[index];
  banners.splice(index, 1);

  res.json({
    message: "Банерът е изтрит успешно ✅",
    banner: removed
  });
});

app.get("/api/admin/users", (req, res) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;

  const result = [...users]
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    .map(user => ({
      ...publicUser(user),
      jobsCount: jobs.filter(job => normalizeEmail(job.ownerEmail) === normalizeEmail(user.email)).length,
      postsCount: posts.filter(post => normalizeEmail(post.authorEmail) === normalizeEmail(user.email)).length,
      reviewsCount: reviews.filter(review => normalizeEmail(review.workerEmail) === normalizeEmail(user.email)).length
    }));

  res.json(result);
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});