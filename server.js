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
    imageUrl: ""
  }
];

let applications = [];
let users = [];
let messages = [];
let ratings = [];
let posts = [];

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

app.get("/chat-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

app.get("/feed-page", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "feed.html"));
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

app.post("/jobs", upload.single("image"), (req, res) => {
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

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

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
    imageUrl
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

  res.status(201).json({
    message: "Коментарът е добавен ✅",
    comment: newComment
  });
});

// ===== APPLICATIONS =====
app.post("/apply", (req, res) => {
  const { jobId, name, email, message, price } = req.body;

  if (!jobId || !name || !message) {
    return res.status(400).json({
      message: "Попълни всички полета!"
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
      message: "Вече си изпратил оферта по тази обява."
    });
  }

  const application = {
    id: applications.length + 1,
    jobId: Number(jobId),
    name,
    email: email || "",
    message,
    price: price ? Number(price) : 0,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  applications.push(application);

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
  const email = decodeURIComponent(req.params.email);
  const { description, phone, showPhone } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({
      message: "Потребителят не е намерен."
    });
  }

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

  let ratingInfo = { average: 0, count: 0 };

  if (user && (user.role === "freelancer" || user.role === "worker")) {
    const workerRatings = ratings.filter(r => r.workerName === user.name);

    if (workerRatings.length > 0) {
      const avg =
        workerRatings.reduce((sum, r) => sum + r.rating, 0) /
        workerRatings.length;

      ratingInfo = {
        average: avg.toFixed(1),
        count: workerRatings.length
      };
    }
  }

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
    rating: ratingInfo
  });
});

// ===== CHAT =====
app.get("/messages/:jobId", (req, res) => {
  const jobId = Number(req.params.jobId);
  const jobMessages = messages.filter(msg => msg.jobId === jobId);
  res.json(jobMessages);
});

app.post("/messages", (req, res) => {
  const { jobId, senderName, senderRole, text } = req.body;

  if (!jobId || !senderName || !senderRole || !text) {
    return res.status(400).json({
      message: "Липсват данни за съобщението."
    });
  }

  const newMessage = {
    id: messages.length + 1,
    jobId: Number(jobId),
    senderName,
    senderRole,
    text,
    createdAt: new Date().toLocaleString("bg-BG")
  };

  messages.push(newMessage);

  res.status(201).json({
    message: "Съобщението е изпратено ✅",
    chatMessage: newMessage
  });
});

// ===== RATINGS =====
app.post("/rate", (req, res) => {
  const { workerName, rating } = req.body;

  if (!workerName || !rating) {
    return res.status(400).json({
      message: "Липсват данни за оценка."
    });
  }

  ratings.push({
    workerName,
    rating: Number(rating)
  });

  res.json({
    message: "Оценката е записана ✅"
  });
});

app.get("/ratings/:workerName", (req, res) => {
  const workerName = req.params.workerName;
  const workerRatings = ratings.filter(r => r.workerName === workerName);

  if (workerRatings.length === 0) {
    return res.json({
      average: 0,
      count: 0
    });
  }

  const avg =
    workerRatings.reduce((sum, r) => sum + r.rating, 0) /
    workerRatings.length;

  res.json({
    average: avg.toFixed(1),
    count: workerRatings.length
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});