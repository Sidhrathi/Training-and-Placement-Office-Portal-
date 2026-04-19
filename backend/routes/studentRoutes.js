const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const ExamResult = require("../models/ExamResult"); // Add ExamResult model
const { protect } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");
const { sendEmail, generateOTPEmailTemplate } = require("../utils/sendEmail");

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "resumes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes");
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.usn}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF and Word documents are allowed!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post("/register", upload.single("resume"), async (req, res) => {
  try {
    const {
      name,
      usn,
      email,
      password,
      department,
      branch,
      currentSemester,
      currentSemesterCGPA,
      percentage10,
      percentage12,
      percentageDegree,
      percentageMasters,
      city,
      state,
      phone,
    } = req.body;

    // Check if student with this email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent && existingStudent.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    } else if (existingStudent && !existingStudent.isEmailVerified) {
      // If unverified account exists, delete it so they can start fresh
      await Student.findByIdAndDelete(existingStudent._id);
    }
    // Create student with file info
    const student = await Student.create({
      name,
      usn: usn.toUpperCase(),
      email,
      password,
      department,
      branch,
      semester: parseInt(currentSemester),
      tenthPercentage: parseFloat(percentage10),
      twelfthPercentage: parseFloat(percentage12),
      degreePercentage: parseFloat(percentageDegree),
      mastersPercentage: percentageMasters
        ? parseFloat(percentageMasters)
        : undefined,
      cgpa: parseFloat(currentSemesterCGPA),
      city,
      state,
      phoneNumber: phone,
      isEmailVerified: false,
      resume: req.file
        ? {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            mimeType: req.file.mimetype,
            path: req.file.path,
            uploadDate: Date.now(),
          }
        : undefined,
    });

    // Generate OTP
    const otp = await student.generateEmailVerificationOTP();

    // Send verification email
    try {
      await sendEmail({
        email: student.email,
        subject: "Email Verification - KLE Training and Placement Cell",
        html: generateOTPEmailTemplate(student.name, otp),
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Delete the created student if email fails
      await Student.findByIdAndDelete(student._id);
      return res.status(500).json({
        success: false,
        message: "Registration failed: Could not send verification email",
      });
    }

    // Don't send token until email is verified
    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email with the OTP sent.",
      data: {
        id: student._id,
        name: student.name,
        usn: student.usn,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { usn, password } = req.body;

    // Find student and include password for comparison
    const student = await Student.findOne({ usn: usn.toUpperCase() }).select(
      "+password"
    );

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    } // Check password
    const isMatch = await student.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!student.isEmailVerified) {
      // Generate new OTP for convenience
      const otp = await student.generateEmailVerificationOTP();

      // Send verification email
      try {
        await sendEmail({
          email: student.email,
          subject: "Email Verification - KLE Training and Placement Cell",
          html: generateOTPEmailTemplate(student.name, otp),
        });
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
      }

      return res.status(403).json({
        success: false,
        message:
          "Email not verified. A new verification OTP has been sent to your email.",
        requiresVerification: true,
        data: {
          id: student._id,
          email: student.email,
        },
      });
    }

    // Generate token
    const token = student.getSignedJwtToken();

    // Remove password from response data
    const userData = {
      id: student._id,
      name: student.name,
      usn: student.usn,
      department: student.department,
      semester: student.semester,
    };

    res.status(200).json({
      success: true,
      token,
      data: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
});

// Protected routes
router.get("/profile", protect, async (req, res) => {
  try {
    console.log("Profile request received for user ID:", req.user.id);

    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "Database connection not established. Current state:",
        mongoose.connection.readyState
      );
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again later.",
        dbState: mongoose.connection.readyState,
      });
    }

    if (!req.user || !req.user.id) {
      console.error("User data missing in request");
      return res.status(401).json({
        success: false,
        message: "Authentication failed - user data missing",
      });
    }

    try {
      // Populate job details in appliedJobs
      const student = await Student.findById(req.user.id).populate({
        path: "appliedJobs.jobId",
        select: "companyName jobRole location package",
      });

      if (!student) {
        console.error("Student not found with ID:", req.user.id);
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      // Transform appliedJobs to include job details directly
      if (student.appliedJobs && student.appliedJobs.length > 0) {
        student.appliedJobs = student.appliedJobs.map((app) => {
          const job = app.jobId;
          return {
            _id: app._id,
            jobId: job?._id || app.jobId,
            appliedDate: app.appliedDate,
            status: app.status,
            // Add these properties from the job document
            companyName: job?.companyName || "Unknown Company",
            jobRole: job?.jobRole || "Unknown Role",
            company: job?.companyName || "Unknown Company",
            role: job?.jobRole || "Unknown Role",
            location: job?.location,
          };
        });
      }

      console.log(
        "Profile data successfully retrieved for student:",
        student.usn
      );
      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: dbError.message,
      });
    }
  } catch (error) {
    console.error("Error in /profile endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student profile",
      error: error.message,
    });
  }
});

