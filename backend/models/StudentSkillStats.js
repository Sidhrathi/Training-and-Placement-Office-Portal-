const mongoose = require('mongoose');

const studentSkillStatsSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  aptitudeScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  programmingScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  englishScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalExamsAttempted: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentSkillStats', studentSkillStatsSchema);