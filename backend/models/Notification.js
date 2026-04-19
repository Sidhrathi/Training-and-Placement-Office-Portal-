const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add notification title']
  },
  message: {
    type: String,
    required: [true, 'Please add notification message']
  },
  type: {
    type: String,
    enum: ['job', 'exam', 'placement', 'general', 'reminder'],
    required: [true, 'Please specify notification type']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  recipients: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userModel'
      },
      userModel: {
        type: String,
        enum: ['Student', 'TPO', 'Admin']
      },
      read: {
        type: Boolean,
        default: false
      },
      readAt: Date
    }],
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Job', 'Exam', 'Announcement']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.model'
    }
  },
  validUntil: {
    type: Date
  },
  actions: [{
    text: String,
    url: String
  }],
  createdBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdBy.userModel',
      required: true
    },
    userModel: {
      type: String,
      enum: ['Admin', 'TPO'],
      required: true
    }
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
notificationSchema.index({ 'recipients.user': 1, 'recipients.read': 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = async function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && !recipient.read) {
    recipient.read = true;
    recipient.readAt = new Date();
    await this.save();
  }
};

// Static method to create notifications for multiple recipients
notificationSchema.statics.createMultiple = async function(notificationData, recipientIds, userModel) {
  const recipients = recipientIds.map(id => ({
    user: id,
    userModel,
    read: false
  }));

  const notification = await this.create({
    ...notificationData,
    recipients
  });

  return notification;
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    'recipients.user': userId,
    'recipients.read': false
  });
};

module.exports = mongoose.model('Notification', notificationSchema);