router.put("/profile", protect, upload.single("resume"), async (req, res) => {
  try {
    console.log("Profile update request received:", req.body);
    const updateData = { ...req.body };

    // Handle number conversions for all numeric fields
    if (updateData.percentage10)
      updateData.tenthPercentage = parseFloat(updateData.percentage10);
    if (updateData.percentage12)
      updateData.twelfthPercentage = parseFloat(updateData.percentage12);
    if (updateData.percentageDegree)
      updateData.degreePercentage = parseFloat(updateData.percentageDegree);
    if (updateData.currentSemester)
      updateData.semester = parseInt(updateData.currentSemester);
    if (updateData.currentSemesterCGPA)
      updateData.cgpa = parseFloat(updateData.currentSemesterCGPA);

    // Map frontend field names to backend field names if they're different
    if (updateData.phone) updateData.phoneNumber = updateData.phone;

    // Handle resume file
    if (req.file) {
      const resumeData = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        path: req.file.path,
        uploadDate: Date.now(),
      };
      updateData.resume = resumeData;
      console.log("Resume uploaded:", resumeData.originalName);
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

// Get resume
router.get("/resume", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("resume");

    if (!student?.resume?.path) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Read the file from the file system
    // Resolve path from project root to handle both absolute and relative paths
    const filePath = path.isAbsolute(student.resume.path) 
      ? student.resume.path 
      : path.join(process.cwd(), student.resume.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("Resume file not found at path:", filePath);
      console.error("Original path from DB:", student.resume.path);
      return res.status(404).json({
        success: false,
        message: "Resume file not found on server",
      });
    }

    // Set appropriate content type based on file extension
    const mimeType = student.resume.mimeType || "application/octet-stream";

    // Set headers for proper file handling
    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${student.resume.originalName}"`
    );

    // Stream the file instead of loading it into memory
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      console.error("Error streaming resume:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error reading resume file",
          error: err.message,
        });
      }
    });

    // Pipe the file directly to the response
    fileStream.pipe(res);
  } catch (error) {
    console.error("Resume download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download resume",
      error: error.message,
    });
  }
});

// Exam results
router.get("/exam-results", protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find all exam results for this student
    const examResults = await ExamResult.find({ student: studentId })
      .populate({
        path: "exam",
        select: "title type maxScore passingPercentage",
      })
      .sort({ createdAt: -1 });

    // Transform data to match the expected format in the frontend
    const transformedResults = examResults.map((result) => ({
      _id: result._id,
      examId: {
        _id: result.exam._id,
        name: result.exam.title,
        type: result.exam.type,
        maxScore: result.exam.maxScore || result.maxScore,
        passingPercentage: result.exam.passingPercentage || 60,
      },
      score: result.score,
      maxScore: result.maxScore,
      date: result.endTime,
      status:
        result.percentageScore >= (result.exam.passingPercentage || 60)
          ? "Passed"
          : "Failed",
    }));

    res.json(transformedResults);
  } catch (error) {
    console.error("Error fetching exam results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam results",
      error: error.message,
    });
  }
});

