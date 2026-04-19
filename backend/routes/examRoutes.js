const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const ExamLog = require('../models/ExamLog');
const ExamResult = require('../models/ExamResult');
const ActivityLog = require('../models/ActivityLog');
const ErrorLog = require('../models/ErrorLog');
const { protect, authorize } = require('../middleware/auth');
const { uploadJobDocuments, handleUploadError } = require('../middleware/fileUpload');
const {
  checkExam,
  validateExamTiming,
  checkRegistration,
  logExamActivity,
  validateSubmission,
  handleExamError
} = require('../middleware/exam');
const examController = require('../controllers/examController');

// Protect all routes
router.use(protect);

// Add error handling middleware for exam routes
router.use((err, req, res, next) => {
  console.error('Exam route error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Get all exams (with filters)
router.get('/', async (req, res) => {
  try {
    const { type, status, upcoming } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (upcoming === 'true') {
      query.scheduledFor = { $gt: new Date() };
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name email')
      .sort({ scheduledFor: -1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new exam - using the controller
router.post('/', authorize('TPO', 'admin'), examController.createExam);

// Upload questions file for an exam
router.post('/:id/questions-file', authorize('TPO'), examController.uploadQuestionsFile);

// Upload questions for an exam (CSV/Excel)
router.post('/:id/questions/upload', authorize('TPO'), examController.uploadExamQuestions);

// Process questions file without an existing exam
router.post('/questions/upload', authorize('TPO'), examController.processQuestionsFile);

// Add a section to an exam
router.post('/:id/sections', authorize('TPO'), examController.addExamSection);

// Add a question to a section
router.post('/:id/sections/:sectionId/questions', authorize('TPO'), examController.addQuestionToSection);

// Get exam by ID
router.get('/:id', checkExam, async (req, res) => {
  try {
    // The checkExam middleware already validated and cleaned the exam ID
    // and attached the exam to req.exam
    
    // Reuse exam from middleware but populate any additional fields needed
    const exam = await Exam.findById(req.exam._id)
      .populate('createdBy', 'name email')
      .populate('registeredStudents.student', 'name usn branch');
    
    if (!exam) {
      console.warn(`Exam not found with ID: ${req.params.id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found. It may have been removed or you have incorrect access.' 
      });
    }
    
    // Log the successful retrieval
    console.log(`Exam "${exam.title}" retrieved successfully by ${req.user.name || req.user.email || 'user'}`);
    
    // Return the exam data
    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve exam',
      error: error.message 
    });
  }
});

// Update exam
router.put('/:id', checkExam, uploadJobDocuments, handleUploadError, async (req, res) => {
  try {
    // Handle file uploads if any
    if (req.files) {
      req.body.documents = req.files.map(file => ({
        title: file.originalname,
        file: file.path
      }));
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    res.json(exam);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Activate exam
router.put('/:id/activate', authorize('TPO'), examController.activateExam);

// Delete exam
router.delete('/:id', checkExam, async (req, res) => {
  try {
    await req.exam.remove();

    // Notify registered students about cancellation
    const registeredStudentIds = req.exam.registeredStudents.map(r => r.student);
    if (registeredStudentIds.length > 0) {
      await Notification.createMultiple({
        title: `Mock Test Cancelled: ${req.exam.title}`,
        message: `The mock test scheduled for ${new Date(req.exam.scheduledFor).toLocaleDateString()} has been cancelled.`,
        type: 'exam',
        priority: 'high',
        createdBy: {
          user: req.user.id,
          userModel: 'TPO'
        }
      }, registeredStudentIds, 'Student');
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register for exam
router.post('/:id/register', 
  checkExam,
  logExamActivity('register'),
  async (req, res) => {
    try {
      if (!req.exam.isRegistrationOpen) {
        return res.status(400).json({ message: 'Registration is closed' });
      }

      // Check if student is already registered
      if (req.exam.registeredStudents.some(r => r.student.toString() === req.user.id)) {
        return res.status(400).json({ message: 'Already registered' });
      }

      // Check eligibility
      const student = await Student.findById(req.user.id);
      const isEligible = await req.exam.isStudentEligible(student);
      if (!isEligible) {
        return res.status(400).json({ message: 'Not eligible for this exam' });
      }

      req.exam.registeredStudents.push({
        student: req.user.id,
        registeredAt: new Date()
      });

      await req.exam.save();

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
});

// Start exam
router.post('/:id/start',
  checkExam,
  checkRegistration,
  validateExamTiming,
  logExamActivity('start'),
  async (req, res) => {
    try {
      res.json({
        exam: {
          title: req.exam.title,
          duration: req.exam.duration,
          sections: req.exam.sections.map(section => ({
            name: section.name,
            duration: section.duration,
            questions: section.questions.map(q => ({
              id: q._id,
              type: q.type,
              question: q.question,
              options: q.options,
              marks: q.marks
            }))
          }))
        },
        startTime: new Date()
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
});

// Use the examController for exam submission
router.post('/:id/submit', examController.submitExam);
        
        // Get exam results
router.get('/:id/results',
  checkExam,
  async (req, res) => {
    try {
      // Use findById with populate instead of chaining on req.exam
      const exam = await Exam.findById(req.params.id)
        .populate('results.student', 'name usn branch');
      
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      
      res.json(exam.results);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
});

// Export results to CSV
router.get('/:id/results/export',
  checkExam,
  async (req, res) => {
    try {
      // Use findById with populate instead of chaining
      const exam = await Exam.findById(req.params.id)
        .populate('results.student', 'name usn branch');
      
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const fields = ['name', 'usn', 'branch', 'score', 'percentage', 'status'];
      const csv = exam.results.map(result => 
        [
          result.student.name,
          result.student.usn,
          result.student.branch,
          result.score,
          result.percentage.toFixed(2),
          result.status
        ].join(',')
      );
      csv.unshift(fields.join(','));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${req.exam.title.replace(/\s+/g, '_')}_results.csv`);
      res.status(200).send(csv.join('\n'));
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
});

// Get exam statistics
router.get('/:id/stats',
  checkExam,
  async (req, res) => {
    try {
      const stats = await ExamLog.getExamStats(req.exam._id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
});

// Get exam questions for student
router.get('/:id/questions',
  checkExam,
  checkRegistration,
  validateExamTiming,
  logExamActivity('view_questions'),
  async (req, res) => {
    try {
      // Get questions from sections or fallback to old format
      let questions = [];
      
      if (req.exam.sections && req.exam.sections.length > 0) {
        console.log(`Exam has ${req.exam.sections.length} sections`);
        
        // Extract questions from sections
        req.exam.sections.forEach(section => {
          console.log(`Processing section ${section.name} with ${section.questions ? section.questions.length : 0} questions`);
          
          if (!section.questions || section.questions.length === 0) {
            console.warn(`Section ${section.name} has no questions`);
            return;
          }
          
          const sectionQuestions = section.questions.map(q => ({
            _id: q._id,
            question: q.question,
            type: q.type || 'MCQ',
            options: q.options,
            marks: q.marks || 1,
            section: section.name
          }));
          
          questions = [...questions, ...sectionQuestions];
        });
      } else if (req.exam.questions && req.exam.questions.length > 0) {
        console.log(`Exam has ${req.exam.questions.length} questions in old format`);
        
        // Use old format questions
        questions = req.exam.questions.map(q => ({
          _id: q._id,
          question: q.question,
          type: q.type || 'MCQ',
          options: q.options,
          marks: q.marks || 1
        }));
      }
      
      console.log(`Total questions prepared: ${questions.length}`);
      
      // If no questions were found, create a sample question for debugging
      if (questions.length === 0) {
        console.warn('No questions found for this exam - creating a sample question for debugging');
        questions = [{
          _id: new mongoose.Types.ObjectId(),
          question: 'Sample question - this exam appears to have no configured questions',
          type: 'MCQ',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          marks: 1
        }];
      }
      
      // Randomize questions if configured
      if (req.exam.randomizeQuestions) {
        console.log('Randomizing question order');
        questions = questions.sort(() => Math.random() - 0.5);
      }
      
      // Return questions with success flag for consistency
      console.log(`Sending ${questions.length} questions to client`);
      res.status(200).json({
        success: true,
        data: questions
      });
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve exam questions: ' + (error.message || 'Unknown error')
      });
    }
});

module.exports = router;