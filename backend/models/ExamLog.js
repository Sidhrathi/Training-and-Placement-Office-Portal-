const mongoose = require('mongoose');

const examLogSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  action: {
    type: String,
    enum: ['register', 'start', 'submit', 'timeout', 'error'],
    required: true
  },
  details: {
    browser: String,
    os: String,
    ip: String,
    userAgent: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  error: {
    message: String,
    stack: String
  },
  // Fields for exam attempt information
  status: {
    type: String,
    enum: ['In-Progress', 'Completed', 'Timed-Out', 'Abandoned'],
    default: 'In-Progress'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  // Fields for exam results
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed
    },
    score: {
      type: Number,
      default: 0
    },
    maxScore: {
      type: Number,
      default: 1
    },
    correct: {
      type: Boolean,
      default: false
    }
  }],
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 0
  },
  percentageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
examLogSchema.index({ exam: 1, student: 1, action: 1 });
examLogSchema.index({ createdAt: 1 });

// Static method to log exam activity
examLogSchema.statics.logActivity = async function(examId, studentId, action, req, error = null, metadata = {}) {
  try {
    const details = {
      browser: req.headers['user-agent'],
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    const logData = {
      exam: examId,
      student: studentId,
      action,
      details,
      metadata
    };

    if (error) {
      logData.error = {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    await this.create(logData);
  } catch (err) {
    console.error('Failed to create exam log:', err);
  }
};

// Static method to get exam statistics
examLogSchema.statics.getExamStats = async function(examId) {
  const stats = await this.aggregate([
    { $match: { exam: mongoose.Types.ObjectId(examId) } },
    { $group: {
      _id: '$action',
      count: { $sum: 1 }
    }},
    { $project: {
      _id: 0,
      action: '$_id',
      count: 1
    }}
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat.action] = stat.count;
    return acc;
  }, {});
};

module.exports = mongoose.model('ExamLog', examLogSchema);