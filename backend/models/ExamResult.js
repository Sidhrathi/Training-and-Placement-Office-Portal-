const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentageScore: {
    type: Number,
    required: true
  },
  responses: [
    {
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
    }
  ],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Abandoned', 'Timed Out'],
    default: 'Completed'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
examResultSchema.index({ exam: 1, student: 1 });
examResultSchema.index({ student: 1 });
examResultSchema.index({ createdAt: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
