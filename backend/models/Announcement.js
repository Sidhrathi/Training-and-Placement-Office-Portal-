const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide announcement title'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please provide announcement type'],
    enum: ['general', 'placement', 'academic', 'event']
  },
  priority: {
    type: String,
    default: 'low',
    enum: ['low', 'medium', 'high']
  },
  visibility: {
    type: String,
    required: [true, 'Please specify visibility'],
    enum: ['all', 'students', 'tpos']
  },
  content: {
    type: String,
    required: [true, 'Please provide announcement content']
  },
  attachments: [{
    fileName: String,
    fileType: String,
    fileURL: String
  }],
  expiryDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'creatorType'
  },
  creatorType: {
    type: String,
    required: true,
    enum: ['Admin', 'TPO']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for search
announcementSchema.index({ title: 'text', content: 'text', type: 1, visibility: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);