// Job applications
router.get("/applications", protect, async (req, res) => {
  try {
    // Fetch student data with populated job details
    const student = await Student.findById(req.user.id).populate({
      path: "appliedJobs.jobId",
      select: "companyName jobRole location package",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Transform the data to include job details
    const appliedJobs = student.appliedJobs.map((application) => {
      const job = application.jobId;
      return {
        _id: application._id,
        jobId: job?._id || application.jobId,
        appliedDate: application.appliedDate,
        status: application.status,
        // Add these properties from the job document
        companyName: job?.companyName || "Unknown Company",
        jobRole: job?.jobRole || "Unknown Role",
        location: job?.location,
        package: job?.package,
      };
    });

    res.json(appliedJobs);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/apply-job/:jobId", protect, async (req, res) => {
  try {
    // Check if student schema has appliedJobs field

    const student = await Student.findById(req.user.id);

    // Check if the schema supports appliedJobs
    if (!student.appliedJobs) {
      // Need to update the schema first to support this feature
      return res.status(400).json({
        success: false,
        message:
          "Job application feature not available yet. Schema update required.",
      });
    }

    // If the field exists, continue with normal logic
    if (
      student.appliedJobs.some(
        (app) => app.jobId.toString() === req.params.jobId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Already applied to this job",
      });
    }

    // Get the job details to save reference info along with the application
    const Job = mongoose.model("Job");
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Add job application with essential job details
    student.appliedJobs.push({
      jobId: req.params.jobId,
      appliedDate: Date.now(),
      status: "Applied",
      // Store job details directly in the application object for easy access
      companyName: job.companyName,
      jobRole: job.jobRole,
      location: job.location || null,
    });

    job.applications.push({
      student: student._id,
    });

    await student.save();
    await job.save();
    res.json({
      success: true,
      message: "Successfully applied to job",
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply for job",
      error: error.message,
    });
  }
});

// Get available exams for students
router.get("/available-exams", protect, async (req, res) => {
  try {
    // Find all exams regardless of status to apply dynamic status calculation
    const today = new Date();
    const exams = await mongoose
      .model("Exam")
      .find({})
      .select(
        "title type scheduledFor duration startDate endDate status passingPercentage instructions"
      )
      .sort({ scheduledFor: 1 });

    console.log(`Found ${exams.length} exams for student dashboard`);

    // Format exam data to match frontend expectations and calculate status based on dates
    const formattedExams = exams.map((exam) => {
      // Determine the exam status based on current date compared to startDate and endDate
      let calculatedStatus;
      const now = new Date();

      // If exam has startDate and endDate, use them to determine status
      if (exam.startDate && exam.endDate) {
        if (now >= new Date(exam.startDate) && now <= new Date(exam.endDate)) {
          calculatedStatus = "Active";
        } else if (now < new Date(exam.startDate)) {
          calculatedStatus = "Scheduled";
        } else {
          calculatedStatus = "Expired"; // Past the end date
        }
      } else {
        // Fall back to the saved status if dates aren't available
        calculatedStatus =
          exam.status === "Ongoing" || exam.status.toLowerCase() === "active"
            ? "Active"
            : exam.status;
      }

      return {
        _id: exam._id,
        title: exam.title,
        type: exam.type.toLowerCase(), // Convert to lowercase for frontend consistency
        scheduledDate: exam.scheduledFor,
        duration: exam.duration,
        status: calculatedStatus,
        passingPercentage: exam.passingPercentage || 50,
        instructions: exam.instructions || "No instructions provided.",
        startDate: exam.startDate,
        endDate: exam.endDate,
      };
    });

    console.log(
      `Formatted ${formattedExams.length} exams with ${
        formattedExams.filter((e) => e.status === "Active").length
      } active exams`
    );
    res.json(formattedExams);
  } catch (error) {
    console.error("Error fetching available exams:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available exams",
      error: error.message,
    });
  }
});

// Route to verify OTP
router.post("/verify-email", async (req, res) => {
  try {
    const { studentId, otp } = req.body;

    if (!studentId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide student ID and OTP",
      });
    }

    // Find student by ID
    const student = await Student.findById(studentId).select(
      "+emailVerificationOTP +otpExpires"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify OTP
    const isValid = await student.verifyEmailOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Generate token after successful verification
    const token = student.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        isEmailVerified: student.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
});

// Route to resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide student ID",
      });
    }

    // Find student by ID
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Generate new OTP
    const otp = await student.generateEmailVerificationOTP();

    // Send verification email
    await sendEmail({
      email: student.email,
      subject: "Email Verification - KLE Training and Placement Cell",
      html: generateOTPEmailTemplate(student.name, otp),
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
});

module.exports = router;
