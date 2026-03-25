const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: false }));

const uploadsDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

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
    gallery: []
  }
];

let applications = [];
let users = [];
let posts = [];
let inboxMessages = [];
let notifications = [];
let favorites = [];
let reviews = [];
let completedProjects = [];
let portfolioItems = [];

// ===== HELPERS =====
function createNotification({ userEmail, type, title, text, link }) {
  if (!userEmail) return;

  notifications.unshift({
    id: notifications.length + 1,
    userEmail,
    type: type || "general",
    title: title || "Ново известие",
    text: text || "",
    link: link || "/notifications-page",
    isRead: false,
    createdAt: new Date().toLocaleString("bg-BG")
  });
}

function getRatingSummaryByEmail(userEmail) {
  const userReviews = reviews.filter(r => r.workerEmail === userEmail);

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
    average: average.toFixed(1),
    count: userReviews.length
  };
}

// ===== PAGES =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/jobs-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "jobs.html"));
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

// ===== JOBS =====
app.get("/jobs", (req, res) => {
  res.json(jobs);
});

app.get("/my-jobs/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const myJobs = jobs.filter(job => job.ownerEmail === email);
  res.json(myJobs);
});

app.post("/jobs", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 8 }
]), (req, res) => {
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
    id: jobs.length + 1,
    title,
    description,
    city,
    budget: budget ? Number(budget) : 0,
    category,
    subcategory: subcategory || "",
    ownerEmail,
    type: type || "job",
    imageUrl,
    gallery
  };

  jobs.push(newJob);

  res.status(201).json({
    message: "Обявата е създадена успешно ✅",
    job: newJob
  });
});

app.get("/api/jobs/:id", (req, res) => {
  const jobId = Number(req.params.id);
  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  const owner = users.find(u => u.email === job.ownerEmail) || null;

  const related = jobs
    .filter(j => j.id !== job.id && j.category === job.category)
    .slice(0, 4);

  res.json({
    job,
    owner,
    related
  });
});

app.put("/api/jobs/:id", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 8 }
]), (req, res) => {
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

  if (!requesterEmail || job.ownerEmail !== requesterEmail) {
    return res.status(403).json({
      message: "Нямаш право да редактираш тази обява."
    });
  }

  if (!title || !description || !city || !category) {
    return res.status(400).json({
      message: "Попълни всички задължителни полета."
    });
  }

  job.title = title;
  job.description = description;
  job.city = city;
  job.budget = budget ? Number(budget) : 0;
  job.category = category;
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
});

app.delete("/api/jobs/:id", (req, res) => {
  const jobId = Number(req.params.id);
  const requesterEmail = req.query.email;

  const jobIndex = jobs.findIndex(j => j.id === jobId);

  if (jobIndex === -1) {
    return res.status(404).json({
      message: "Обявата не е намерена."
    });
  }

  if (!requesterEmail || jobs[jobIndex].ownerEmail !== requesterEmail) {
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

  res.json({
    message: "Обявата е изтрита успешно ✅",
    job: deletedJob
  });
});

// ===== FAVORITES =====
app.get("/favorites/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);

  const userFavorites = favorites
    .filter(item => item.userEmail === email)
    .map(item => {
      const job = jobs.find(j => j.id === item.jobId);
      return job ? job : null;
    })
    .filter(Boolean);

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
    item => item.userEmail === userEmail && item.jobId === jobId
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
    item => item.userEmail === userEmail && item.jobId === Number(jobId)
  );

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    return res.json({
      message: "Обявата е премахната от любими 💔",
      isFavorite: false
    });
  }

  favorites.push({
    id: favorites.length + 1,
    userEmail,
    jobId: Number(jobId),
    createdAt: new Date().toLocaleString("bg-BG")
  });

  return res.json({
    message: "Обявата е добавена в любими ❤️",
    isFavorite: true
  });
});

