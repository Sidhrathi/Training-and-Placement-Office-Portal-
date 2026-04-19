const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add exam title']
  },
  description: String,
  type: {
    type: String,
    enum: ['Aptitude', 'Technical', 'Verbal', 'Coding', 'Mock Interview', 'Personality'],
    required: [true, 'Please specify exam type']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Please specify exam duration']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please specify total marks']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Please specify passing marks']
  },
  passingPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  scheduledFor: {
    type: Date,
    required: [true, 'Please specify exam date and time']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Please specify registration deadline']
  },
  timePerQuestion: {
    type: Number,
    default: 60 // seconds per question by default
  },
  showResults: {
    type: Boolean,
    default: true
  },
  allowReattempt: {
    type: Boolean,
    default: false
  },
  randomizeQuestions: {
    type: Boolean,
    default: true
  },
  eligibility: {
    departments: [{
      type: String
    }],
    branches: [{
      type: String
    }],
    semesters: [{
      type: String
    }],
    minCGPA: Number,
    minPercentage: Number,
    maxBacklogs: Number,
    batch: String
  },
  instructions: {
    type: String,
    default: ''
  },
  sections: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    duration: Number, // section-specific duration (in minutes)
    questions: [{
      type: {
        type: String,
        enum: ['MCQ', 'MultiSelect', 'TrueFalse', 'ShortAnswer', 'Coding'],
        default: 'MCQ'
      },
      question: {
        type: String,
        required: true
      },
      code: String, // For code snippets in questions
      options: [{
        type: String
      }],
      correctAnswer: {
        type: mongoose.Schema.Types.Mixed, // Can be String, Number, or Array for multi-select
        required: true
      },
      explanation: String, // Explanation of the answer
      marks: {
        type: Number,
        default: 1
      },
      negativeMarks: {
        type: Number,
        default: 0
      },
      difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
      },
      tags: [String] // Tags for categorizing questions
    }]
  }],
  // Legacy questions field maintained for backward compatibility
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    correctOption: {
      type: Number,
      required: true
    },
    marks: {
      type: Number,
      default: 1
    }
  }],
  registeredStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'appeared', 'absent'],
      default: 'registered'
    }
  }],
  results: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    score: Number,
    totalMarks: Number,
    percentage: Number,
    status: {
      type: String,
      enum: ['pass', 'fail'],
      required: true
    },
    submittedAt: Date,
    responses: [{
      questionId: mongoose.Schema.Types.ObjectId,
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      marks: Number
    }],
    sectionWiseScores: [{
      section: String,
      score: Number,
      attempted: Number,
      correct: Number,
      incorrect: Number
    }]
  }],
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: true
  },
  documents: [{
    title: String,
    file: String
  }],
  questionsFile: {
    originalName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
examSchema.index({ status: 1, scheduledFor: 1 });
examSchema.index({ createdBy: 1, status: 1 });
examSchema.index({ 'registeredStudents.student': 1 });

// Virtual field for registration status
examSchema.virtual('isRegistrationOpen').get(function() {
  return Date.now() <= this.registrationDeadline;
});

// Virtual field for exam status
examSchema.virtual('examStatus').get(function() {
  const now = new Date();
  if (now < this.scheduledFor) return 'upcoming';
  if (now > this.scheduledFor && now < new Date(this.scheduledFor.getTime() + this.duration * 60000)) return 'ongoing';
  return 'completed';
});

// Method to check if a student is eligible
examSchema.methods.isStudentEligible = async function(student) {
  if (!this.eligibility) return true;
  
  const isEligible = (
    (!this.eligibility.branches?.length || this.eligibility.branches.includes(student.branch)) &&
    (!this.eligibility.minCGPA || student.cgpa >= this.eligibility.minCGPA) &&
    (!this.eligibility.maxBacklogs || student.backlogs <= this.eligibility.maxBacklogs) &&
    (!this.eligibility.batch || student.batch === this.eligibility.batch) &&
    (!this.eligibility.semester || student.semester === this.eligibility.semester)
  );

  return isEligible;
};

// Helper to calculate total questions in the exam
examSchema.virtual('totalQuestions').get(function() {
  if (this.sections && this.sections.length > 0) {
    return this.sections.reduce((total, section) => {
      return total + section.questions.length;
    }, 0);
  } else if (this.questions) {
    return this.questions.length;
  }
  return 0;
});

module.exports = mongoose.model('Exam', examSchema);