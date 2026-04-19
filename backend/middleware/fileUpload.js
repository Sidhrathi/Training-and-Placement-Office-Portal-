const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/ErrorResponse');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    
    // Determine upload folder based on file type
    if (file.fieldname === 'resume') {
      uploadPath = './Uploads/resumes';
    } else if (file.fieldname === 'profileImage') {
      uploadPath = './Uploads/profile';
    } else if (file.fieldname === 'jobDocuments') {
      uploadPath = './Uploads/jobs';
    } else if (file.fieldname === 'questionsFile') {
      uploadPath = './Uploads/examQuestions';
    } else {
      uploadPath = './Uploads/misc';
    }
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use student USN or timestamp for unique naming
    const uniquePrefix = req.user ? req.user.usn || req.user.id : Date.now();
    cb(null, `${uniquePrefix}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Accept only PDFs for resumes
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Please upload resume in PDF format only', 400), false);
    }
  } else if (file.fieldname === 'profileImage') {
    // Accept only images for profile pictures
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Please upload only image files', 400), false);
    }
  } else if (file.fieldname === 'questionsFile') {
    // Accept CSV and Excel files for exam questions
    if (
      file.mimetype === 'text/csv' || 
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Please upload questions in CSV or Excel format only', 400), false);
    }
  } else {
    // For other documents
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Please upload valid document formats only (PDF, Word, Excel)', 400), false);
    }
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware for resume upload
exports.uploadResume = upload.single('resume');

// Middleware for profile image upload
exports.uploadProfileImage = upload.single('profileImage');

// Middleware for job documents
exports.uploadJobDocuments = upload.array('jobDocuments', 5);

// Middleware for exam questions file upload
exports.uploadExamQuestions = upload.single('questionsFile');

// Handle upload errors
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorResponse('File too large. Maximum size is 10MB', 400));
    }
    return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
  } else if (err) {
    return next(err);
  }
  next();
};