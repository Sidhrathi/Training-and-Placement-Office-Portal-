const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  userModel: {
    type: String,
    enum: ['Admin', 'TPO', 'Student', 'Unknown'],
    default: 'Unknown'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel'
  },
  errorMessage: {
    type: String,
    required: true
  },
  errorStack: String,
  path: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
errorLogSchema.index({ timestamp: -1 });
errorLogSchema.index({ userModel: 1, userId: 1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);