// ===== POSTS / FEED =====
app.get("/posts", (req, res) => {
  res.json(posts);
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
    id: posts.length + 1,
    authorName,
    authorEmail,
    text,
    imageUrl,
    likes: 0,
    likedBy: [],
    comments: [],
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

  const alreadyLiked = post.likedBy.includes(userEmail);

  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(email => email !== userEmail);
  } else {
    post.likedBy.push(userEmail);

    if (post.authorEmail && post.authorEmail !== userEmail) {
      createNotification({
        userEmail: post.authorEmail,
        type: "post_like",
        title: "Нов лайк по публикация",
        text: `${userEmail} хареса твоя публикация.`,
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
    id: post.comments.length + 1,
    authorName,
    authorEmail,
    text,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  post.comments.push(newComment);

  if (post.authorEmail && post.authorEmail !== authorEmail) {
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

// ===== APPLICATIONS =====
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

  if (email && job.ownerEmail === email) {
    return res.status(400).json({
      message: "Не можеш да кандидатстваш по собствената си обява."
    });
  }

  const alreadyApplied = applications.find(app =>
    app.jobId === Number(jobId) &&
    app.email === email
  );

  if (alreadyApplied) {
    return res.status(400).json({
      message: "Вече си изпратил кандидатура по тази обява."
    });
  }

  const cvUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const application = {
    id: applications.length + 1,
    jobId: Number(jobId),
    name,
    email: email || "",
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

  if (!requesterEmail || job.ownerEmail !== requesterEmail) {
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

  if (!requesterEmail || requesterEmail !== job.ownerEmail) {
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

// ===== COMPLETED PROJECTS =====
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

  if (job.ownerEmail !== requesterEmail) {
    return res.status(403).json({
      message: "Само авторът на обявата може да маркира проект като завършен."
    });
  }

  const approvedApplication = applications.find(app =>
    app.jobId === Number(jobId) &&
    app.email === workerEmail &&
    app.status === "Одобрен"
  );

  if (!approvedApplication) {
    return res.status(400).json({
      message: "Само одобрен кандидат може да бъде маркиран като завършен проект."
    });
  }

  const exists = completedProjects.find(item =>
    item.jobId === Number(jobId) &&
    item.workerEmail === workerEmail
  );

  if (exists) {
    return res.status(400).json({
      message: "Този проект вече е маркиран като завършен."
    });
  }

  const newCompletedProject = {
    id: completedProjects.length + 1,
    jobId: Number(jobId),
    workerEmail,
    workerName,
    ownerEmail: requesterEmail,
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
    item.jobId === jobId && item.workerEmail === workerEmail
  );

  res.json({ exists });
});

app.get("/completed-projects/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);

  const items = completedProjects.filter(item => item.workerEmail === email);
  res.json(items);
});

// ===== REVIEWS / RATINGS =====
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

  if (job.ownerEmail !== requesterEmail) {
    return res.status(403).json({
      message: "Само авторът на обявата може да остави оценка."
    });
  }

  const completedProject = completedProjects.find(item =>
    item.jobId === Number(jobId) &&
    item.workerEmail === workerEmail
  );

  if (!completedProject) {
    return res.status(400).json({
      message: "Можеш да оцениш само завършен проект."
    });
  }

  const existingReview = reviews.find(item =>
    item.jobId === Number(jobId) &&
    item.workerEmail === workerEmail &&
    item.reviewerEmail === requesterEmail
  );

  if (existingReview) {
    return res.status(400).json({
      message: "Вече си оставил оценка за тази обява."
    });
  }

  const newReview = {
    id: reviews.length + 1,
    jobId: Number(jobId),
    workerEmail,
    workerName,
    reviewerEmail: requesterEmail,
    reviewerName: users.find(u => u.email === requesterEmail)?.name || requesterEmail,
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
  const email = decodeURIComponent(req.params.email);

  const userReviews = reviews.filter(item => item.workerEmail === email);
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
    item.reviewerEmail === requesterEmail &&
    item.jobId === jobId &&
    item.workerEmail === workerEmail
  );

  res.json({ exists });
});

// ===== PORTFOLIO =====
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

  const user = users.find(u => u.email === ownerEmail);

  if (!user) {
    return res.status(404).json({
      message: "Потребителят не е намерен."
    });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const newPortfolioItem = {
    id: portfolioItems.length + 1,
    ownerEmail,
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
  const email = decodeURIComponent(req.params.email);
  const items = portfolioItems.filter(item => item.ownerEmail === email);
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

  if (!requesterEmail || portfolioItems[itemIndex].ownerEmail !== requesterEmail) {
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

// ===== MY APPLICATIONS =====
app.get("/my-applications/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);

  const userApplications = applications.filter(app => app.email === email);

  const enriched = userApplications.map(app => {
    const job = jobs.find(j => j.id === app.jobId);

    return {
      id: app.id,
      jobId: job?.id || app.jobId,
      jobTitle: job?.title || "Неизвестна обява",
      jobCity: job?.city || "",
      jobCategory: job?.category || "",
      jobSubcategory: job?.subcategory || "",
      jobType: job?.type || "job",
      message: app.message || "",
      cvUrl: app.cvUrl || "",
      createdAt: app.createdAt || ""
    };
  });

  res.json(enriched);
});

// ===== INTERNAL MESSAGES / INBOX =====
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

  if (senderEmail === receiverEmail) {
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
    id: inboxMessages.length + 1,
    jobId: Number(jobId),
    senderEmail,
    senderName,
    receiverEmail,
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
  const email = decodeURIComponent(req.params.email);

  const items = inboxMessages.filter(msg => msg.receiverEmail === email);

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
  const email = decodeURIComponent(req.params.email);

  const items = inboxMessages.filter(msg => msg.senderEmail === email);

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

  if (!requesterEmail || requesterEmail !== message.receiverEmail) {
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

// ===== NOTIFICATIONS =====
app.get("/notifications/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const items = notifications.filter(n => n.userEmail === email);
  res.json(items);
});

app.get("/notifications/unread-count/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const unreadCount = notifications.filter(
    n => n.userEmail === email && !n.isRead
  ).length;

  res.json({ unreadCount });
});

app.get("/notifications/latest/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const limit = Number(req.query.limit || 3);

  const items = notifications
    .filter(n => n.userEmail === email && !n.isRead)
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

  if (!requesterEmail || notification.userEmail !== requesterEmail) {
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
  const email = decodeURIComponent(req.params.email);

  notifications.forEach(item => {
    if (item.userEmail === email) {
      item.isRead = true;
    }
  });

  res.json({
    message: "Всички известия са маркирани като прочетени ✅"
  });
});

// ===== USERS =====
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
    profession
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: "Попълни всички задължителни полета за регистрация."
    });
  }

  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.status(400).json({
      message: "Вече има потребител с този имейл."
    });
  }

  const profileImage = req.file ? `/uploads/${req.file.filename}` : "";

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role,
    description: description || "",
    phone: phone || "",
    showPhone: showPhone === "true" || showPhone === true,
    profileImage,
    contactName: contactName || "",
    companyId: companyId || "",
    manager: manager || "",
    profession: profession || ""
  };

  users.push(newUser);

  res.status(201).json({
    message: "Регистрацията е успешна ✅",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      description: newUser.description,
      phone: newUser.phone,
      showPhone: newUser.showPhone,
      profileImage: newUser.profileImage,
      contactName: newUser.contactName,
      companyId: newUser.companyId,
      manager: newUser.manager,
      profession: newUser.profession
    }
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Въведи имейл и парола."
    });
  }

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Невалиден имейл или парола."
    });
  }

  res.json({
    message: "Входът е успешен ✅",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      description: user.description,
      phone: user.phone,
      showPhone: user.showPhone,
      profileImage: user.profileImage,
      contactName: user.contactName,
      companyId: user.companyId,
      manager: user.manager,
      profession: user.profession
    }
  });
});

