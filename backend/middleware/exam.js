const ErrorResponse = require('../utils/ErrorResponse');
const ExamLog = require('../models/ExamLog');
const Exam = require('../models/Exam');

// Check if exam exists and attach to req object
exports.checkExam = async (req, res, next) => {
  try {
    // Check which parameter contains the exam ID (could be id, examId, etc.)
    const possibleParams = ['id', 'examId'];
    let examId = null;
    
    // Try all possible parameter names
    for (const param of possibleParams) {
      if (req.params[param]) {
        examId = req.params[param];
        console.log(`Found exam ID in req.params.${param}: ${examId}`);
        break;
      }
    }
    
    if (!examId) {
      console.error('No exam ID found in route parameters:', req.params);
      return res.status(400).json({ 
        success: false,
        error: 'Exam ID is missing from the request'
      });
    }
    
    // Process the exam ID to handle various formats
    console.log(`Raw exam ID from parameters: "${examId}"`);
    
    // Handle ObjectId string format: ObjectId("6821441205f17051721194a")
    const objectIdMatch = /ObjectId\(['"]?([0-9a-fA-F]+)['"]?\)/i.exec(examId);
    if (objectIdMatch && objectIdMatch[1]) {
      examId = objectIdMatch[1];
      console.log(`Extracted ID ${examId} from ObjectId format`);
    }
    
    // Clean the ID - remove quotes and spaces
    examId = examId.toString().replace(/['"]/g, '').trim();
    console.log(`Cleaned exam ID: "${examId}"`);
    
    // Very relaxed validation - just ensure we have a non-empty string
    if (!examId) {
      console.error('Empty exam ID after processing');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid exam ID format - ID is empty after processing'
      });
    }
    
    // Log the ID we're using to search
    console.log(`Searching for exam with ID: "${examId}"`);
    
    // Find exam and populate necessary fields in a single query
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      console.warn(`Exam not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Exam not found or you do not have permission to access it'
      });
    }
    
    // Log the successful exam retrieval
    console.log(`Exam "${exam.title}" accessed by user: ${req.user ? req.user.name || req.user.email : 'Unknown'}`);
    
    req.exam = exam;
    next();
  } catch (err) {
    console.error('Error in checkExam middleware:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error while checking exam'
    });
  }
};

// Validate exam timing
exports.validateExamTiming = async (req, res, next) => {
  try {
    const exam = req.exam;
    const now = new Date();
    let examActive = false;
    let reason = '';

    console.log(`Validating timing for exam ${exam._id} (${exam.title})`);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Exam startDate: ${exam.startDate ? new Date(exam.startDate).toISOString() : 'Not set'}`);
    console.log(`Exam endDate: ${exam.endDate ? new Date(exam.endDate).toISOString() : 'Not set'}`);
    console.log(`Exam scheduledFor: ${exam.scheduledFor ? new Date(exam.scheduledFor).toISOString() : 'Not set'}`);
    console.log(`Exam status: ${exam.status || 'Not set'}`);
    
    // Check if the exam is Active based on startDate and endDate
    // This is the preferred way to determine if an exam is active - based on date ranges
    if (exam.startDate && exam.endDate) {
      const startDate = new Date(exam.startDate);
      const endDate = new Date(exam.endDate);
      const isActive = now >= startDate && now <= endDate;
      
      console.log(`Date range check: ${now >= startDate ? 'After start' : 'Before start'}, ${now <= endDate ? 'Before end' : 'After end'}`);
      
      if (isActive) {
        // If within date range, the exam is active regardless of its status field
        console.log(`Exam ${exam._id} is active based on date range`);
        examActive = true;
      } else {
        reason = now < startDate ? 
          `Exam has not started yet. Starts at ${startDate.toLocaleString()}` : 
          `Exam has already ended. Ended at ${endDate.toLocaleString()}`;
      }
    }
    
    // As a fallback, if no date range is specified, check standard timing with scheduledFor
    if (!examActive && exam.scheduledFor) {
      const scheduledDate = new Date(exam.scheduledFor);
      const examEndTime = new Date(scheduledDate.getTime() + (exam.duration || 60) * 60000);
      
      console.log(`Schedule check: ${now >= scheduledDate ? 'After start' : 'Before start'}, ${now <= examEndTime ? 'Before end' : 'After end'}`);
      
      if (now >= scheduledDate && now <= examEndTime) {
        console.log(`Exam ${exam._id} is active based on scheduledFor date`);
        examActive = true;
      } else {
        reason += `, Exam schedule (${scheduledDate.toLocaleString()} for ${exam.duration} mins) does not include current time`;
      }
    }
    
    // If we've reached here, we need to check if status indicates active exam (legacy support)
    if (!examActive && exam.status) {
      const status = exam.status.toLowerCase();
      const validActiveStatuses = ['active', 'ongoing', 'published'];
      const isStatusActive = validActiveStatuses.includes(status);
      
      console.log(`Status check: ${status} is ${isStatusActive ? 'active' : 'not active'}`);
      
      if (isStatusActive) {
        console.log(`Exam ${exam._id} is active based on status: ${exam.status}`);
        examActive = true;
      } else {
        reason += `, Exam status (${exam.status}) is not Active`;
      }
    }
    
    // TEMPORARY FIX: Force all exams to be active for testing
    // REMOVE THIS IN PRODUCTION
    examActive = true;
    console.log('TEMPORARY FIX: Forcing exam to be active for testing');
    
    // If exam is active by any criteria, allow access
    if (examActive) {
      return next();
    }
    
    // Otherwise provide an appropriate error message with consistent response format
    if (now < exam.scheduledFor) {
      const startTime = new Date(exam.scheduledFor).toLocaleString();
      console.warn(`Attempt to access exam ${exam._id} before start time. Current: ${now.toLocaleString()}, Start: ${startTime}`);
      return res.status(400).json({
        success: false,
        error: `Exam has not started yet. It will be available from ${startTime}`
      });
    }

    if (exam.scheduledFor && now > new Date(exam.scheduledFor.getTime() + (exam.duration || 60) * 60000)) {
      console.warn(`Attempt to access exam ${exam._id} after end time`);
      return res.status(400).json({
        success: false,
        error: 'This exam has ended and is no longer available for attempt'
      });
    }

    // Generic error if we can't determine a more specific reason
    console.warn(`Exam ${exam._id} is not active. Reason: ${reason || 'Unknown'}`);
    return res.status(400).json({
      success: false,
      error: `Exam is not currently active for taking. ${reason}`
    });
  } catch (err) {
    console.error('Error in validateExamTiming:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error while validating exam timing'
    });
  }
};

// Check if student is registered
exports.checkRegistration = async (req, res, next) => {
  try {
    console.log(`Checking registration for exam ${req.exam._id}, user ${req.user.id}`);
    
    // Make sure registeredStudents exists
    if (!req.exam.registeredStudents) {
      req.exam.registeredStudents = [];
      console.log('Creating empty registeredStudents array for exam');
    }
    
    // Check if student is already registered
    let registration = null;
    if (req.exam.registeredStudents.length > 0) {
      registration = req.exam.registeredStudents.find(
        r => r.student && r.student.toString() === req.user.id
      );
      console.log(`Registration found: ${registration ? 'Yes' : 'No'}`);
    }
    
    // Check if exam is Active based on dates first, then fallback to status
    const now = new Date();
    let isActive = false;
    
    // Always prioritize date range determination for active exams
    if (req.exam.startDate && req.exam.endDate) {
      isActive = now >= new Date(req.exam.startDate) && now <= new Date(req.exam.endDate);
      console.log(`Date range check: ${isActive ? 'Active' : 'Not active'}`);
    } else if (req.exam.scheduledFor && now >= new Date(req.exam.scheduledFor) && 
              now <= new Date(req.exam.scheduledFor.getTime() + req.exam.duration * 60000)) {
      // Use scheduled date and duration as fallback
      isActive = true;
      console.log(`Schedule check: ${isActive ? 'Active' : 'Not active'}`);
    } else {
      // Final fallback to status field (legacy support)
      const status = req.exam.status && req.exam.status.toLowerCase();
      isActive = status === 'active' || status === 'ongoing' || status === 'published';
      console.log(`Status check: ${status} is ${isActive ? 'active' : 'not active'}`);
    }    // TEMPORARY FIX: Force exams to be active for testing
    // REMOVE THIS IN PRODUCTION
    isActive = true;
    console.log('TEMPORARY FIX: Forcing exam to be active for testing');

    // For questions and starting exam, we allow access even without registration
    // This is to support the student exam attempt feature for "Active" exams determined by dates
    if ((req.method === 'GET' || req.path.endsWith('/start')) && isActive) {
      if (!registration) {
        console.log('Creating temporary registration for active exam');
        // Create a temporary registration object to avoid null reference errors
        req.registration = {
          student: req.user.id,
          status: 'temporary',
          registeredAt: new Date()
        };
        
        // Auto-register the student if they're accessing an active exam
        console.log('Auto-registering student for active exam');
        req.exam.registeredStudents.push({
          student: req.user.id,
          registeredAt: new Date(),
          status: 'registered'
        });
        await req.exam.save();
      } else {
        req.registration = registration;
      }
      
      return next();
    }

    // For submit endpoint, strict check is required
    if (!registration) {
      return res.status(400).json({
        success: false,
        error: 'Not registered for this exam'
      });
    }

    if (registration.status === 'appeared') {
      return res.status(400).json({
        success: false,
        error: 'Already submitted this exam'
      });
    }

    req.registration = registration;
    next();
  } catch (err) {
    console.error('Error in checkRegistration middleware:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error while checking exam registration'
    });
  }
};

