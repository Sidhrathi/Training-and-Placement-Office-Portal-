const express = require('express');
const router = express.Router();
const TPO = require('../models/TPO');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const Exam = require('../models/Exam');
const LoginLog = require('../models/LoginLog');
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const ErrorLog = require('../models/ErrorLog');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      await LoginLog.create({
        userModel: 'Admin',
        action: 'failed_login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Log with activity logger
      await logger({
        action: 'Login Failed',
        details: `Failed login attempt for admin email: ${email}`,
        status: 'error',
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!admin.active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await LoginLog.create({
        userId: admin._id,
        userModel: 'Admin',
        action: 'failed_login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Log with activity logger
      await logger({
        action: 'Login Failed',
        details: `Failed login attempt for admin: ${admin.name}`,
        user: admin._id,
        userType: 'Admin',
        userName: admin.name,
        status: 'error',
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = admin.getSignedJwtToken();

    await LoginLog.create({
      userId: admin._id,
      userModel: 'Admin',
      action: 'login',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Log with activity logger
    await logger({
      action: 'Login',
      details: `Admin logged into the system`,
      user: admin._id,
      userType: 'Admin',
      userName: admin.name,
      status: 'success',
      ip: req.ip
    });

    admin.lastLogin = Date.now();
    await admin.save();

    res.status(200).json({
      success: true,
      token,
      role: admin.role
    });

  } catch (error) {
    console.error('Admin login error:', error);
    await ErrorLog.create({
      userModel: 'Admin',
      errorMessage: error.message,
      errorStack: error.stack,
      path: req.originalUrl
    });
    
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Protected routes below this line
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const [totalStudents, totalTPOs, activeJobDrives, examsConducted] = await Promise.all([
      Student.countDocuments(),
      TPO.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Exam.countDocuments()
    ]);

    const stats = {
      totalStudents,
      totalTPOs,
      activeJobDrives,
      examsConducted
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// TPO Management
router.get('/tpos', async (req, res) => {
  try {
    const tpos = await TPO.find().select('-password');
    res.json({
      success: true,
      data: tpos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch TPOs' 
    });
  }
});

router.post('/tpos', async (req, res) => {
  try {
    const { email } = req.body;
    let tpo = await TPO.findOne({ email });
    if (tpo) {
      return res.status(400).json({ 
        success: false, 
        message: 'TPO with this email already exists' 
      });
    }
    
    tpo = await TPO.create(req.body);
    const tpoResponse = tpo.toObject();
    delete tpoResponse.password;
    
    res.status(201).json({
      success: true,
      data: tpoResponse
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create TPO' 
    });
  }
});

router.put('/tpos/:id', async (req, res) => {
  try {
    const tpo = await TPO.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!tpo) {
      return res.status(404).json({
        success: false,
        message: 'TPO not found'
      });
    }

    res.json({
      success: true,
      data: tpo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update TPO'
    });
  }
});

router.delete('/tpos/:id', async (req, res) => {
  try {
    const tpo = await TPO.findByIdAndDelete(req.params.id);
    if (!tpo) {
      return res.status(404).json({
        success: false,
        message: 'TPO not found'
      });
    }

    res.json({
      success: true,
      message: 'TPO removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove TPO'
    });
  }
});

// Job Drive Management
router.get('/job-drives', async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('applications.student', 'name usn')
      .sort('-createdAt');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/job-drives', async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/job-drives/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({ message: 'Job drive not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/job-drives/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job drive not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exam Management
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'name')
      .sort('-scheduledDate');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/exams', async (req, res) => {
  try {
    // Transform frontend data to match Exam model schema
    const examData = {
      title: req.body.title,
      description: req.body.description || '',
      type: req.body.type,
      duration: parseInt(req.body.duration) || 60,
      totalMarks: parseInt(req.body.totalMarks) || 100,
      passingMarks: parseInt(req.body.passingMarks) || 40,
      // Map scheduledDate to scheduledFor as required by the model
      scheduledFor: req.body.scheduledDate || new Date(),
      // Set registration deadline to be same day if not provided
      registrationDeadline: req.body.registrationDeadline || req.body.scheduledDate || new Date(),
      eligibility: {
        // Map departments to branches in eligibility
        branches: req.body.eligibility?.departments || [],
        semester: req.body.eligibility?.semester?.map(sem => parseInt(sem)) || [],
        minCGPA: parseFloat(req.body.eligibility?.minCGPA) || 0,
        maxBacklogs: parseInt(req.body.eligibility?.maxBacklogs) || 0
      },
      // Initialize empty sections array if not provided
      sections: req.body.sections || [],
      status: req.body.status || 'scheduled',
      // Required field in the model - set to current admin user
      createdBy: req.user._id
    };

    const exam = await Exam.create(examData);
    res.status(201).json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to create exam' 
    });
  }
});

router.put('/exams/:id', async (req, res) => {
  try {
    // Transform frontend data to match Exam model schema
    const examData = {};
    
    // Only update fields that are provided
    if (req.body.title) examData.title = req.body.title;
    if (req.body.description !== undefined) examData.description = req.body.description;
    if (req.body.type) examData.type = req.body.type;
    if (req.body.duration) examData.duration = parseInt(req.body.duration);
    if (req.body.totalMarks) examData.totalMarks = parseInt(req.body.totalMarks);
    if (req.body.passingMarks) examData.passingMarks = parseInt(req.body.passingMarks);
    
    // Map date fields
    if (req.body.scheduledDate) examData.scheduledFor = req.body.scheduledDate;
    if (req.body.registrationDeadline) examData.registrationDeadline = req.body.registrationDeadline;
    
    // Handle eligibility
    if (req.body.eligibility) {
      examData.eligibility = {};
      
      if (req.body.eligibility.departments) {
        examData.eligibility.branches = req.body.eligibility.departments;
      }
      
      if (req.body.eligibility.semester) {
        examData.eligibility.semester = req.body.eligibility.semester.map(sem => parseInt(sem));
      }
      
      if (req.body.eligibility.minCGPA !== undefined) {
        examData.eligibility.minCGPA = parseFloat(req.body.eligibility.minCGPA);
      }
      
      if (req.body.eligibility.maxBacklogs !== undefined) {
        examData.eligibility.maxBacklogs = parseInt(req.body.eligibility.maxBacklogs);
      }
    }
    
    // Handle sections
    if (req.body.sections) examData.sections = req.body.sections;
    
    // Handle status
    if (req.body.status) examData.status = req.body.status;

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { $set: examData },
      { new: true, runValidators: true }
    );
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to update exam' 
    });
  }
});

router.delete('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logs Management
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get both login logs and activity logs
    const [activityLogs, activityTotal, loginLogs, loginTotal] = await Promise.all([
      ActivityLog.find()
        .sort('-timestamp')
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(),
      LoginLog.find()
        .sort('-timestamp')
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      LoginLog.countDocuments()
    ]);

    // Format activity logs to match the expected format for the frontend
    const formattedActivityLogs = activityLogs.map(log => ({
      _id: log._id,
      date: log.timestamp,
      time: new Date(log.timestamp).toLocaleTimeString(),
      event: log.action,
      user: log.userName,
      details: log.details,
      status: log.status
    }));

    // Format login logs to match the expected format for the frontend
    const formattedLoginLogs = loginLogs.map(log => ({
      _id: log._id,
      date: log.timestamp,
      time: new Date(log.timestamp).toLocaleTimeString(),
      event: log.action === 'login' ? 'Login' : log.action === 'logout' ? 'Logout' : 'Login Failed',
      user: log.userId ? log.userId.name : 'Unknown',
      details: `${log.action === 'login' ? 'User logged in' : log.action === 'logout' ? 'User logged out' : 'Failed login attempt'} (${log.userModel})`,
      status: log.action === 'login' || log.action === 'logout' ? 'success' : 'error'
    }));

    // Combine and sort both types of logs
    const combinedLogs = [...formattedActivityLogs, ...formattedLoginLogs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    const totalLogs = activityTotal + loginTotal;

    res.json({
      logs: combinedLogs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / limit),
      total: totalLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logs/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    // Search in both ActivityLog and LoginLog
    const [activityLogs, loginLogs] = await Promise.all([
      ActivityLog.find({
        $or: [
          { action: { $regex: query, $options: 'i' } },
          { details: { $regex: query, $options: 'i' } },
          { userName: { $regex: query, $options: 'i' } }
        ]
      }).sort('-timestamp'),
      
      LoginLog.find({
        $or: [
          { action: { $regex: query, $options: 'i' } },
          { userModel: { $regex: query, $options: 'i' } }
        ]
      })
      .sort('-timestamp')
      .populate('userId', 'name email')
    ]);

    // Format activity logs
    const formattedActivityLogs = activityLogs.map(log => ({
      _id: log._id,
      date: log.timestamp,
      time: new Date(log.timestamp).toLocaleTimeString(),
      event: log.action,
      user: log.userName,
      details: log.details,
      status: log.status
    }));

    // Format login logs
    const formattedLoginLogs = loginLogs.map(log => ({
      _id: log._id,
      date: log.timestamp,
      time: new Date(log.timestamp).toLocaleTimeString(),
      event: log.action === 'login' ? 'Login' : log.action === 'logout' ? 'Logout' : 'Login Failed',
      user: log.userId ? log.userId.name : 'Unknown',
      details: `${log.action === 'login' ? 'User logged in' : log.action === 'logout' ? 'User logged out' : 'Failed login attempt'} (${log.userModel})`,
      status: log.action === 'login' || log.action === 'logout' ? 'success' : 'error'
    }));

    // Combine and sort logs
    const combinedLogs = [...formattedActivityLogs, ...formattedLoginLogs]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ logs: combinedLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logs/export', async (req, res) => {
  try {
    // Get all logs
    const [activityLogs, loginLogs] = await Promise.all([
      ActivityLog.find().sort('-timestamp'),
      LoginLog.find().sort('-timestamp').populate('userId', 'name email')
    ]);

    // Format activity logs
    const formattedActivityLogs = activityLogs.map(log => ({
      date: new Date(log.timestamp).toLocaleDateString(),
      time: new Date(log.timestamp).toLocaleTimeString(),
      event: log.action,
      user: log.userName,
      details: log.details,
      status: log.status,
      ip: log.ip
    }));

    // Format login logs
    const formattedLoginLogs = loginLogs.map(log => ({
      date: new Date(log.timestamp).toLocaleDateString(),
      time: new Date(log.timestamp).toLocaleTimeString(),
      event: log.action === 'login' ? 'Login' : log.action === 'logout' ? 'Logout' : 'Login Failed',
      user: log.userId ? log.userId.name : 'Unknown',
      details: `${log.action === 'login' ? 'User logged in' : log.action === 'logout' ? 'User logged out' : 'Failed login attempt'} (${log.userModel})`,
      status: log.action === 'login' || log.action === 'logout' ? 'success' : 'error',
      ip: log.ipAddress
    }));

    // Combine and sort logs
    const combinedLogs = [...formattedActivityLogs, ...formattedLoginLogs]
      .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    // Convert to CSV
    const fields = ['date', 'time', 'event', 'user', 'details', 'status', 'ip'];
    const csv = combinedLogs.map(log => {
      return fields.map(field => {
        // Handle fields that might contain commas by wrapping in quotes
        let value = log[field] || '';
        if (value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      }).join(',');
    });
    
    csv.unshift(fields.join(','));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=system_logs.csv');
    res.status(200).send(csv.join('\n'));
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to export logs' 
    });
  }
});

// Add specific activity log route to manually add logs (for testing)
router.post('/logs', async (req, res) => {
  try {
    const { action, details, resource, resourceId, status } = req.body;
    
    await logger({
      action,
      details,
      user: req.user._id,
      userType: 'Admin',
      userName: req.user.name,
      resource,
      resourceId,
      status: status || 'info',
      ip: req.ip
    });
    
    res.status(201).json({ success: true, message: 'Log created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Announcement Management
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort('-createdAt')
      .populate('createdBy', 'name');
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id,
      creatorType: 'Admin'
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search Routes
router.get('/search/students', async (req, res) => {
  try {
    const { query } = req.query;
    const students = await Student.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { usn: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tpos/search', async (req, res) => {
  try {
    const { q } = req.query;
    const tpos = await TPO.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ]
    }).select('-password');
    res.json({
      success: true,
      data: tpos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Search failed' 
    });
  }
});

// Student Management
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().select('-password -resume.file');
    res.json(students);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch students' 
    });
  }
});

router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch student' 
    });
  }
});

router.put('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    res.json(student);
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update student' 
    });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Student deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete student' 
    });
  }
});

router.get('/students/export', async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    
    // Convert to CSV format
    const fields = ['name', 'usn', 'department', 'currentSemester', 'currentSemesterCGPA', 'percentage10', 'percentage12', 'backlogs', 'email', 'placementStatus'];
    const csv = students.map(student => {
      const data = {
        name: student.name,
        usn: student.usn,
        department: student.department,
        currentSemester: student.currentSemester || student.semester,
        currentSemesterCGPA: student.currentSemesterCGPA || student.cgpa || student.percentageDegree,
        percentage10: student.percentage10 || student.tenthPercentage,
        percentage12: student.percentage12 || student.twelfthPercentage,
        backlogs: student.backlogs || 0,
        email: student.email,
        placementStatus: student.placementStatus || 'Not Placed'
      };
      return fields.map(field => data[field]).join(',');
    });
    
    csv.unshift(fields.join(','));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.status(200).send(csv.join('\n'));
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to export students' 
    });
  }
});

module.exports = router;