app.put("/api/profile/:email", upload.single("profileImage"), (req, res) => {
  const currentEmail = decodeURIComponent(req.params.email);
  const {
    name,
    email,
    description,
    phone,
    showPhone
  } = req.body;

  const user = users.find(u => u.email === currentEmail);

  if (!user) {
    return res.status(404).json({
      message: "Потребителят не е намерен."
    });
  }

  if (email && email !== currentEmail) {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        message: "Вече има потребител с този имейл."
      });
    }

    users.forEach(u => {
      if (u.email === currentEmail) u.email = email;
    });

    jobs.forEach(job => {
      if (job.ownerEmail === currentEmail) job.ownerEmail = email;
    });

    posts.forEach(post => {
      if (post.authorEmail === currentEmail) post.authorEmail = email;
    });

    applications.forEach(app => {
      if (app.email === currentEmail) app.email = email;
    });

    inboxMessages.forEach(msg => {
      if (msg.senderEmail === currentEmail) msg.senderEmail = email;
      if (msg.receiverEmail === currentEmail) msg.receiverEmail = email;
    });

    notifications.forEach(item => {
      if (item.userEmail === currentEmail) item.userEmail = email;
    });

    favorites.forEach(item => {
      if (item.userEmail === currentEmail) item.userEmail = email;
    });

    reviews.forEach(item => {
      if (item.workerEmail === currentEmail) item.workerEmail = email;
      if (item.reviewerEmail === currentEmail) item.reviewerEmail = email;
    });

    completedProjects.forEach(item => {
      if (item.workerEmail === currentEmail) item.workerEmail = email;
      if (item.ownerEmail === currentEmail) item.ownerEmail = email;
    });

    portfolioItems.forEach(item => {
      if (item.ownerEmail === currentEmail) item.ownerEmail = email;
    });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.description = description || "";
  user.phone = phone || "";
  user.showPhone = showPhone === "true" || showPhone === true;

  if (req.file) {
    user.profileImage = `/uploads/${req.file.filename}`;
  }

  res.json({
    message: "Профилът е обновен ✅",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      description: user.description,
      phone: user.phone,
      showPhone: user.showPhone,
      profileImage: user.profileImage,
      contactName: user.contactName,
      companyId: user.companyId,
      manager: user.manager,
      profession: user.profession
    }
  });
});

// ===== PROFILE =====
app.get("/api/profile/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email);

  const user = users.find(u => u.email === email);
  const userPosts = posts.filter(p => p.authorEmail === email);
  const userJobs = jobs.filter(j => j.ownerEmail === email);

  const ratingInfo = getRatingSummaryByEmail(email);
  const userReviews = reviews.filter(item => item.workerEmail === email);
  const userCompletedProjects = completedProjects.filter(item => item.workerEmail === email);
  const userPortfolio = portfolioItems.filter(item => item.ownerEmail === email);

  res.json({
    user: user || {
      name: userPosts[0]?.authorName || "Неизвестен потребител",
      email,
      role: "personal",
      description: "",
      phone: "",
      showPhone: false,
      profileImage: userPosts[0]?.imageUrl || ""
    },
    posts: userPosts,
    jobs: userJobs,
    rating: ratingInfo,
    reviews: userReviews,
    completedProjects: userCompletedProjects,
    portfolio: userPortfolio
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});