const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const errorHandler = require("./middleware/error");

// Load env vars
dotenv.config();

const app = express();

// Body parser with increased limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  })
);

// Trust proxy settings
app.set("trust proxy", 1);

// Security middleware
const helmet = require("helmet");
app.use(helmet());

const xss = require("xss-clean");
app.use(xss());

// Set up rate limiting
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api/", limiter);

// Routes
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/tpo", require("./routes/tpoRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      keepAlive: true,
      keepAliveInitialDelay: 300000, // Keeps connection alive
    });

    console.log("MongoDB Connected Successfully!");
    console.log("Connected to database:", conn.connection.name);
    console.log("Connection state:", mongoose.connection.readyState);
    return conn;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Try to reconnect after 5 seconds
    console.log("Attempting to reconnect in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Initial connection
connectDB();

// Setup connection event handlers
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  // Try to reconnect on error
  console.log("Attempting to reconnect after error...");
  setTimeout(connectDB, 5000);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
  // Try to reconnect on disconnection
  console.log("Attempting to reconnect after disconnection...");
  setTimeout(connectDB, 5000);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled Rejection:", err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});