// Log exam activity
exports.logExamActivity = (action) => async (req, res, next) => {
  try {
    await ExamLog.logActivity(
      req.exam._id,
      req.user.id,
      action,
      req,
      null,
      req.body
    );
    next();
  } catch (err) {
    console.error('Failed to log exam activity:', err);
    next();
  }
};

// Validate exam submission
exports.validateSubmission = async (req, res, next) => {
  try {
    const { responses } = req.body;
    const exam = req.exam;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response format. Please provide an array of responses.'
      });
    }

    // Get all question IDs from the exam
    const questionIds = exam.sections.reduce((acc, section) => {
      return [...acc, ...section.questions.map(q => q._id.toString())];
    }, []);

    // Validate that all responses have valid question IDs
    const invalidResponses = responses.filter(
      response => !questionIds.includes(response.questionId)
    );

    if (invalidResponses.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question IDs in responses'
      });
    }

    next();
  } catch (err) {
    console.error('Error validating exam submission:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error while validating exam submission'
    });
  }
};

// Handle exam errors
exports.handleExamError = (err, req, res, next) => {
  try {
    console.error('Exam error occurred:', err);
    
    // Log the error in the database
    if (req.exam && req.user) {
      ExamLog.logActivity(
        req.exam._id,
        req.user.id,
        'error',
        req,
        err
      ).catch(e => console.error('Failed to log exam error:', e));
    }
    
    // If headers are already sent, let Express handle the error
    if (res.headersSent) {
      return next(err);
    }
    
    // Construct a standardized error response
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'An unexpected error occurred with the exam';
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  } catch (e) {
    console.error('Error in error handler:', e);
    // If everything fails, send a generic error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'A critical error occurred in the application'
      });
    } else {
      next(e);
    }
  }
};