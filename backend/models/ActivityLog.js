const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userType: {
    type: String,
    enum: ['Admin', 'TPO', 'Student'],
    default: 'Admin'
  },
  userName: {
    type: String,
    default: 'System'
  },
  resource: {
    type: String,
    default: null
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'error', 'warning', 'info'],
    default: 'info'
  },
  ip: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ user: 1 });
ActivityLogSchema.index({ status: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);