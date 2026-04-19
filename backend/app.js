const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const rateLimit = require("./config/rateLimit");
const errorHandler = require("./middleware/error");

const app = express();

// Create upload directories if they don't exist
const uploadDirs = [
  "uploads/resumes",
  "uploads/job-documents",
  "uploads/offer-letters",
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
app.use(rateLimit);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route files
const adminRoutes = require("./routes/adminRoutes");
const tpoRoutes = require("./routes/tpoRoutes");
const studentRoutes = require("./routes/studentRoutes");
const jobRoutes = require("./routes/jobRoutes");
const examRoutes = require("./routes/examRoutes");

// Mount routes
app.use("/api/admin", adminRoutes);
app.use("/api/tpo", tpoRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/exams", examRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
