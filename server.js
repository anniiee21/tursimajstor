const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let jobs = [
  {
    id: 1,
    title: "Боядисване на офис",
    description: "Търся човек за боядисване на офис.",
    city: "Плевен",
    budget: 300,
    category: "Ремонт"
  }
];

let applications = [];
let users = [];
let messages = [];
let ratings = [];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/jobs", (req, res) => {
  res.json(jobs);
});

app.post("/jobs", (req, res) => {
  const { title, description, city, budget, category } = req.body;

  if (!title || !description || !city || !category) {
    return res.status(400).json({
      message: "Попълни всички задължителни полета."
    });
  }

  const newJob = {
    id: jobs.length + 1,
    title,
    description,
    city,
    budget: budget ? Number(budget) : 0,
    category
  };

  jobs.push(newJob);

  res.status(201).json({
    message: "Обявата е създадена успешно ✅",
    job: newJob
  });
});

app.post("/apply", (req, res) => {
  const { jobId, name, message, price } = req.body;

  if (!jobId || !name || !message) {
    return res.status(400).json({
      message: "Попълни всички полета!"
    });
  }

  const application = {
    id: applications.length + 1,
    jobId: Number(jobId),
    name,
    message,
    price: price ? Number(price) : 0
  };

  applications.push(application);

  res.json({
    message: "Кандидатурата е изпратена ✅"
  });
});

app.get("/applications/:jobId", (req, res) => {
  const jobId = Number(req.params.jobId);
  const jobApplications = applications.filter(app => app.jobId === jobId);
  res.json(jobApplications);
});

app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: "Попълни всички полета за регистрация."
    });
  }

  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.status(400).json({
      message: "Вече има потребител с този имейл."
    });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role
  };

  users.push(newUser);

  res.status(201).json({
    message: "Регистрацията е успешна ✅",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
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
      role: user.role
    }
  });
});

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

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});