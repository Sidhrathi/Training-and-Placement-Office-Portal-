const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add company name']
  },
  companyWebsite: String,
  jobRole: {
    type: String,
    required: [true, 'Please add job role']
  },
  category: {
    type: String,
    enum: ['IT', 'Core', 'Management'],
    required: [true, 'Please specify job category']
  },
  description: {
    type: String,
    required: [true, 'Please add job description']
  },
  package: {
    basePay: {
      type: Number,
      required: [true, 'Please specify base pay']
    },
    totalCTC: Number,
    breakup: {
      type: Map,
      of: String
    }
  },
  location: String,
  type: {
    type: String,
    enum: ['full-time', 'internship', 'contract'],
    required: [true, 'Please specify job type']
  },
  eligibility: {
    branches: [{
      type: String,
      required: true
    }],
    minCGPA: {
      type: Number,
      required: [true, 'Please specify minimum CGPA']
    },
    maxBacklogs: {
      type: Number,
      default: 0
    },
    minTenthPercentage: Number,
    minTwelfthPercentage: Number,
    otherRequirements: [String]
  },
  driveDetails: {
    startDate: {
      type: Date,
      required: [true, 'Please specify drive start date']
    },
    lastDateToApply: {
      type: Date,
      required: [true, 'Please specify last date to apply']
    },
    rounds: [{
      roundNumber: Number,
      type: String,
      description: String,
      date: Date,
      venue: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  applications: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'selected', 'withdrawn'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    roundStatus: [{
      roundNumber: Number,
      status: {
        type: String,
        enum: ['pending', 'passed', 'failed']
      },
      marks: Number,
      feedback: String
    }]
  }],
  selectedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: true
  },
  documents: [{
    title: String,
    file: String
  }],
  attachments: [{
    title: String,
    file: String
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
jobSchema.index({ status: 1, 'driveDetails.startDate': 1 });
jobSchema.index({ companyName: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ createdBy: 1, status: 1 });
jobSchema.index({ 'applications.student': 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);